import {
	getApprovedTournaments,
	getTournamentsPendingApproval,
	getUpcomingTournaments,
	isAdmin
} from '$lib/db.js';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseAdmin';

export const load = async ({ locals }) => {
	if (!(await isAdmin(locals.userId))) {
		redirect(303, '/dashboard');
	}

	const tournaments = await getTournamentsPendingApproval();
	const upcoming = await getUpcomingTournaments();
	const approved = await getApprovedTournaments();
	const emails = new Map(
		(
			await Promise.all(
				[...upcoming, ...tournaments, ...approved]
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

	return { approved, upcoming, tournaments, emails };
};
