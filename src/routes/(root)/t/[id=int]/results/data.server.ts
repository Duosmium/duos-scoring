import { computeEventRankings, generateHisto } from '$lib/scoreUtils';
import { getEvents, getTeams, getTracks } from '$lib/db';
import type { Histos } from '$lib/sciolyffHelpers';

export async function fetchScores(id: string) {
	const events = (await getEvents(id)) || [];
	const teams = (await getTeams(id)) || [];
	const tracks = (await getTracks(id)) || [];

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
	}, new Map() as Histos);

	return {
		events,
		teams,
		tracks,
		rankings: [...rankingsByTeam.values()].flat(),
		histos
	};
}
