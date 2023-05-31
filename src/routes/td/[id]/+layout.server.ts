import { getTournamentInfo, getUserInfo } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import * as SentryNode from '@sentry/node';
import { TournamentRoles } from '@prisma/client';

export const load: LayoutServerLoad = async ({ locals, request, params }) => {
	const tournament = await getTournamentInfo(params.id);
	const user = await getUserInfo(locals.userId);

	if (user === false) {
		SentryNode.captureMessage('Error fetching user information', {
			contexts: { sveltekit: { locals, request } }
		});
		throw error(500, 'Error fetching user information');
	}

	if (tournament === false) {
		SentryNode.captureMessage('Error fetching tournament information', {
			contexts: { sveltekit: { locals, request } }
		});
		throw error(500, 'Error fetching tournament information');
	}

	const userRole = user.tournaments
		.find(({ tournament }) => tournament.id === params.id)
		?.roles.find((role) => role.role === TournamentRoles.DIRECTOR);
	if (userRole == undefined) {
		throw error(403, 'You do not have permission to view this page');
	}

	return { tournament };
};
