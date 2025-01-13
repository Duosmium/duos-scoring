import {
	getFilteredTournaments,
	getUserEmailLookup,
	isAdmin
} from '$lib/server/db.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!(await isAdmin(locals.userId))) {
		redirect(303, '/dashboard');
	}

	const pending = await getFilteredTournaments((t, { eq, and, ne }) =>
		and(eq(t.requestingApproval, true), ne(t.approved, true))
	);
	const upcoming = await getFilteredTournaments((t, { gt }) =>
		gt(t.startDate, new Date())
	);
	const approved = await getFilteredTournaments((t, { eq }) =>
		eq(t.approved, true)
	);
	const emails = await getUserEmailLookup([
		...new Set(
			[...upcoming, ...pending, ...approved].flatMap((t) =>
				t.roles.map((r) => r.userId)
			)
		)
	]);

	return { approved, upcoming, pending: pending, emails };
};
