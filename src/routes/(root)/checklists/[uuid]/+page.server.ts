import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getScoreByChecklistId } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const score = await getScoreByChecklistId(params.uuid);
	if (!score) {
		error(404, 'Checklist not found');
	}

	return { score };
};
