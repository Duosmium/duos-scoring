import { createOrUpdateUser } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const name = (formData.get('name') as string).trim();
		const email = (formData.get('email') as string).trim();

		if (name && name !== locals.user.name) {
			await createOrUpdateUser(locals.user.id, name);
		}

		let emailChanged = false;
		if (email && email !== locals.user.email) {
			emailChanged = true;
			const { error } = await locals.supabase.auth.updateUser({
				email
			});
			if (error) {
				return fail(400, { error: error.message, email });
			}
		}

		return { success: true, name, email, emailChanged };
	}
} satisfies Actions;
