import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/server/utils';
import { generateHisto } from '$lib/scoreHelpers';
import { getEvents } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const event = ((await getEvents(params.id)) || []).find(
		(e) => e.id.toString() === params.event
	);
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
