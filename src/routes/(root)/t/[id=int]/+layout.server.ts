import type { LayoutServerLoad } from './$types';
import { checkTournamentAccess } from '$lib/server/utils';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	await checkTournamentAccess(locals.user, params.id);

	if (!locals.tournament || !locals.user || !locals.role) {
		error(403, 'You are not authorized to view this page.');
	}

	return {
		tournament: locals.tournament,
		user: locals.user,
		role: locals.role
	};
};
