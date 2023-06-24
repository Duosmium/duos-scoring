import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();
	if (!data.tournament.enableTracks) {
		throw error(404, 'Tracks are not enabled for this tournament!');
	}
	return;
};
