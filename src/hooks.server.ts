import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SENTRY_DSN } from '$env/static/private';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';

import type { Handle, HandleServerError } from '@sveltejs/kit';

import * as SentryNode from '@sentry/node';
import '@sentry/tracing';
import { getTournamentInfo, getUserInfo } from '$lib/db';

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
	event.locals.supabase = createSupabaseServerClient({
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
		event
	});

	/**
	 * a little helper that is written for convenience so that instead
	 * of calling `const { data: { session } } = await supabase.auth.getSession()`
	 * you just call this `await getSession()`
	 */
	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	const loginRoute = event.url.pathname.includes('login');
	const session = await event.locals.getSession();
	if (!session) {
		if (loginRoute) {
			return await resolve(event);
		}
		return new Response(undefined, { status: 303, headers: { location: '/login' } });
	}
	if (loginRoute) {
		return new Response(undefined, { status: 303, headers: { location: '/dashboard' } });
	}

	event.locals.userId = session.user.id;

	if (event.url.pathname.startsWith('/t') && event.params.id) {
		const user = await getUserInfo(event.locals.userId);
		if (user === false || !user.roles.find((r) => r.tournament.id === event.params.id)) {
			return new Response('You do not have permission to view this page!', { status: 403 });
		}
		const role = user.roles.find((r) => r.tournament.id === event.params.id);
		console.log('getting tournament info');
		const _ = performance.now();
		const tournament = await getTournamentInfo(event.params.id);
		console.log('got tournament info in', (performance.now() - _) / 1000);
		if (tournament === false) {
			return new Response('Tournament not found!', { status: 404 });
		}
		event.locals.tournament = tournament;
		event.locals.user = user;
		event.locals.role = role;
	}

	return resolve(event, {
		/**
		 * There´s an issue with `filterSerializedResponseHeaders` not working when using `sequence`
		 *
		 * https://github.com/sveltejs/kit/issues/8061
		 */
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
