import {
	updateEvent,
	addScores,
	updateScores,
	deleteScores,
	getUserInfo,
	getEvent
} from '$lib/server/db';
import type { ScoreStatus, Score } from '$drizzle/types';
import type { RequestHandler } from './$types';
import { checkEventPerms } from '$lib/server/utils';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	await checkEventPerms(locals.user, params.id, BigInt(params.event));

	const user = await getUserInfo(locals.userId);
	if (user === false) return new Response('unauthorized user', { status: 403 });

	const event = await getEvent(BigInt(params.event));
	if (!event) return new Response('invalid event', { status: 404 });

	const payload: {
		enableChecklist?: boolean;
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
		payload.enableChecklist != undefined &&
		typeof payload.enableChecklist !== 'boolean'
	)
		return new Response('invalid enableChecklist', { status: 400 });
	if (
		payload.locked === true &&
		event.locked === false &&
		event.scores.length !== event.tournament.teams.length
	)
		return new Response("can't lock with missing scores", { status: 400 });
	if (
		payload.audited === true &&
		(!user.roles.find(
			(role) => role.tournamentId.toString() === params.id && role.role !== 'ES'
		) ||
			!event.locked ||
			event.auditedUserId != undefined)
	)
		return new Response('unauthorized user', { status: 403 });
	if (
		payload.locked === false &&
		event.auditedUserId != undefined &&
		!user.roles.find(
			(role) => role.tournamentId.toString() === params.id && role.role !== 'ES'
		)
	)
		return new Response('unauthorized user', { status: 403 });

	const eventId = BigInt(params.event);
	let status: boolean;
	if (payload.audited === true) {
		status = await updateEvent(eventId, {
			auditedUserId: user.id
		});
	} else if (payload.locked === false && event.auditedUserId != undefined) {
		status = await updateEvent(eventId, {
			auditedUserId: null,
			locked: false
		});
	} else {
		status = await updateEvent(eventId, {
			highScoring: payload.highScoring
				? payload.highScoring === 'true'
				: undefined,
			enableChecklist: payload.enableChecklist ?? undefined,
			medals: payload.medals ?? undefined,
			locked: payload.locked ?? undefined
		});
	}

	if (!status) {
		return new Response('error updating event', { status: 500 });
	}
	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkEventPerms(locals.user, params.id, BigInt(params.event));

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
		checklist: DbJson.ChecklistData | null;
	}[] = await request.json();

	// TODO: more validation
	if (!Array.isArray(payload))
		return new Response('invalid payload', { status: 400 });
	if (payload.some((score) => score.id && typeof score.id !== 'string'))
		return new Response('invalid id', { status: 400 });
	if (
		payload.some((score) => !score.teamId || typeof score.teamId !== 'string')
	)
		return new Response('missing/invalid teamId', { status: 400 });
	if (
		payload.some(
			(score) => score.rawScore && typeof score.rawScore !== 'number'
		)
	)
		return new Response('invalid rawScore', { status: 400 });
	if (payload.some((score) => score.tier && typeof score.tier !== 'number'))
		return new Response('invalid tier', { status: 400 });
	if (
		payload.some(
			(score) => score.tiebreak && typeof score.tiebreak !== 'number'
		)
	)
		return new Response('invalid tiebreak', { status: 400 });
	if (
		payload.some(
			(score) =>
				(!score.status && !score.id) ||
				(score.status &&
					![
						'COMPETED',
						'PARTICIPATION',
						'NOSHOW',
						'DISQUALIFICATION',
						'NA'
					].includes(score.status))
		)
	)
		return new Response('missing/invalid status', { status: 400 });
	if (payload.some((score) => score.notes && typeof score.notes !== 'string'))
		return new Response('invalid notes', { status: 400 });

	// TODO: validate to prevent duplicate team/event combos

	const eventId = BigInt(params.event);
	const [newScores, existingScores, scoresToDelete] = payload.reduce(
		(acc, score) => {
			if (!score.id) {
				acc[0].push({ ...score, teamId: BigInt(score.teamId), eventId });
			} else if ((score.status as ScoreStatus | 'NA') === 'NA') {
				acc[2].push(BigInt(score.id));
			} else {
				acc[1].push({
					...score,
					id: BigInt(score.id),
					teamId: BigInt(score.teamId),
					eventId
				});
			}
			return acc;
		},
		[[], [], []] as [
			Omit<Score, 'id' | 'checklistUuid'>[],
			Omit<Score, 'checklistUuid'>[],
			bigint[]
		]
	);

	const addSuccess = await addScores(newScores);
	const updateSuccess = await updateScores(existingScores);
	const deleteSuccess = await deleteScores(scoresToDelete);

	if (!addSuccess || !updateSuccess || !deleteSuccess) {
		return new Response('error updating scores', { status: 500 });
	}
	return new Response('ok');
};
