import { Prisma } from '@prisma/client';

const eventWithScores = Prisma.validator<Prisma.EventArgs>()({ include: { scores: true } });
type EventWithScores = Prisma.EventGetPayload<typeof eventWithScores>;

export function generateHisto(event: EventWithScores) {
	const rawScores = event.scores
		.flatMap((e) => (e.rawScore == null ? [] : [e.rawScore]))
		.sort((a, b) => a - b);

	if (rawScores.length === 0) {
		return false;
	}

	const numBins = Math.ceil(Math.sqrt(rawScores.length));

	const start = rawScores[0];
	const width = Math.ceil((rawScores[rawScores.length - 1] - rawScores[0]) / numBins);
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
		start: Math.round(start * 1000) / 1000,
		width: Math.round(width * 1000) / 1000,
		counts,
		info: {
			Min: (Math.round(rawScores[0] * 1000) / 1000).toString(),
			Max: (Math.round(rawScores[rawScores.length - 1] * 1000) / 1000).toString(),
			Avg: (
				Math.round((rawScores.reduce((a, b) => a + b) / rawScores.length) * 1000) / 1000
			).toString(),
			StDev: (Math.round(stdev(rawScores) * 1000) / 1000).toString()
		}
	};
}
