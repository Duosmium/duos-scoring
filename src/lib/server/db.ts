import { supabase } from './supabaseAdmin';

import {
	type Tournament,
	type TrialStatus,
	type Team,
	type Track,
	type Score,
	type UserRole
} from '$drizzle/types';
import * as schema from '$drizzle/schema';
import { db } from '$drizzle/db';
import { and, eq, inArray } from 'drizzle-orm';
import { captureException } from '@sentry/sveltekit';

export async function createOrUpdateUser(userId: string, name: string) {
	await db
		.insert(schema.User)
		.values({
			id: userId,
			name
		})
		.onConflictDoUpdate({
			target: schema.User.id,
			set: {
				name
			}
		});
}

export async function createTournament(tournament: Omit<Tournament, 'id'>) {
	return (await db.insert(schema.Tournament).values(tournament).returning())[0];
}

export async function updateTournament(
	tournamentId: bigint | string,
	tournament: Partial<Tournament>
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await db
			.update(schema.Tournament)
			.set(tournament)
			.where(eq(schema.Tournament.id, tournamentId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function createInvites(
	tournamentId: bigint | string,
	invites: {
		link: string;
		email?: string;
		events?: bigint[];
		role?: UserRole;
	}[]
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	if (invites.length === 0) {
		return true;
	}
	try {
		await db.insert(schema.Invite).values(
			invites.map((i) => ({
				tournamentId: tournamentId as bigint,
				link: i.link,
				email: i.email,
				role: i.role
			}))
		);
		await db.insert(schema._InviteEvents).values(
			invites.flatMap(
				(i) =>
					i.events?.map((e) => ({
						A: e,
						B: i.link
					})) ?? []
			)
		);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function getInvite(link: string) {
	try {
		const invite = await db.query.Invite.findFirst({
			where: (i, { eq }) => eq(i.link, link),
			with: {
				events: {
					with: {
						event: true
					}
				}
			}
		});
		return invite
			? {
					...invite,
					events: invite.events.map((e) => e.event)
				}
			: false;
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
}

export async function updateInvite(
	link: string,
	events: bigint[],
	role?: UserRole
) {
	try {
		await db
			.update(schema.Invite)
			.set({
				role: role
			})
			.where(eq(schema.Invite.link, link));
		if (events && events.length !== 0) {
			await db.transaction(async (tx) => {
				await tx
					.delete(schema._InviteEvents)
					.where(eq(schema._InviteEvents.B, link));
				await tx.insert(schema._InviteEvents).values(
					events.map((e) => ({
						A: e,
						B: link
					}))
				);
			});
		}
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteInvites(invites: string[]) {
	try {
		await db.delete(schema.Invite).where(inArray(schema.Invite.link, invites));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function updateMember(
	tournamentId: bigint | string,
	userId: string,
	data: { events?: bigint[]; role: UserRole }
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		const role = (
			await db
				.insert(schema.Role)
				.values({
					tournamentId,
					userId,
					role: data.role
				})
				.onConflictDoUpdate({
					target: [schema.Role.tournamentId, schema.Role.userId],
					set: {
						role: data.role
					}
				})
				.returning()
		)[0];
		if (data.events && data.events.length !== 0) {
			await db.transaction(async (tx) => {
				await tx
					.delete(schema._ESEventRoles)
					.where(eq(schema._ESEventRoles.B, role.id));
				await tx.insert(schema._ESEventRoles).values(
					data.events!.map((e) => ({
						A: e,
						B: role.id
					})) ?? []
				);
			});
		}
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteMembers(
	tournamentId: bigint | string,
	members: string[]
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await db
			.delete(schema.Role)
			.where(
				and(
					eq(schema.Role.tournamentId, tournamentId),
					inArray(schema.Role.userId, members)
				)
			);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function getEvent(id: bigint) {
	return await db.query.Event.findFirst({
		where: (i, { eq }) => eq(i.id, id),
		with: {
			scores: true,
			tournament: {
				with: {
					teams: true
				}
			}
		}
	});
}

export async function addEvents(
	tournamentId: bigint | string,
	events: {
		name: string;
		trialStatus?: TrialStatus;
		highScoring?: boolean;
		medals?: number;
	}[]
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	if (events.length === 0) {
		return true;
	}
	try {
		await db
			.insert(schema.Event)
			.values(
				events.map((e) => ({ ...e, tournamentId: tournamentId as bigint }))
			);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function touchEventsExport(eventIds: bigint[]) {
	try {
		await db
			.update(schema.Event)
			.set({ lastExportedAt: new Date() })
			.where(inArray(schema.Event.id, eventIds));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function updateEvent(
	eventId: bigint,
	event: {
		name?: string;
		trialStatus?: TrialStatus;
		highScoring?: boolean;
		medals?: number;
		locked?: boolean;
		auditedUserId?: string | null;
	}
) {
	try {
		if (event.auditedUserId != null) {
			await db
				.update(schema.Event)
				.set({
					auditedUserId: event.auditedUserId,
					locked: true,
					auditedAt: new Date()
				})
				.where(eq(schema.Event.id, eventId));
		} else if (event.auditedUserId === null && event.locked === false) {
			await db
				.update(schema.Event)
				.set({
					auditedUserId: null,
					locked: false,
					auditedAt: null
				})
				.where(eq(schema.Event.id, eventId));
		} else {
			await db
				.update(schema.Event)
				.set(event)
				.where(eq(schema.Event.id, eventId));
		}
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteEvent(eventId: bigint) {
	try {
		await db.delete(schema.Event).where(eq(schema.Event.id, eventId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function addTeams(tournamentId: bigint | string, teams: Team[]) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	if (teams.length === 0) {
		return true;
	}
	try {
		await db
			.insert(schema.Team)
			.values(
				teams.map((t) => ({ ...t, tournamentId: tournamentId as bigint }))
			);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function updateTeam(teamId: bigint, team: Partial<Team>) {
	try {
		await db.update(schema.Team).set(team).where(eq(schema.Team.id, teamId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteTeam(teamId: bigint) {
	try {
		await db.delete(schema.Team).where(eq(schema.Team.id, teamId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function addTracks(
	tournamentId: bigint | string,
	tracks: Track[]
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	if (tracks.length === 0) {
		return true;
	}
	try {
		await db
			.insert(schema.Track)
			.values(
				tracks.map((t) => ({ ...t, tournamentId: tournamentId as bigint }))
			);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function updateTrack(trackId: bigint, track: Partial<Track>) {
	try {
		await db
			.update(schema.Track)
			.set(track)
			.where(eq(schema.Track.id, trackId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteTrack(trackId: bigint) {
	try {
		await db.delete(schema.Track).where(eq(schema.Track.id, trackId));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function getUserInfo(userId: string) {
	const user = await db.query.User.findFirst({
		where: (i, { eq }) => eq(i.id, userId),
		with: {
			roles: {
				with: {
					tournament: true,
					supEvents: {
						with: {
							event: true
						}
					}
				}
			}
		}
	});
	const {
		data: { user: supabaseUser }
	} = await supabase.auth.admin.getUserById(userId);

	if (user == undefined || supabaseUser == null) {
		return false;
	}

	return {
		...user,
		roles: user.roles.map((r) => ({
			...r,
			supEvents: r.supEvents.map((e) => e.event)
		})),
		email: supabaseUser.email
	};
}

export async function getTournamentInfo(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const tournament = await db.query.Tournament.findFirst({
		where: (i, { eq }) => eq(i.id, tournamentId)
	});

	if (tournament == undefined) {
		return false;
	}

	return tournament;
}

export async function getEvents(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const events = await db.query.Event.findMany({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId),
		with: {
			supervisors: {
				with: {
					role: {
						with: {
							user: true
						}
					}
				}
			},
			audited: true,
			scores: {
				with: {
					team: true,
					event: true
				}
			}
		}
	});

	if (events == undefined) {
		return false;
	}

	return events
		.map((e) => ({
			...e,
			supervisors: e.supervisors.map((r) => r.role)
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRoles(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const roles = await db.query.Role.findMany({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId),
		with: {
			user: true,
			supEvents: {
				with: {
					event: true
				}
			}
		}
	});

	if (roles == undefined) {
		return false;
	}

	return roles.map((r) => ({
		...r,
		supEvents: r.supEvents.map((e) => e.event)
	}));
}

export async function getTeams(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const teams = await db.query.Team.findMany({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId),
		with: {
			track: true,
			scores: {
				with: {
					event: true
				}
			}
		}
	});

	if (teams == undefined) {
		return false;
	}

	return teams.sort((a, b) => a.number - b.number);
}

export async function getTracks(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const tracks = await db.query.Track.findMany({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId),
		with: {
			teams: true
		}
	});

	if (tracks == undefined) {
		return false;
	}

	return tracks;
}

export async function getInvites(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const invites = await db.query.Invite.findMany({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId),
		with: {
			events: {
				with: {
					event: true
				}
			}
		}
	});

	if (invites == undefined) {
		return false;
	}

	return invites.map((i) => ({
		...i,
		events: i.events.map((e) => e.event)
	}));
}

export async function getEventScores(eventId: bigint) {
	const scores = await db.query.Score.findMany({
		where: (i, { eq }) => eq(i.eventId, eventId),
		with: {
			team: true
		}
	});

	if (scores == undefined) {
		return false;
	}

	return scores;
}

export async function updateScores(scores: Partial<Score> & { id: bigint }[]) {
	try {
		await Promise.all(
			scores.map(
				async (score) =>
					await db
						.update(schema.Score)
						.set(score)
						.where(eq(schema.Score.id, score.id))
			)
		);
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function addScores(scores: Omit<Score, 'id'>[]) {
	if (scores.length === 0) {
		return true;
	}
	try {
		await db
			.insert(schema.Score)
			.values(scores.map((s) => ({ ...s, checklist: s.checklist ?? null })));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function deleteScores(scores: bigint[]) {
	try {
		await db.delete(schema.Score).where(inArray(schema.Score.id, scores));
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function getSlides(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	let slides = await db.query.Slides.findFirst({
		where: (i, { eq }) => eq(i.tournamentId, tournamentId)
	});

	if (slides == undefined) {
		slides = (
			await db.insert(schema.Slides).values({ tournamentId }).returning()
		)[0];
	}

	return slides;
}

export async function updateSlidesSettings(
	tournamentId: bigint | string,
	settings: DbJson.SlidesSettings
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	try {
		await db
			.insert(schema.Slides)
			.values({ tournamentId, settings })
			.onConflictDoUpdate({
				target: schema.Slides.tournamentId,
				set: { settings }
			});
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function addSlidesBatch(
	tournamentId: bigint | string,
	batch: bigint[]
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	try {
		const batches =
			(
				await db.query.Slides.findFirst({
					where: (i, { eq }) => eq(i.tournamentId, tournamentId)
				})
			)?.batches ?? [];

		batches.push(batch.map((e) => e.toString()));

		await db
			.insert(schema.Slides)
			.values({ tournamentId, batches })
			.onConflictDoUpdate({
				target: schema.Slides.tournamentId,
				set: { batches }
			});
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function markSlidesDone(
	tournamentId: bigint | string,
	done: boolean
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	try {
		await db
			.insert(schema.Slides)
			.values({ tournamentId, done })
			.onConflictDoUpdate({
				target: schema.Slides.tournamentId,
				set: { done }
			});
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function setSlidesChannel(
	tournamentId: bigint | string,
	channelId: string
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	try {
		await db
			.insert(schema.Slides)
			.values({ tournamentId, channelId })
			.onConflictDoUpdate({
				target: schema.Slides.tournamentId,
				set: { channelId }
			});
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function clearSlides(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}

	try {
		await db
			.insert(schema.Slides)
			.values({ tournamentId })
			.onConflictDoUpdate({
				target: schema.Slides.tournamentId,
				set: { batches: [], channelId: null, done: false }
			});
	} catch (e) {
		console.error(e);
		captureException(e);
		return false;
	}
	return true;
}

export async function isAdmin(userId: string) {
	const admin = await db.query.Admins.findFirst({
		where: (i, { eq }) => eq(i.id, userId)
	});

	return admin != undefined;
}

export async function getFilteredTournaments(
	filter: Exclude<
		Parameters<typeof db.query.Tournament.findMany>[0],
		undefined
	>['where']
) {
	const tournaments = await db.query.Tournament.findMany({
		where: filter,
		with: {
			roles: {
				with: {
					user: true
				}
			}
		}
	});

	return tournaments;
}
