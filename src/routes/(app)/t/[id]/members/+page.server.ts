import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/utils';
import { getTournamentInfo } from '$lib/db';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.userId, params.id);

	const tournament = await getTournamentInfo(params.id);
	if (tournament === false) {
		throw error(404, 'Tournament not found');
	}

	const emails = new Map(
		(
			await Promise.all(
				tournament.roles.map(async (role) => {
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
