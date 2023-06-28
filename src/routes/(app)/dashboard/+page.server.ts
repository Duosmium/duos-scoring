import { getUserInfo } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await getUserInfo(locals.userId);

	if (user === false) {
		throw redirect(303, '/welcome');
	}

	return { user };
};
