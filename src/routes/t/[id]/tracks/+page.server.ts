import { error } from '@sveltejs/kit';
import { checkIsDirector } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, params }) => {
	await checkIsDirector(locals.userId, params.id);

	const data = await parent();
	if (!data.tournament.enableTracks) {
		throw error(404, 'Tracks are not enabled for this tournament!');
	}
	return;
};
