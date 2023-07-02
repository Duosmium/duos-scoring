import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getTeams, getTracks } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const teams = (await getTeams(params.id)) || [];
	const tracks = (await getTracks(params.id)) || [];

	return {
		teams,
		tracks
	};
};
