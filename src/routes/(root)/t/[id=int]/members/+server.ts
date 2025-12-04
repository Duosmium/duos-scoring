import {
	deleteMembers,
	deleteInvites,
	createInvites,
	updateMember,
	updateInvite,
	getEvents,
	getInvites,
	getRoles,
	getInvite,
	getUserEmailLookup
} from '$lib/server/db';
import type { RequestHandler } from './$types';
import { checkIsDirector } from '$lib/server/utils';
import { customAlphabet } from 'nanoid';
import { UserRole } from '$drizzle/types';
import { sendInvites } from '$lib/server/email';
import { supabase } from '$lib/server/supabaseAdmin';

const nanoid = customAlphabet(
	'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
	8
);

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
		(!Array.isArray(payload.members) ||
			payload.members.some((m) => typeof m !== 'string'))
	) {
		return new Response('invalid members', { status: 400 });
	}
	if (
		payload.invites &&
		(!Array.isArray(payload.invites) ||
			payload.invites.some((m) => typeof m !== 'string'))
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
			role: UserRole;
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
			!UserRole.includes(payload.member.role))
	) {
		return new Response('missing role', { status: 400 });
	}
	if (payload.invite?.role && !UserRole.includes(payload.invite.role)) {
		return new Response('invalid role', { status: 400 });
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
			role:
				payload.member.userId === locals.userId
					? locals.role!.role
					: payload.member.role
		});
	}
	if (payload.invite) {
		inviteStatus = await updateInvite(
			payload.invite.link,
			payload.invite.events.map((e) => BigInt(e)),
			payload.invite.role
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
		role?: UserRole;
	}[] = await request.json();

	const emailRegex =
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (
		payload.some(
			(d) =>
				d.email && (typeof d.email !== 'string' || !emailRegex.test(d.email))
		)
	) {
		return new Response('invalid email', { status: 400 });
	}
	if (payload.some((d) => d.role && !UserRole.includes(d.role))) {
		return new Response('invalid role', { status: 400 });
	}
	if (
		payload.some(
			(d) =>
				d.events &&
				(!Array.isArray(d.events) ||
					d.events.some((e) => typeof e !== 'string'))
		)
	) {
		return new Response('invalid events', { status: 400 });
	}

	const roles = (await getRoles(params.id)) || [];

	const emails = await getUserEmailLookup(roles.map((role) => role.user.id));
	const existingUsers = new Map(
		roles.map((role) => [emails.get(role.user.id)!.toLowerCase(), role])
	);
	const existingInvites = ((await getInvites(params.id)) || []).reduce(
		(acc, i) => {
			if (i.email)
				acc.set(i.email.toLowerCase(), {
					link: i.link,
					events: i.events.map((e) => e.id)
				});
			return acc;
		},
		new Map<string, { link: string; events: bigint[] }>()
	);
	const updateInvites = payload
		.filter(
			(i) =>
				i.email &&
				existingInvites.has(i.email.toLowerCase()) &&
				!existingUsers.has(i.email.toLowerCase())
		)
		.map((i) => ({
			link: existingInvites.get(i.email as string)?.link as string,
			role: i.role,
			email: i.email,
			events: [
				...new Set(
					existingInvites
						.get(i.email as string)
						?.events.concat(...(i.events?.map((e) => BigInt(e)) ?? []))
				)
			]
		}));
	const updateMembers = payload
		.filter((i) => i.email && existingUsers.has(i.email.toLowerCase()))
		.map((i) => {
			const role = existingUsers.get(i.email?.toLowerCase() as string)!;
			return {
				userId: role.userId,
				role: role.userId === locals.userId ? role.role : (i.role ?? role.role),
				events: [
					...new Set(
						(role.supEvents.map((e) => e.id) ?? []).concat(
							...(i.events?.map((e) => BigInt(e)) ?? [])
						)
					)
				]
			};
		});

	const newInvites = payload
		.filter(
			(i) =>
				!i.email ||
				(!existingInvites.has(i.email.toLowerCase()) &&
					!existingUsers.has(i.email.toLowerCase()))
		)
		.map((i) => ({
			link: nanoid(),
			email: i.email,
			role: i.role,
			events: i.events?.map((e) => BigInt(e))
		}));
	const events = new Map(
		((await getEvents(params.id)) || []).map((e) => [e.id, e.name])
	);

	const createStatus = await createInvites(params.id, newInvites);

	const updateInviteStatus = (
		await Promise.all(
			updateInvites.map((i) => updateInvite(i.link, i.events, i.role))
		)
	).every((b) => b);

	const updateMemberStatus = (
		await Promise.all(
			updateMembers.map((m) =>
				updateMember(params.id, m.userId, { events: m.events, role: m.role })
			)
		)
	).every((b) => b);

	const emailStatus = await sendInvites(
		newInvites.flatMap((invite) =>
			invite.email
				? [
						{
							email: invite.email,
							invite: invite.link,
							tournamentName: `${locals.tournament?.year} ${locals.tournament?.shortName} ${locals.tournament?.division}`,
							events: invite.events?.map((e) => events.get(e) ?? '')
						}
					]
				: []
		)
	);

	if (
		!createStatus ||
		!updateInviteStatus ||
		!updateMemberStatus ||
		!emailStatus
	) {
		return new Response('failed to send invites', { status: 500 });
	}
	return new Response('ok');
};

export const POST: RequestHandler = async ({ request, params, locals }) => {
	await checkIsDirector(locals.user, params.id);

	const payload: string = await request.json();
	if (typeof payload !== 'string') {
		return new Response('invalid invite', { status: 400 });
	}

	const invite = await getInvite(payload);
	if (!invite || !invite.email) {
		return new Response('invalid invite', { status: 400 });
	}
	const status = await sendInvites([
		{
			email: invite.email,
			invite: invite.link,
			tournamentName: `${locals.tournament?.year} ${locals.tournament?.shortName} ${locals.tournament?.division}`,
			events: invite.events.map((e) => e.name)
		}
	]);

	if (!status) {
		return new Response('failed to send invite', { status: 500 });
	}

	return new Response('ok');
};
