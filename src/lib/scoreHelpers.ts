import type { Event, Team, Score } from '$drizzle/types';

type EventWithScores = Event & { scores: Score[] };
type ScoreWithEventAndTeam = Score & { event: Event; team: Team };

export function generateHisto(event: EventWithScores) {
	const rawScores = event.scores
		.flatMap((e) => (e.rawScore == null ? [] : [e.rawScore]))
		.sort((a, b) => a - b);

	if (rawScores.length === 0) {
		return false;
	}

	const numBins = Math.ceil(Math.sqrt(rawScores.length));

	const start = rawScores[0];
	const width = Math.ceil(
		(rawScores[rawScores.length - 1] - rawScores[0]) / numBins
	);
	const counts = rawScores.reduce((acc, s) => {
		acc[Math.min(Math.floor((s - start) / width), numBins - 1)] += 1;
		return acc;
	}, new Array(numBins).fill(0));

	// https://stackoverflow.com/a/53577159
	function stdev(array: number[]) {
		const n = array.length;
		const mean = array.reduce((a, b) => a + b) / n;
		return Math.sqrt(
			array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n
		);
	}

	return {
		start: Math.round(start * 1000) / 1000,
		width: Math.round(width * 1000) / 1000,
		counts,
		info: {
			Min: (Math.round(rawScores[0] * 1000) / 1000).toString(),
			Max: (
				Math.round(rawScores[rawScores.length - 1] * 1000) / 1000
			).toString(),
			Avg: (
				Math.round(
					(rawScores.reduce((a, b) => a + b) / rawScores.length) * 1000
				) / 1000
			).toString(),
			StDev: (Math.round(stdev(rawScores) * 1000) / 1000).toString()
		}
	};
}

export function computeEventRankings(
	event: Event,
	teams: Team[],
	scores: ScoreWithEventAndTeam[]
) {
	const statusOrder = {
		COMPETED: 0,
		PARTICIPATION: 1,
		NOSHOW: 2,
		NA: 2,
		DISQUALIFICATION: 3
	} as const;
	const teamScores = new Map(scores.map((s) => [s.teamId, s] as const));
	return teams
		.map((t) => {
			const s = teamScores.get(t.id);
			if (s) {
				return {
					...s,
					ranking:
						s.status === 'COMPETED'
							? s.rawScore != null
								? s.rawScore +
									((s.tiebreak || 0) - 1000000 * (s.tier || 1)) *
										(s.event.highScoring ? 1 : -1)
								: 'PARTICIPATION'
							: s.status,
					tie: false
				};
			} else {
				return {
					event,
					team: t,
					eventId: event.id,
					teamId: t.id,
					rawScore: null,
					tier: null,
					tiebreak: null,
					notes: null,
					status: 'NOSHOW',
					ranking: 'NOSHOW' as const,
					tie: false
				};
			}
		})
		.sort((a, b) =>
			typeof a.ranking === 'number' && typeof b.ranking === 'number'
				? (b.ranking - a.ranking) * (a.event.highScoring ? 1 : -1)
				: typeof a.ranking === 'string' && typeof b.ranking === 'string'
					? statusOrder[a.ranking] - statusOrder[b.ranking]
					: typeof a.ranking === 'number'
						? -1
						: 1
		)
		.map((t, i, s) => {
			// check ties
			if (
				typeof t.ranking === 'number' &&
				(t.ranking === s[i - 1]?.ranking || t.ranking === s[i + 1]?.ranking)
			) {
				t.tie = true;
			} else {
				t.tie = false;
			}
			return t;
		})
		.map((t, i, s) => ({
			...t,
			ranking:
				typeof t.ranking === 'string'
					? t.ranking
					: (t.tie ? s.findIndex((x) => x.ranking === t.ranking) : i) + 1 // do index searching for ties
		}));
}
