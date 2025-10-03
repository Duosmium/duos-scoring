import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SENTRY_DSN,
	PUBLIC_SENTRY_ENV
} from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

import type { Handle } from '@sveltejs/kit';

import * as Sentry from '@sentry/sveltekit';
import {
	createOrUpdateUser,
	getTournamentInfo,
	getUserInfo,
	isAdmin
} from '$lib/server/db';
import { sequence } from '@sveltejs/kit/hooks';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0.5,
	environment: PUBLIC_SENTRY_ENV || 'production'
});

export const handleError = Sentry.handleErrorWithSentry();

const handler: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies API requires `path` to be explicitly set in
				 * the cookie options. Setting `path` to `/` replicates previous/
				 * standard behavior.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

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
	if (
		event.url.pathname.startsWith('/auth') ||
		(event.url.pathname.startsWith('/login') &&
			event.url.searchParams.get('reset') !== null)
	) {
		return await resolve(event);
	}

	// don't do any redirects when handling static assets
	if (event.url.pathname.startsWith('/assets')) {
		return await resolve(event);
	}

	// don't redirect when handling student checklist access
	if (event.url.pathname.startsWith('/checklists/')) {
		return await resolve(event);
	}

	// get the current session or try logging in with a passed supabase code
	const returned = await event.locals.safeGetSession();
	const supabaseUser = returned.user;
	let session = returned.session;
	if (!session && event.url.searchParams.get('code') !== null) {
		session = (
			await event.locals.supabase.auth.exchangeCodeForSession(
				event.url.searchParams.get('code')!
			)
		).data.session;
	}

	const loginRoute = event.url.pathname.startsWith('/login');
	const homeRoute = event.url.pathname === '/';
	if (!session) {
		// if user is not logged in and trying to access the login page or home page
		if (loginRoute || homeRoute) {
			return await resolve(event);
		}
		// remember if the user is trying to use an invite link for redirecting after
		if (event.url.pathname.startsWith('/invite/')) {
			return new Response(undefined, {
				status: 303,
				headers: {
					location: `/login?invite=${event.url.pathname.split('/')[2]}`
				}
			});
		}
		// otherwise redirect to the login page if not logged in
		return new Response(undefined, {
			status: 303,
			headers: { location: '/login' }
		});
	}
	if (loginRoute && event.url.searchParams.get('reset') !== null) {
		// user is logged in and trying to reset their password
		return await resolve(event);
	}
	if (loginRoute) {
		// user is logged in and trying to access the login page, redirect them to dashboard
		return new Response(undefined, {
			status: 303,
			headers: { location: '/dashboard' }
		});
	}

	event.locals.userId = supabaseUser!.id;

	// get the current user from the database
	let user = await getUserInfo(event.locals.userId);
	if (user === false && supabaseUser) {
		await createOrUpdateUser(
			event.locals.userId,
			supabaseUser?.user_metadata.name?.trim() || 'Unknown User'
		);
		user = await getUserInfo(event.locals.userId);
	}
	if (user === false) {
		return new Response(undefined, {
			status: 303,
			headers: { location: '/dashboard' }
		});
	}
	event.locals.user = user;

	// check permissions if user is trying to access a tournament page
	if (event.url.pathname.startsWith('/t') && event.params.id) {
		const tournament = await getTournamentInfo(event.params.id);
		if (tournament === false) {
			return new Response(undefined, {
				status: 303,
				headers: { location: '/dashboard' }
			});
		}

		const admin = await isAdmin(user.id);
		const role =
			user.roles.find((r) => r.tournament.id.toString() === event.params.id) ||
			(admin
				? {
						id: BigInt(-1),
						role: 'TD' as const,
						tournament,
						tournamentId: tournament.id,
						supEvents: [],
						userId: user.id
					}
				: undefined);
		if (!role) {
			return new Response(undefined, {
				status: 303,
				headers: { location: '/dashboard' }
			});
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

export const handle = sequence(Sentry.sentryHandle(), handler);
