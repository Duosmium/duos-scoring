import { getFilteredTournaments, isAdmin } from '$lib/db.js';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseAdmin';

export const load = async ({ locals }) => {
	if (!(await isAdmin(locals.userId))) {
		redirect(303, '/dashboard');
	}

	const pending = await getFilteredTournaments((t, { eq }) =>
		eq(t.requestingApproval, true)
	);
	const upcoming = await getFilteredTournaments((t, { gt }) =>
		gt(t.startDate, new Date())
	);
	const approved = await getFilteredTournaments((t, { eq }) =>
		eq(t.approved, true)
	);
	const emails = new Map(
		(
			await Promise.all(
				[...upcoming, ...pending, ...approved]
					.flatMap((t) => t.roles.map((r) => r.userId))
					.filter((id, i, a) => a.indexOf(id) === i)
					.map(async (id) => {
						const { data, error } = await supabase.auth.admin.getUserById(id);
						if (error) {
							return [];
						}
						return [[id, data.user?.email ?? '']] as [string, string][];
					})
			)
		).flat()
	);

	return { approved, upcoming, pending: pending, emails };
};
