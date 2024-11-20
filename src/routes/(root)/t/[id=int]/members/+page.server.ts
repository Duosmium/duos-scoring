import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/server/utils';
import { supabase } from '$lib/server/supabaseAdmin';
import { getEvents, getInvites, getRoles } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const roles = (await getRoles(params.id)) || [];

	const emails = new Map(
		(
			await Promise.all(
				roles.map(async (role) => {
					const { data, error } = await supabase.auth.admin.getUserById(
						role.user.id
					);
					if (error) {
						return [];
					}
					return [[role.user.id, data.user?.email ?? '']] as [string, string][];
				})
			)
		).flat()
	);

	const invites = (await getInvites(params.id)) || [];
	const events = (await getEvents(params.id)) || [];
	return {
		roles,
		invites,
		events,
		emails
	};
};
