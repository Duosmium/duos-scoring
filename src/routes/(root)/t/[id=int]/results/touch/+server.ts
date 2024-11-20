import { getEvents, touchEventsExport } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { checkScoremasterPerms } from '$lib/server/utils';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: string[] = await request.json();
	if (!payload || payload.length === 0) {
		return new Response('missing events', { status: 404 });
	}

	const events = ((await getEvents(params.id)) || [])
		.filter((e) => payload.includes(e.id.toString()))
		.map((e) => e.id);

	const status = await touchEventsExport(events);

	if (!status) {
		return new Response('failed to touch events', { status: 500 });
	}
	return new Response('ok');
};
