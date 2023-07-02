import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getTournamentInfo } from '$lib/db';
import { generateHisto } from '$lib/histoUtils';

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

	const histo = generateHisto(event);

	if (histo === false) {
		return {
			error: 'No scores inputted.'
		};
	}

	return {
		name: event.name,
		histograms: histo
	};
};
