import { getTournamentInfo, getUserInfo } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import * as SentryNode from '@sentry/node';
import { checkTournamentAccess } from '$lib/utils';

export const load: LayoutServerLoad = async ({ locals, request, params }) => {
	await checkTournamentAccess(locals.userId, params.id);

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

	const isDirector = user.tournaments.find((t) => t.id === params.id)?.isDirector ?? false;

	const filteredTournament = {
		...tournament,
		events: undefined,
		roles: undefined,
		tracks: undefined
	};

	return {
		tournament: isDirector ? tournament : filteredTournament,
		user,
		isDirector
	};
};
