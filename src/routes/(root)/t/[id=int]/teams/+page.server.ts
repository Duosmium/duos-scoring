import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/server/utils';
import { getTeams, getTracks } from '$lib/server/db';
import papaparse from 'papaparse';
import { normalize } from './shared';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const teams = (await getTeams(params.id)) || [];
	const tracks = (await getTracks(params.id)) || [];

	const canonicalNames = papaparse
		.parse<
			string[]
		>(await (await fetch('https://www.duosmium.org/results/schools.csv', { cache: 'force-cache' })).text())
		.data.map(([name, city, state]) => [normalize(name), name, city, state]);

	return {
		teams,
		tracks,
		canonicalNames
	};
};
