import { addTeams, deleteTeam, updateTeam } from '$lib/db';
import type { Team } from '@prisma/client';
import type { RequestHandler } from './$types';
import { checkScoremasterPerms } from '$lib/utils';

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		team?: string;
		teams?: string[];
	} = await request.json();
	const teams = [];
	if (payload.team && typeof payload.team === 'string') {
		teams.push(BigInt(payload.team));
	} else if (
		payload.teams &&
		Array.isArray(payload.teams) &&
		payload.teams.every((team) => typeof team === 'string')
	) {
		teams.push(...payload.teams.map((id) => BigInt(id)));
	} else {
		return new Response('missing team', { status: 404 });
	}

	await Promise.all(teams.map((teamId) => deleteTeam(teamId)));

	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		id?: string;
		data?: Partial<Team>;
	} = await request.json();
	if (!payload.id || typeof payload.id !== 'string') {
		return new Response('missing team', { status: 404 });
	}
	if (!payload.data) {
		// TODO: validate data including whether tracks are enabled
		return new Response('invalid payload', { status: 400 });
	}

	const teamId = BigInt(payload.id);
	const data = {
		...payload.data,
		trackId: payload.data.trackId != null ? BigInt(payload.data.trackId) : payload.data.trackId
	};
	await updateTeam(teamId, data);

	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: Team[] = await request.json();

	// TODO: validate data including whether tracks are enabled
	const data = payload.map((team) => ({
		...team,
		trackId: team.trackId ? BigInt(team.trackId) : null
	}));

	const status = await addTeams(params.id, data);

	if (!status) {
		return new Response('failed to add teams', { status: 500 });
	}
	return new Response('ok');
};
