import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/utils';
import { computeEventRankings, generateHisto } from '$lib/scoreUtils';
import { getEvents, getRoles, getTeams, getTracks } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const events = (await getEvents(params.id)) || [];
	const teams = (await getTeams(params.id)) || [];
	const tracks = (await getTracks(params.id)) || [];
	const roles = (await getRoles(params.id)) || [];

	const rankings = events.map((e) => computeEventRankings(e, teams, e.scores));
	const rankingsByTeam = rankings.reduce((acc, cur) => {
		cur.forEach((r) => {
			if (acc.get(r.teamId) === undefined) {
				acc.set(r.teamId, []);
			}
			acc.get(r.teamId)?.push(r);
		});
		return acc;
	}, new Map<bigint, (typeof rankings)[number]>());
	const histos = events.reduce((acc, event) => {
		const histo = generateHisto(event);
		if (histo === false) return acc;
		acc.set(event.id, histo);
		return acc;
	}, new Map<bigint, { start: number; width: number; counts: number[]; info: Record<string, string> }>());

	return {
		events,
		roles,
		teams,
		tracks,
		rankings: [...rankingsByTeam.values()],
		histos
	};
};
