import { updateTournament } from '$lib/db';
import type { Tournament } from '@prisma/client';
import type { RequestHandler } from './$types';
import { checkIsDirector } from '$lib/utils';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: Partial<Tournament> = await request.json();
	if (!payload) {
		// TODO: validate data
		return new Response('invalid payload', { status: 400 });
	}

	await updateTournament(params.id, payload);

	return new Response('ok');
};
