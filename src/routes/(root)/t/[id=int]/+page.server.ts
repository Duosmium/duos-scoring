import type { LayoutServerLoad } from './$types';
import { checkTournamentAccess } from '$lib/server/utils';
import { getEvents, getTeams } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	await checkTournamentAccess(locals.user, params.id);

	if (locals.role?.role !== 'ES') {
		return {
			events: (await getEvents(params.id)) || [],
			teams: (await getTeams(params.id)) || []
		};
	}
	return;
};
