import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEventScores } from '$lib/db';
import { checkEventPerms } from '$lib/utils';

export const load: PageServerLoad = async ({ params, locals }) => {
	await checkEventPerms(locals.user, params.id, BigInt(params.event));

	if (!locals.tournament.events) {
		throw error(403, 'You are not authorized to view this page.');
	}

	const event = locals.tournament.events.find((event) => event.id.toString() === params.event);

	if (event == undefined) {
		throw error(404, 'Event not found');
	}

	const scores = await getEventScores(event.id);

	return { event, scores };
};
