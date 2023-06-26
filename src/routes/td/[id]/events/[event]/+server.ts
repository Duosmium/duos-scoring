import { updateEvent } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	const payload: {
		highScoring?: 'true' | 'false';
		medals?: number;
	} = await request.json();
	if (payload.highScoring && !['true', 'false'].includes(payload.highScoring))
		return new Response('invalid highScoring', { status: 400 });
	if (payload.medals && typeof payload.medals !== 'number')
		return new Response('invalid medals', { status: 400 });

	const eventId = BigInt(params.event);
	await updateEvent(eventId, {
		highScoring: payload.highScoring ? payload.highScoring === 'true' : undefined,
		medals: payload.medals
	});

	return new Response('ok');
};
