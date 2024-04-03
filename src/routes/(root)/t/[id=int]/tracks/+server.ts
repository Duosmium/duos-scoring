import { addTracks, deleteTrack, updateTrack } from '$lib/db';
import type { Track } from '@prisma/client';
import type { RequestHandler } from './$types';
import { checkScoremasterPerms } from '$lib/utils';

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		track?: string;
		tracks?: string[];
	} = await request.json();
	const tracks = [];
	if (payload.track && typeof payload.track === 'string') {
		tracks.push(BigInt(payload.track));
	} else if (
		payload.tracks &&
		Array.isArray(payload.tracks) &&
		payload.tracks.every((track) => typeof track === 'string')
	) {
		tracks.push(...payload.tracks.map((id) => BigInt(id)));
	} else {
		return new Response('missing track', { status: 404 });
	}

	const status = (await Promise.all(tracks.map((trackId) => deleteTrack(trackId)))).every((b) => b);

	if (!status) {
		return new Response('failed to delete', { status: 500 });
	}
	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		id?: string;
		data?: Partial<Track>;
	} = await request.json();
	if (!payload.id || typeof payload.id !== 'string') {
		return new Response('missing track', { status: 404 });
	}
	if (!payload.data) {
		// TODO: validate data
		return new Response('invalid payload', { status: 400 });
	}

	const trackId = BigInt(payload.id);
	const status = await updateTrack(trackId, payload.data);

	if (!status) {
		return new Response('failed to update', { status: 500 });
	}
	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: Track[] = await request.json();

	// TODO: validate data

	const status = await addTracks(params.id, payload);

	if (!status) {
		return new Response('failed to add tracks', { status: 500 });
	}
	return new Response('ok');
};
