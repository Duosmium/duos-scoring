import type { LayoutServerLoad } from './$types';
import { checkTournamentAccess } from '$lib/utils';
import { getEvents, getTeams } from '$lib/db';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	await checkTournamentAccess(locals.user, params.id);

	if (locals.role?.isDirector) {
		return {
			events: (await getEvents(params.id)) || [],
			teams: (await getTeams(params.id)) || []
		};
	}
	return;
};
