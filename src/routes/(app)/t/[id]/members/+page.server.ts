import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	if (!locals.tournament.roles) {
		throw error(403, 'You are not authorized to view this page.');
	}

	const emails = new Map(
		(
			await Promise.all(
				locals.tournament.roles.map(async (role) => {
					const { data, error } = await supabase.auth.admin.getUserById(role.user.id);
					if (error) {
						return [];
					}
					return [[role.user.id, data.user?.email ?? '']] as [string, string][];
				})
			)
		).flat()
	);

	return {
		emails
	};
};
