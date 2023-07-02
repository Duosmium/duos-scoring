import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getEventRankings, getTournamentInfo } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.userId, params.id);

	const tournament = await getTournamentInfo(params.id);
	if (tournament === false) {
		throw error(404, 'Tournament not found');
	}

	const rankings = await Promise.all(
		tournament.events.map(async (e) => await getEventRankings(e.id))
	);
	const rankingsByTeam = rankings.reduce((acc, cur) => {
		cur.forEach((r) => {
			if (acc.get(r.teamId) === undefined) {
				acc.set(r.teamId, []);
			}
			acc.get(r.teamId)?.push(r);
		});
		return acc;
	}, new Map<bigint, (typeof rankings)[number]>());

	return {
		rankings: [...rankingsByTeam.values()]
	};
};
