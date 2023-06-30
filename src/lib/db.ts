import {
	PrismaClient,
	type Tournament,
	type Event,
	type TournamentRoles,
	type TrialStatus,
	type Team,
	type Track,
	type Score
} from '@prisma/client';
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

export async function addUserToTournament(userId: string, tournamentId: string) {
	await prisma.user.update({
		where: {
			id: userId
		},
		data: {
			tournaments: {
				connect: {
					id: tournamentId
				}
			}
		}
	});
}

export async function addUserToRole(
	userId: string,
	tournamentId: string,
	role: TournamentRoles,
	eventId: number | null
) {
	await prisma.role.create({
		data: {
			userId,
			tournamentId,
			role,
			eventId
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
	}
) {
	try {
		await prisma.event.update({
			where: {
				id: eventId
			},
			data: {
				...event
			}
		});
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
			tournaments: true,
			roles: {
				include: {
					tournament: true,
					event: true
				}
			}
		}
	});

	if (user == undefined) {
		return false;
	}

	const tournamentRoles = user.roles.reduce((acc, role) => {
		const obj = {
			role: role.role,
			event: role.event,
			tournament: role.tournament
		};
		acc.get(role.tournamentId)?.push(obj) ?? acc.set(role.tournamentId, [obj]);
		return acc;
	}, new Map<string, { role: TournamentRoles; event: Event | null; tournament: Tournament }[]>());

	return {
		...user,
		tournaments: user.tournaments.map((tournament) => ({
			...tournament,
			roles: tournamentRoles.get(tournament.id) ?? [],
			isDirector:
				(tournamentRoles.get(tournament.id) ?? []).find((role) => role.role === 'DIRECTOR') !=
				undefined
		}))
	};
}

export async function getTournamentInfo(tournamentId: string) {
	const tournament = await prisma.tournament.findUnique({
		where: { id: tournamentId },
		include: {
			events: {
				include: {
					roles: {
						include: {
							user: true
						}
					},
					audited: true,
					scores: true
				}
			},
			roles: true,
			teams: true,
			tracks: {
				include: {
					teams: true
				}
			},
			users: {
				include: {
					roles: {
						where: {
							tournamentId
						},
						include: {
							event: true
						}
					}
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

export async function addScores(scores: Omit<Score, 'id'>[]) {
	try {
		await prisma.score.createMany({
			data: scores
		});
	} catch (e) {
		return false;
	}
}
