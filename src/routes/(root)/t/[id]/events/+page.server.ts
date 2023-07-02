import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getEvents, getRoles, getTeams } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const roles = (await getRoles(params.id)) || [];
	const events = (await getEvents(params.id)) || [];
	const teams = (await getTeams(params.id)) || [];
	return {
		roles,
		events,
		teams
	};
};
