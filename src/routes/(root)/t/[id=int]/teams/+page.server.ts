import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/server/utils';
import { getTeams, getTracks } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const teams = (await getTeams(params.id)) || [];
	const tracks = (await getTracks(params.id)) || [];

	return {
		teams,
		tracks
	};
};
