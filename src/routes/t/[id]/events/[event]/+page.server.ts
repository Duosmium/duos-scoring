import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getTournamentInfo, getEventScores } from '$lib/db';
import { checkEventPerms } from '$lib/utils';

export const load: PageLoad = async ({ params, locals }) => {
	await checkEventPerms(locals.userId, BigInt(params.event));

	const tournament = await getTournamentInfo(params.id);

	if (tournament === false) {
		throw error(404, 'Tournament not found');
	}

	const event = tournament.events.find((event) => event.id.toString() === params.event);

	if (event == undefined) {
		throw error(404, 'Event not found');
	}

	// TODO: check permissions again
	const scores = await getEventScores(event.id);

	return { event, scores };
};
