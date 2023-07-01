import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getTournamentInfo } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.userId, params.id);

	const tournament = await getTournamentInfo(params.id);
	if (!tournament) {
		return {
			error: 'Tournament not found!'
		};
	}

	const event = tournament.events.find((e) => e.id.toString() === params.event);
	if (!event) {
		return {
			error: 'Event not found!'
		};
	}

	const rawScores = event.scores
		.flatMap((e) => (e.rawScore == null ? [] : [e.rawScore]))
		.sort((a, b) => a - b);

	if (rawScores.length === 0) {
		return {
			error: 'No scores inputted.'
		};
	}

	const numBins = Math.ceil(Math.sqrt(rawScores.length));

	const start = rawScores[0];
	const width = (rawScores[rawScores.length - 1] - rawScores[0]) / numBins;
	const counts = rawScores.reduce((acc, s) => {
		acc[Math.min(Math.floor((s - start) / width), numBins - 1)] += 1;
		return acc;
	}, new Array(numBins).fill(0));

	// https://stackoverflow.com/a/53577159
	function stdev(array: number[]) {
		const n = array.length;
		const mean = array.reduce((a, b) => a + b) / n;
		return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
	}

	return {
		name: event.name,
		histograms: {
			start: Math.round(start * 1000) / 1000,
			width: Math.round(width * 1000) / 1000,
			counts,
			info: [
				{ key: 'Min', value: (Math.round(rawScores[0] * 1000) / 1000).toString() },
				{
					key: 'Max',
					value: (Math.round(rawScores[rawScores.length - 1] * 1000) / 1000).toString()
				},
				{
					key: 'Avg',
					value: (
						Math.round((rawScores.reduce((a, b) => a + b) / rawScores.length) * 1000) / 1000
					).toString()
				},
				{ key: 'StDev', value: (Math.round(stdev(rawScores) * 1000) / 1000).toString() }
			]
		}
	};
};
