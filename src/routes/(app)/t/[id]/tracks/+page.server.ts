import { error } from '@sveltejs/kit';
import { checkIsDirector } from '$lib/utils';
import type { PageServerLoad } from './$types';
import { getTracks } from '$lib/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	if (!locals.tournament?.enableTracks) {
		throw error(404, 'Tracks are not enabled for this tournament!');
	}

	const tracks = (await getTracks(params.id)) || [];

	return { tracks };
};
