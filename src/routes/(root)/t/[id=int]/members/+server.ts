import {
	deleteMembers,
	deleteInvites,
	createInvites,
	updateMember,
	updateInvite,
	getEvents
} from '$lib/db';
import type { RequestHandler } from './$types';
import { checkIsDirector } from '$lib/utils';
import { customAlphabet } from 'nanoid';
import type { UserRole } from '@prisma/client';
import { sendInvite } from '$lib/email';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: {
		members?: string[];
		invites?: string[];
	} = await request.json();

	if (!payload.members && !payload.invites) {
		return new Response('missing members or invites!', { status: 400 });
	}
	if (
		payload.members &&
		(!Array.isArray(payload.members) || payload.members.some((m) => typeof m !== 'string'))
	) {
		return new Response('invalid members', { status: 400 });
	}
	if (
		payload.invites &&
		(!Array.isArray(payload.invites) || payload.invites.some((m) => typeof m !== 'string'))
	) {
		return new Response('invalid invites', { status: 400 });
	}

	let memberStatus: boolean | undefined = undefined;
	let inviteStatus: boolean | undefined = undefined;
	if (payload.members) {
		memberStatus = await deleteMembers(params.id, payload.members);
	}
	if (payload.invites) {
		inviteStatus = await deleteInvites(payload.invites);
	}

	if (memberStatus === false || inviteStatus === false) {
		return new Response('failed to delete', { status: 500 });
	}
	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: {
		member?: {
			userId: string;
			role: UserRole;
			events?: string[];
		};
		invite?: {
			link: string;
			events: string[];
		};
	} = await request.json();

	if (!payload.member && !payload.invite) {
		return new Response('missing member or invite!', { status: 400 });
	}
	if (payload.member && !payload.member.userId) {
		return new Response('missing userId', { status: 400 });
	}
	if (
		payload.member &&
		(!payload.member.role ||
			typeof payload.member.role !== 'string' ||
			!['TD', 'SM', 'ES'].includes(payload.member.role))
	) {
		return new Response('missing role', { status: 400 });
	}
	if (payload.invite && !payload.invite.link) {
		return new Response('missing link', { status: 400 });
	}
	if (
		payload.member &&
		payload.member.events &&
		(!Array.isArray(payload.member.events) ||
			payload.member.events.some((e) => typeof e !== 'string'))
	) {
		return new Response('invalid events', { status: 400 });
	}
	if (
		payload.invite &&
		(!payload.invite.events ||
			!Array.isArray(payload.invite.events) ||
			payload.invite.events.some((e) => typeof e !== 'string'))
	) {
		return new Response('invalid events', { status: 400 });
	}

	let memberStatus: boolean | undefined = undefined;
	let inviteStatus: boolean | undefined = undefined;
	if (payload.member) {
		memberStatus = await updateMember(params.id, payload.member.userId, {
			events: payload.member.events?.map((e) => BigInt(e)),
			role: payload.member.role
		});
	}
	if (payload.invite) {
		inviteStatus = await updateInvite(
			payload.invite.link,
			payload.invite.events.map((e) => BigInt(e))
		);
	}

	if (memberStatus === false || inviteStatus === false) {
		return new Response('failed to update', { status: 500 });
	}
	return new Response('ok');
};

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: {
		email?: string;
		events?: string[];
	}[] = await request.json();

	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (payload.some((d) => d.email && (typeof d.email !== 'string' || !emailRegex.test(d.email)))) {
		return new Response('invalid email', { status: 400 });
	}
	if (
		payload.some(
			(d) => d.events && (!Array.isArray(d.events) || d.events.some((e) => typeof e !== 'string'))
		)
	) {
		return new Response('invalid events', { status: 400 });
	}
	if (payload.length > 15) {
		return new Response('too many invites - max 15 at a time', { status: 400 });
	}

	const invites = payload.map((i) => ({
		link: nanoid(),
		email: i.email,
		events: i.events?.map((e) => BigInt(e))
	}));
	const events = new Map(((await getEvents(params.id)) || []).map((e) => [e.id, e.name]));

	await createInvites(params.id, invites);

	const status = (
		await Promise.all(
			invites.map(
				(invite, i) =>
					new Promise<boolean>((res, rej) => {
						if (invite.email) {
							setTimeout(() => {
								sendInvite(
									invite.email as string,
									invite.link,
									`${locals.tournament?.year} ${locals.tournament?.shortName} ${locals.tournament?.division}`,
									invite.events?.map((e) => events.get(e) ?? '')
								).then(res, rej);
							}, i * 90);
						}
					})
			)
		)
	).every((b) => b);

	if (!status) {
		return new Response('failed to send invites', { status: 500 });
	}
	return new Response('ok');
};
