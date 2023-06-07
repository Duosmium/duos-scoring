import { getTracks } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const tracks = await getTracks(params.id);

	if (tracks === false) {
		throw error(404, 'Tournament not found');
	}

	return { tracks };
};
