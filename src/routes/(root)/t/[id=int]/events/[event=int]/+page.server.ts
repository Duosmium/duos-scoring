import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getEventScores, getEvents, getTeams } from '$lib/db';
import { checkEventPerms } from '$lib/utils';

export const load: PageServerLoad = async ({ params, locals }) => {
	await checkEventPerms(locals.user, params.id, BigInt(params.event));

	const events = (await getEvents(params.id)) || [];

	const event = events.find((event) => event.id.toString() === params.event);

	if (event == undefined) {
		error(404, 'Event not found');
	}

	const scores = await getEventScores(event.id);
	const teams = (await getTeams(params.id)) || [];
	return { events, teams, event, scores };
};
