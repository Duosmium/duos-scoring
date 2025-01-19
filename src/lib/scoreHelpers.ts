import type { Event, Team, Score, ScoreStatus } from '$drizzle/types';

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

const statusOrder = {
	COMPETED: 0,
	PARTICIPATION: 1,
	NOSHOW: 2,
	DISQUALIFICATION: 3,
	NA: 4,
	CO: 0,
	PO: 1,
	NS: 2,
	DQ: 3,
	'N/A': 4
} as const;

const statusLookup = {
	NA: 'N/A',
	COMPETED: 'CO',
	PARTICIPATION: 'PO',
	NOSHOW: 'NS',
	DISQUALIFICATION: 'DQ'
} as const;

interface ScoreLike {
	status: ScoreStatus | 'NA';
	tier?: number | null;
	rawScore?: number | null;
	tiebreak?: number | null;
}

export function compareTeams(
	a: ScoreLike | undefined,
	b: ScoreLike | undefined,
	highScoring: boolean
) {
	return a && b
		? statusOrder[a.status] - statusOrder[b.status] ||
				(a.tier ?? 1) - (b.tier ?? 1) ||
				(highScoring
					? (b.rawScore ?? 0) - (a.rawScore ?? 0)
					: (a.rawScore ?? Infinity) - (b.rawScore ?? Infinity)) ||
				(b.tiebreak ?? 0) - (a.tiebreak ?? 0)
		: a
			? -1
			: b
				? 1
				: 0;
}

export function computeEventRankings(
	event: Event,
	teams: Team[],
	scores: ScoreWithEventAndTeam[]
) {
	const teamScores = new Map(scores.map((s) => [s.teamId, s] as const));
	return teams
		.map((t) => {
			const s = teamScores.get(t.id);
			if (s) {
				return {
					...s,
					ranking: -1 as
						| number
						| (typeof statusLookup)[keyof typeof statusLookup],
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
					status: 'NOSHOW' as const,
					ranking: 'NOSHOW' as const,
					tie: false
				};
			}
		})
		.sort((a, b) => compareTeams(a, b, event.highScoring))
		.map((t, i, s) => {
			// check ties
			if (
				t.status === 'COMPETED' &&
				(compareTeams(t, s[i - 1], event.highScoring) === 0 ||
					compareTeams(t, s[i + 1], event.highScoring) === 0)
			) {
				t.tie = true;
			} else {
				t.tie = false;
			}
			return t;
		})
		.map((t, i, s) => {
			t.ranking =
				t.status !== 'COMPETED'
					? statusLookup[t.status]
					: compareTeams(t, s[i - 1], event.highScoring) === 0
						? s[i - 1].ranking
						: i + 1;
			return t;
		});
}
