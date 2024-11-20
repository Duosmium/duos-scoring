import { addEvents, deleteEvent, updateEvent } from '$lib/server/db';
import type { TrialStatus } from '$drizzle/types';
import type { RequestHandler } from './$types';
import { checkScoremasterPerms } from '$lib/server/utils';

export const DELETE: RequestHandler = async ({ request, params, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

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

	const status = (
		await Promise.all(events.map((eventId) => deleteEvent(eventId)))
	).every((b) => b);

	if (!status) {
		return new Response('failed to delete', { status: 500 });
	}
	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		event?: string;
		name?: string;
		trialStatus?: TrialStatus;
		highScoring?: 'true' | 'false';
		medals?: number;
	} = await request.json();
	if (!payload.event || typeof payload.event !== 'string')
		return new Response('missing event', { status: 404 });
	if (payload.name && typeof payload.name !== 'string')
		return new Response('invalid name', { status: 400 });
	if (
		payload.trialStatus &&
		!['SCORING', 'TRIAL', 'TRIALED'].includes(payload.trialStatus)
	)
		return new Response('invalid status', { status: 400 });
	if (payload.highScoring && !['true', 'false'].includes(payload.highScoring))
		return new Response('invalid highScoring', { status: 400 });
	if (payload.medals && typeof payload.medals !== 'number')
		return new Response('invalid medals', { status: 400 });

	const eventId = BigInt(payload.event);
	const status = await updateEvent(eventId, {
		name: payload.name,
		trialStatus: payload.trialStatus,
		highScoring: payload.highScoring
			? payload.highScoring === 'true'
			: undefined,
		medals: payload.medals
	});

	if (!status) {
		return new Response('error updating event', { status: 500 });
	}
	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		name?: string;
		trialStatus?: TrialStatus;
		highScoring?: 'true' | 'false';
		medals?: number;
	} = await request.json();
	if (!payload.name || typeof payload.name !== 'string')
		return new Response('missing name', { status: 400 });
	if (
		!payload.trialStatus ||
		!['SCORING', 'TRIAL', 'TRIALED'].includes(payload.trialStatus)
	)
		return new Response('invalid status', { status: 400 });
	if (!payload.highScoring || !['true', 'false'].includes(payload.highScoring))
		return new Response('invalid highScoring', { status: 400 });
	if (payload.medals && typeof payload.medals !== 'number')
		return new Response('invalid medals', { status: 400 });

	const status = await addEvents(params.id, [
		{
			name: payload.name,
			trialStatus: payload.trialStatus,
			highScoring: payload.highScoring === 'true',
			medals: payload.medals
		}
	]);

	if (!status) {
		return new Response('error adding event', { status: 500 });
	}
	return new Response('ok');
};
