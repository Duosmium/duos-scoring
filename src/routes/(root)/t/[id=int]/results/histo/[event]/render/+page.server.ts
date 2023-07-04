import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/utils';
import { generateHisto } from '$lib/scoreUtils';
import { getEvents } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const event = ((await getEvents(params.id)) || []).find((e) => e.id.toString() === params.event);
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
