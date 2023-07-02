import { createOrUpdateUser, getUserInfo } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	let user = await getUserInfo(locals.userId);

	const {
		data: { user: supabaseUser }
	} = await locals.supabase.auth.getUser();

	if (user === false && supabaseUser) {
		await createOrUpdateUser(locals.userId, supabaseUser?.user_metadata.name || '');
		user = await getUserInfo(locals.userId);
	}

	if (user === false) {
		throw error(403, 'User not found');
	}

	return { user };
};
