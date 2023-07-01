import { updateEvent, addScores, updateScores, getUserInfo, getEvent } from '$lib/db';
import { ScoreStatus, type Score } from '@prisma/client';
import type { RequestHandler } from './$types';
import { checkEventPerms } from '$lib/utils';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	await checkEventPerms(locals.userId, params.id, BigInt(params.event));

	const user = await getUserInfo(locals.userId);
	if (user === false) return new Response('unauthorized user', { status: 403 });

	const event = await getEvent(BigInt(params.event));
	if (!event) return new Response('invalid event', { status: 404 });

	const payload: {
		highScoring?: 'true' | 'false';
		medals?: number;
		locked?: boolean;
		audited?: boolean;
	} = await request.json();
	if (
		payload.highScoring &&
		(!['true', 'false'].includes(payload.highScoring) ||
			event.locked ||
			event.auditedUserId != undefined)
	)
		return new Response('invalid highScoring', { status: 400 });
	if (payload.medals && typeof payload.medals !== 'number')
		return new Response('invalid medals', { status: 400 });
	if (payload.locked != undefined && typeof payload.locked !== 'boolean')
		return new Response('invalid locked', { status: 400 });
	if (
		payload.locked === true &&
		event.locked === false &&
		event.scores.length !== event.tournament.teams.length
	)
		return new Response("can't lock with missing scores", { status: 400 });
	if (
		payload.audited === true &&
		(!user.roles.find((role) => role.tournamentId === params.id)?.isDirector ||
			!event.locked ||
			event.auditedUserId != undefined)
	)
		return new Response('unauthorized user', { status: 403 });
	if (
		payload.locked === false &&
		event.auditedUserId != undefined &&
		!user.roles.find((role) => role.tournamentId === params.id)?.isDirector
	)
		return new Response('unauthorized user', { status: 403 });

	const eventId = BigInt(params.event);
	if (payload.audited === true) {
		await updateEvent(eventId, {
			auditedUserId: user.id
		});
	} else if (payload.locked === false && event.auditedUserId != undefined) {
		await updateEvent(eventId, {
			auditedUserId: null,
			locked: false
		});
	} else {
		await updateEvent(eventId, {
			highScoring: payload.highScoring ? payload.highScoring === 'true' : undefined,
			medals: payload.medals ?? undefined,
			locked: payload.locked ?? undefined
		});
	}

	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkEventPerms(locals.userId, params.id, BigInt(params.event));

	const event = await getEvent(BigInt(params.event));
	if (!event) return new Response('invalid event', { status: 404 });

	if (event.locked || event.auditedUserId != undefined) {
		return new Response('event locked', { status: 403 });
	}

	const payload: {
		id?: string;
		teamId: string;
		rawScore: number | null;
		tier: number | null;
		tiebreak: number | null;
		status: ScoreStatus;
		notes: string | null;
	}[] = await request.json();

	// TODO: more validation
	if (!Array.isArray(payload)) return new Response('invalid payload', { status: 400 });
	if (payload.some((score) => score.id && typeof score.id !== 'string'))
		return new Response('invalid id', { status: 400 });
	if (payload.some((score) => !score.teamId || typeof score.teamId !== 'string'))
		return new Response('missing/invalid teamId', { status: 400 });
	if (payload.some((score) => score.rawScore && typeof score.rawScore !== 'number'))
		return new Response('invalid rawScore', { status: 400 });
	if (payload.some((score) => score.tier && typeof score.tier !== 'number'))
		return new Response('invalid tier', { status: 400 });
	if (payload.some((score) => score.tiebreak && typeof score.tiebreak !== 'number'))
		return new Response('invalid tiebreak', { status: 400 });
	if (
		payload.some(
			(score) =>
				(!score.status && !score.id) ||
				(score.status && !Object.values(ScoreStatus).includes(score.status))
		)
	)
		return new Response('missing/invalid status', { status: 400 });
	if (payload.some((score) => score.notes && typeof score.notes !== 'string'))
		return new Response('invalid notes', { status: 400 });

	// TODO: validate to prevent duplicate team/event combos

	const eventId = BigInt(params.event);
	const [newScores, existingScores] = payload.reduce(
		(acc, score) => {
			if (score.id) {
				acc[1].push({ ...score, id: BigInt(score.id), teamId: BigInt(score.teamId), eventId });
			} else {
				acc[0].push({ ...score, teamId: BigInt(score.teamId), eventId });
			}
			return acc;
		},
		[[], []] as [Omit<Score, 'id'>[], Score[]]
	);

	await addScores(newScores);
	await updateScores(existingScores);

	return new Response('ok');
};
