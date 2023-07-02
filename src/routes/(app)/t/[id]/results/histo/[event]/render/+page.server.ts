import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { generateHisto } from '$lib/scoreUtils';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const event = locals.tournament.events?.find((e) => e.id.toString() === params.event);
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
