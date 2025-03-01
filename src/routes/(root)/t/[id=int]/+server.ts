import { updateTournament } from '$lib/server/db';
import type { Tournament } from '$drizzle/types';
import type { RequestHandler } from './$types';
import { checkIsDirector } from '$lib/server/utils';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: Partial<Tournament> = await request.json();
	if (!payload) {
		// TODO: validate data
		return new Response('invalid payload', { status: 400 });
	}

	payload.startDate &&= new Date(payload.startDate);
	payload.endDate &&= new Date(payload.endDate);
	payload.awardsDate &&= new Date(payload.awardsDate);

	// don't allow approval from this endpoint
	payload.approved = undefined;

	const status = await updateTournament(params.id, payload);

	if (!status) {
		return new Response('failed to update', { status: 500 });
	}
	return new Response('ok');
};
