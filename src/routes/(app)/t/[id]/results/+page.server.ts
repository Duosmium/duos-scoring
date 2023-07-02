import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { computeEventRankings, generateHisto } from '$lib/scoreUtils';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	if (locals.tournament.events === undefined) {
		throw error(403, 'You are not authorized to view this page.');
	}

	const rankings = locals.tournament.events.map((e) => computeEventRankings(e.scores));
	const rankingsByTeam = rankings.reduce((acc, cur) => {
		cur.forEach((r) => {
			if (acc.get(r.teamId) === undefined) {
				acc.set(r.teamId, []);
			}
			acc.get(r.teamId)?.push(r);
		});
		return acc;
	}, new Map<bigint, (typeof rankings)[number]>());
	const histos = locals.tournament.events.reduce((acc, event) => {
		const histo = generateHisto(event);
		if (histo === false) return acc;
		acc.set(event.id, histo);
		return acc;
	}, new Map<bigint, { start: number; width: number; counts: number[]; info: Record<string, string> }>());

	return {
		rankings: [...rankingsByTeam.values()],
		histos
	};
};
