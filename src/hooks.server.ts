import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SENTRY_DSN } from '$env/static/private';
import { createServerClient } from '@supabase/ssr';

import type { Handle, HandleServerError } from '@sveltejs/kit';

import * as SentryNode from '@sentry/node';
import '@sentry/tracing';
import { createOrUpdateUser, getTournamentInfo, getUserInfo } from '$lib/db';

SentryNode.init({
	dsn: SENTRY_DSN,
	tracesSampleRate: 1.0,
	// Add the Http integration for tracing
	integrations: [new SentryNode.Integrations.Http()]
});

SentryNode.setTag('svelteKit', 'server');

// use handleError to report errors during server-side data loading
export const handleError = (({ error, event }) => {
	SentryNode.captureException(error, { contexts: { sveltekit: { ...event } } });

	return {
		message: (error as { message: string }).message
	};
}) satisfies HandleServerError;

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => event.cookies.get(key),
			/**
			 * Note: You have to add the `path` variable to the
			 * set and remove method due to sveltekit's cookie API
			 * requiring this to be set, setting the path to an empty string
			 * will replicate previous/standard behaviour (https://kit.svelte.dev/docs/types#public-types-cookies)
			 */
			set: (key, value, options) => {
				event.cookies.set(key, value, { ...options, path: '/' });
			},
			remove: (key, options) => {
				event.cookies.delete(key, { ...options, path: '/' });
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	// don't do any redirects when handling supabase auth stuff
	if (event.url.pathname.startsWith('/auth')) {
		return await resolve(event);
	}

	// get the current session or try logging in with a passed supabase code
	const returned = await event.locals.safeGetSession();
	const supabaseUser = returned.user;
	let session = returned.session;
	if (!session && event.url.searchParams.get('code') !== null) {
		session = (
			await event.locals.supabase.auth.exchangeCodeForSession(event.url.searchParams.get('code')!)
		).data.session;
	}

	const loginRoute = event.url.pathname.startsWith('/login');
	if (!session) {
		// if user is not logged in and trying to access the login page
		if (loginRoute) {
			return await resolve(event);
		}
		// remember if the user is trying to use an invite link for redirecting after
		if (event.url.pathname.startsWith('/invite/')) {
			return new Response(undefined, {
				status: 303,
				headers: { location: `/login?invite=${event.url.pathname.split('/')[2]}` }
			});
		}
		// otherwise redirect to the login page if not logged in
		return new Response(undefined, { status: 303, headers: { location: '/login' } });
	}
	if (loginRoute && event.url.searchParams.get('reset') !== null) {
		// user is logged in and trying to reset their password
		return await resolve(event);
	}
	if (loginRoute) {
		// user is logged in and trying to access the login page, redirect them to dashboard
		return new Response(undefined, { status: 303, headers: { location: '/dashboard' } });
	}

	event.locals.userId = supabaseUser!.id;

	// get the current user from the database
	let user = await getUserInfo(event.locals.userId);
	if (user === false && supabaseUser) {
		await createOrUpdateUser(event.locals.userId, supabaseUser?.user_metadata.name.trim() || '');
		user = await getUserInfo(event.locals.userId);
	}
	if (user === false) {
		return new Response(undefined, { status: 303, headers: { location: '/dashboard' } });
	}
	event.locals.user = user;

	// check permissions if user is trying to access a tournament page
	if (event.url.pathname.startsWith('/t') && event.params.id) {
		if (!user.roles.find((r) => r.tournament.id.toString() === event.params.id)) {
			return new Response(undefined, { status: 303, headers: { location: '/dashboard' } });
		}
		const role = user.roles.find((r) => r.tournament.id.toString() === event.params.id);
		const tournament = await getTournamentInfo(event.params.id);
		if (tournament === false) {
			return new Response(undefined, { status: 303, headers: { location: '/dashboard' } });
		}
		event.locals.tournament = tournament;
		event.locals.role = role;
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
