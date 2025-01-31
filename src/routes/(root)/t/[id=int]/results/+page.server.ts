import type { PageServerLoad } from './$types';

import { checkScoremasterPerms } from '$lib/server/utils';
import { getRoles, getSlides } from '$lib/server/db';
import { fetchScores } from './helpers.server';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const { events, teams, tracks, rankings, histos } = await fetchScores(
		params.id
	);

	const roles = (await getRoles(params.id)) || [];
	const slides = await getSlides(params.id);

	return {
		events,
		roles,
		teams,
		tracks,
		rankings,
		histos,
		slides
	};
};
