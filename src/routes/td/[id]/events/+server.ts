import { addEvents, deleteEvent, updateEvent } from '$lib/db';
import { EventStatus } from '@prisma/client';
import type { RequestHandler } from './$types';
import slugify from 'slugify';

export const DELETE: RequestHandler = async ({ request }) => {
	const payload: {
		event?: string;
		events?: string[];
	} = await request.json();
	const events = [];
	if (payload.event && typeof payload.event === 'string') {
		events.push(BigInt(payload.event));
	} else if (
		payload.events &&
		Array.isArray(payload.events) &&
		payload.events.every((event) => typeof event === 'string')
	) {
		events.push(...payload.events.map((id) => BigInt(id)));
	} else {
		return new Response('missing event', { status: 404 });
	}

	await Promise.all(events.map((eventId) => deleteEvent(eventId)));

	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ request }) => {
	const payload: {
		event?: string;
		status?: EventStatus;
	} = await request.json();
	if (!payload.event || typeof payload.event !== 'string')
		return new Response('missing event', { status: 404 });
	if (!payload.status || !Object.values(EventStatus).includes(payload.status))
		return new Response('invalid status', { status: 400 });

	const eventId = BigInt(payload.event);
	await updateEvent(eventId, { status: payload.status });

	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const payload: {
		name?: string;
		status?: EventStatus;
		highScoring?: 'true' | 'false';
	} = await request.json();
	if (!payload.name || typeof payload.name !== 'string')
		return new Response('missing name', { status: 400 });
	if (!payload.status || !Object.values(EventStatus).includes(payload.status))
		return new Response('invalid status', { status: 400 });
	if (!payload.highScoring || !['true', 'false'].includes(payload.highScoring))
		return new Response('invalid highScoring', { status: 400 });

	await addEvents(params.id, [
		{
			name: payload.name,
			slug: slugify(payload.name, {
				lower: true,
				strict: true,
				trim: true
			}),
			status: payload.status,
			highScoring: payload.highScoring === 'true'
		}
	]);

	return new Response('ok');
};
