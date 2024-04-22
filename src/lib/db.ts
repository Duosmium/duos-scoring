import {
	PrismaClient,
	type Tournament,
	type TrialStatus,
	type Team,
	type Track,
	type Score,
	UserRole
} from '@prisma/client';
import { supabase } from './supabaseAdmin';
const prisma = new PrismaClient();

// TODO: double check permissions in every function

export async function createOrUpdateUser(userId: string, name: string) {
	await prisma.user.upsert({
		where: {
			id: userId
		},
		update: {
			name
		},
		create: {
			id: userId,
			name
		}
	});
}

export async function createTournament(tournament: Omit<Tournament, 'id'>) {
	return await prisma.tournament.create({
		data: tournament
	});
}

export async function updateTournament(
	tournamentId: bigint | string,
	tournament: Partial<Tournament>
) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await prisma.tournament.update({
			where: {
				id: tournamentId
			},
			data: {
				...tournament
			}
		});
	} catch (e) {
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
	try {
		await Promise.all(
			invites.map(async (invite) => {
				await prisma.invite.create({
					data: {
						tournamentId: tournamentId as bigint,
						link: invite.link,
						email: invite.email,
						role: invite.role,
						events: {
							connect: invite.events?.map((e) => ({ id: e }))
						}
					}
				});
			})
		);
	} catch (e) {
		return false;
	}
	return true;
}

export async function getInvite(link: string) {
	try {
		return await prisma.invite.findUnique({
			where: {
				link
			},
			include: {
				events: true
			}
		});
	} catch (e) {
		return false;
	}
}

export async function updateInvite(link: string, events: bigint[], role?: UserRole) {
	try {
		await prisma.invite.update({
			where: {
				link
			},
			data: {
				events: {
					set: events.map((e) => ({ id: e }))
				},
				role: role
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteInvites(invites: string[]) {
	try {
		await prisma.invite.deleteMany({
			where: {
				link: {
					in: invites
				}
			}
		});
	} catch (e) {
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
		await prisma.role.upsert({
			where: {
				userId_tournamentId: {
					tournamentId,
					userId
				}
			},
			update: {
				role: data.role,
				supEvents: {
					set: data.events?.map((e) => ({ id: e }))
				}
			},
			create: {
				tournamentId,
				userId,
				role: data.role,
				supEvents: {
					connect: data.events?.map((e) => ({ id: e }))
				}
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteMembers(tournamentId: bigint | string, members: string[]) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await prisma.role.deleteMany({
			where: {
				AND: {
					tournamentId,
					userId: {
						in: members
					}
				}
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function getEvent(id: bigint) {
	return await prisma.event.findUnique({
		where: {
			id
		},
		include: {
			scores: true,
			tournament: {
				include: {
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
	try {
		await prisma.event.createMany({
			data: events.map((event) => ({
				...event,
				tournamentId: tournamentId as bigint
			}))
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function touchEventsExport(eventIds: bigint[]) {
	try {
		await prisma.event.updateMany({
			where: {
				id: {
					in: eventIds
				}
			},
			data: {
				lastExportedAt: new Date()
			}
		});
	} catch (e) {
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
			await prisma.event.update({
				where: {
					id: eventId
				},
				data: {
					auditedUserId: event.auditedUserId,
					locked: true,
					auditedAt: new Date()
				}
			});
		} else if (event.auditedUserId === null && event.locked === false) {
			await prisma.event.update({
				where: {
					id: eventId
				},
				data: {
					auditedUserId: null,
					locked: false,
					auditedAt: null
				}
			});
		} else {
			await prisma.event.update({
				where: {
					id: eventId
				},
				data: {
					...event
				}
			});
		}
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteEvent(eventId: bigint) {
	try {
		await prisma.event.delete({
			where: {
				id: eventId
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function addTeams(tournamentId: bigint | string, teams: Team[]) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await prisma.team.createMany({
			data: teams.map((team) => ({
				...team,
				tournamentId: tournamentId as bigint
			}))
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function updateTeam(teamId: bigint, team: Partial<Team>) {
	try {
		await prisma.team.update({
			where: {
				id: teamId
			},
			data: {
				...team
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteTeam(teamId: bigint) {
	try {
		await prisma.team.delete({
			where: {
				id: teamId
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function addTracks(tournamentId: bigint | string, tracks: Track[]) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	try {
		await prisma.track.createMany({
			data: tracks.map((track) => ({
				...track,
				tournamentId: tournamentId as bigint
			}))
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function updateTrack(trackId: bigint, track: Partial<Track>) {
	try {
		await prisma.track.update({
			where: {
				id: trackId
			},
			data: {
				...track
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteTrack(trackId: bigint) {
	try {
		await prisma.track.delete({
			where: {
				id: trackId
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function getUserInfo(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			roles: {
				include: {
					tournament: true,
					supEvents: true
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

	return { ...user, email: supabaseUser.email };
}

export async function getTournamentInfo(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const tournament = await prisma.tournament.findUnique({
		where: { id: tournamentId }
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
	const events = await prisma.event.findMany({
		where: {
			tournamentId
		},
		include: {
			supervisors: {
				include: {
					user: true
				}
			},
			audited: true,
			scores: {
				include: {
					team: true,
					event: true
				}
			}
		}
	});

	if (events == undefined) {
		return false;
	}

	return events.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRoles(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const roles = await prisma.role.findMany({
		where: {
			tournamentId
		},
		include: {
			user: true,
			supEvents: true
		}
	});

	if (roles == undefined) {
		return false;
	}

	return roles;
}

export async function getTeams(tournamentId: bigint | string) {
	if (typeof tournamentId === 'string') {
		tournamentId = BigInt(tournamentId);
	}
	const teams = await prisma.team.findMany({
		where: {
			tournamentId
		},
		include: {
			tracks: true,
			scores: {
				include: {
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
	const tracks = await prisma.track.findMany({
		where: {
			tournamentId
		},
		include: {
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
	const invites = await prisma.invite.findMany({
		where: {
			tournamentId
		},
		include: {
			events: true
		}
	});

	if (invites == undefined) {
		return false;
	}

	return invites;
}

export async function getEventScores(eventId: bigint) {
	const scores = await prisma.score.findMany({
		where: {
			eventId
		},
		include: {
			team: true
		}
	});

	if (scores == undefined) {
		return false;
	}

	return scores;
}

export async function updateScores(scores: Partial<Score>[]) {
	try {
		await Promise.all(
			scores.map(
				async (score) =>
					await prisma.score.update({
						where: {
							id: score.id
						},
						data: score
					})
			)
		);
	} catch (e) {
		return false;
	}
	return true;
}

export async function addScores(scores: Omit<Score, 'id'>[]) {
	try {
		await prisma.score.createMany({
			data: scores
		});
	} catch (e) {
		return false;
	}
	return true;
}

export async function deleteScores(scores: bigint[]) {
	try {
		await prisma.score.deleteMany({
			where: {
				id: { in: scores }
			}
		});
	} catch (e) {
		return false;
	}
	return true;
}
