import { deleteInvites, getInvite, updateMember } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UserRole } from '$drizzle/types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return new Response(null, { status: 303, headers: { Location: '/login' } });
	}

	const invite = await getInvite(params.invite);
	if (!invite) {
		throw redirect(
			303,
			'/dashboard?error=Invite link is invalid or has expired.'
		);
	}

	const rank: Record<UserRole, number> = {
		TD: 3,
		SM: 2,
		ES: 1
	};

	const role = (
		[
			locals.user.roles.find((r) => r.tournament.id === invite.tournamentId)
				?.role,
			invite.role,
		] as UserRole[]
	).reduce((max, r) => {
		if (!r) return max;
		return rank[r] > rank[max] ? r : max;
	}, "ES");

	const existingEvents =
		locals.user.roles
			.find((r) => r.tournament.id === invite.tournamentId)
			?.supEvents.map((e) => e.id) || [];

	const update = await updateMember(invite.tournamentId, locals.user.id, {
		events: invite.events.map((e) => e.id).concat(existingEvents),
		role
	});

	if (update === false) {
		throw error(500, 'Failed to join tournament! Please try again.');
	}

	await deleteInvites([params.invite]);

	return new Response(null, {
		status: 303,
		headers: { Location: '/dashboard' }
	});
};
