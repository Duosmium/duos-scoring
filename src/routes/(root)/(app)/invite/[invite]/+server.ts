import { deleteInvites, getInvite, updateMember } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return new Response(null, { status: 303, headers: { Location: '/login' } });
	}

	const invite = await getInvite(params.invite);
	if (!invite) {
		return new Response('Invite link not valid', { status: 404 });
	}

	const role = locals.user.roles.find((r) => r.tournament.id === invite.tournamentId)?.role || 'ES';

	const update = await updateMember(invite.tournamentId, locals.user.id, {
		events: invite.events.map((e) => e.id),
		role
	});

	if (update === false) {
		return new Response('Failed to join tournament!', { status: 500 });
	}

	await deleteInvites([params.invite]);

	return new Response(null, { status: 303, headers: { Location: '/dashboard' } });
};
