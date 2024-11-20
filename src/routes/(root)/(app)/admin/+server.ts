import { isAdmin, updateTournament } from '$lib/server/db.js';

export const PATCH = async ({ request, locals }) => {
	if (!(await isAdmin(locals.userId))) {
		return new Response('Forbidden', { status: 403 });
	}

	const {
		ids,
		action
	}: {
		ids: string[];
		action: 'approve' | 'unapprove' | 'archive';
	} = await request.json();

	if (
		!Array.isArray(ids) ||
		ids.some((i) => typeof i !== 'string') ||
		typeof action !== 'string' ||
		!['approve', 'unapprove', 'archive'].includes(action)
	) {
		return new Response('invalid input', { status: 400 });
	}

	const status = (
		await Promise.all(
			ids.map((id) =>
				updateTournament(id, {
					approved: action === 'approve' ? true : false,
					requestingApproval: action === 'archive' ? false : true
				})
			)
		)
	).every((b) => b);

	if (!status) {
		return new Response('failed to update some tournaments', { status: 500 });
	}
	return new Response('ok');
};
