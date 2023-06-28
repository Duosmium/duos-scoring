import { createOrUpdateUser, getUserInfo } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await getUserInfo(locals.userId);

	if (user !== false) {
		throw redirect(303, '/dashboard');
	}

	return { user };
};

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name');

		if (name == null) {
			return fail(400, { errorMessage: 'Name is required' });
		}

		await createOrUpdateUser(locals.userId, name.toString());

		return {
			success: true
		};
	}
} satisfies Actions;
