import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/server/utils';
import { getEvents, getRoles, getTeams } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const roles = (await getRoles(params.id)) || [];
	const events = (await getEvents(params.id)) || [];
	const teams = (await getTeams(params.id)) || [];
	return {
		roles,
		events,
		teams
	};
};
