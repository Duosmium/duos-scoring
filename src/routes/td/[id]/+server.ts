import { updateTournament } from '$lib/db';
import type { Tournament } from '@prisma/client';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const payload: Partial<Tournament> = await request.json();
	if (!payload) {
		// TODO: validate data
		return new Response('invalid payload', { status: 400 });
	}

	await updateTournament(params.id, payload);

	return new Response('ok');
};
