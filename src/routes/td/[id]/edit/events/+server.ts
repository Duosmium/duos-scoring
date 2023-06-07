import { deleteEvent } from '$lib/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ url }) => {
	const event = url.searchParams.get('event');
	if (!event) return new Response('missing event', { status: 400 });

	const eventId = BigInt(event);
	await deleteEvent(eventId);

	return new Response('ok');
};
