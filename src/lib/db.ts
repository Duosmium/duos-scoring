import {
	PrismaClient,
	type Tournament,
	type TrialStatus,
	type Team,
	type Track,
	type Score
} from '@prisma/client';
import { A } from 'flowbite-svelte';
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

export async function createTournament(tournament: Tournament) {
	await prisma.tournament.create({
		data: tournament
	});
}

export async function updateTournament(tournamentId: string, tournament: Partial<Tournament>) {
	await prisma.tournament.update({
		where: {
			id: tournamentId
		},
		data: {
			...tournament
		}
	});
}

export async function createInvites(
	tournamentId: string,
	invites: {
		link: string;
		email?: string;
		events?: bigint[];
	}[]
) {
	try {
		await Promise.all(
			invites.map(async (invite) => {
				await prisma.invite.create({
					data: {
						tournamentId,
						link: invite.link,
						email: invite.email,
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
}

export async function updateInvite(link: string, events: bigint[]) {
	try {
		await prisma.invite.update({
			where: {
				link
			},
			data: {
				events: {
					set: events.map((e) => ({ id: e }))
				}
			}
		});
	} catch (e) {
		return false;
	}
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
}

export async function updateMember(
	tournamentId: string,
	userId: string,
	data: { events?: bigint[]; admin?: boolean }
) {
	try {
		await prisma.role.upsert({
			where: {
				userId_tournamentId: {
					tournamentId,
					userId
				}
			},
			update: {
				isDirector: data.admin,
				supEvents: {
					set: data.events?.map((e) => ({ id: e }))
				}
			},
			create: {
				tournamentId,
				userId,
				isDirector: data.admin,
				supEvents: {
					connect: data.events?.map((e) => ({ id: e }))
				}
			}
		});
	} catch (e) {
		return false;
	}
}

export async function deleteMembers(tournamentId: string, members: string[]) {
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
	tournamentId: string,
	events: {
		name: string;
		trialStatus?: TrialStatus;
		highScoring?: boolean;
		medals?: number;
	}[]
) {
	try {
		await prisma.event.createMany({
			data: events.map((event) => ({
				...event,
				tournamentId
			}))
		});
	} catch (e) {
		return false;
	}
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
}

export async function addTeams(tournamentId: string, teams: Team[]) {
	try {
		await prisma.team.createMany({
			data: teams.map((team) => ({
				...team,
				tournamentId
			}))
		});
	} catch (e) {
		return false;
	}
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
}

export async function addTracks(tournamentId: string, tracks: Track[]) {
	try {
		await prisma.track.createMany({
			data: tracks.map((track) => ({
				...track,
				tournamentId
			}))
		});
	} catch (e) {
		return false;
	}
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

	if (user == undefined) {
		return false;
	}

	return user;
}

export async function getTournamentInfo(tournamentId: string) {
	const tournament = await prisma.tournament.findUnique({
		where: { id: tournamentId },
		include: {
			events: {
				include: {
					supervisors: {
						include: {
							user: true
						}
					},
					audited: true,
					scores: true
				}
			},
			roles: {
				include: {
					user: true,
					supEvents: true
				}
			},
			teams: {
				include: {
					tracks: true,
					scores: {
						include: {
							event: true
						}
					}
				}
			},
			tracks: {
				include: {
					teams: true
				}
			},
			invites: {
				include: {
					events: true
				}
			}
		}
	});

	if (tournament == undefined) {
		return false;
	}

	tournament.events.sort((a, b) => a.name.localeCompare(b.name));
	tournament.teams.sort((a, b) => a.number - b.number);

	return tournament;
}

export async function getTracks(tournamentId: string) {
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
}

export async function getEventRankings(eventId: bigint) {
	try {
		const scores = await prisma.score.findMany({
			where: {
				eventId
			},
			include: {
				team: true,
				event: true
			}
		});
		const statusOrder = {
			COMPETED: 0,
			PARTICIPATION: 1,
			NOSHOW: 2,
			DISQUALIFICATION: 3,
			NA: 4
		} as const;
		return scores
			.map((s) => ({
				...s,
				ranking:
					s.status === 'COMPETED'
						? s.rawScore
							? s.rawScore +
							  ((s.tiebreak || 0) - 1000000 * (s.tier || 1)) * (s.event.highScoring ? 1 : -1)
							: 'PARTICIPATION'
						: s.status,
				tie: false
			}))
			.sort((a, b) =>
				typeof a.ranking === 'number' && typeof b.ranking === 'number'
					? (b.ranking - a.ranking) * (a.event.highScoring ? 1 : -1)
					: typeof a.ranking === 'string' && typeof b.ranking === 'string'
					? statusOrder[a.ranking] - statusOrder[b.ranking]
					: typeof a.ranking === 'number'
					? -1
					: 1
			)
			.map((t, i, s) => {
				// check ties
				if (
					typeof t.ranking === 'number' &&
					(t.ranking === s[i - 1]?.ranking || t.ranking === s[i + 1]?.ranking)
				) {
					t.tie = true;
				} else {
					t.tie = false;
				}
				return t;
			})
			.map((t, i, s) => ({
				...t,
				ranking:
					typeof t.ranking === 'string'
						? t.ranking
						: (t.tie ? s.findIndex((x) => x.ranking === t.ranking) : i) + 1 // do index searching for ties
			}));
	} catch (e) {
		return [];
	}
}

export async function addScores(scores: Omit<Score, 'id'>[]) {
	try {
		await prisma.score.createMany({
			data: scores
		});
	} catch (e) {
		return false;
	}
}
