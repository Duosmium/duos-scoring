import { error } from '@sveltejs/kit';
import { checkScoremasterPerms } from '$lib/server/utils';
import type { PageServerLoad } from './$types';
import { getTracks } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	if (!locals.tournament?.enableTracks) {
		error(404, 'Tracks are not enabled for this tournament!');
	}

	const tracks = (await getTracks(params.id)) || [];

	return { tracks };
};
