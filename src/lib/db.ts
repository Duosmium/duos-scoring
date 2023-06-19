import {
	PrismaClient,
	type Tournament,
	type Event,
	type TournamentRoles,
	type EventStatus,
	type Team
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

export async function updateTournament(tournamentId: string, tournament: Tournament) {
	await prisma.tournament.update({
		where: {
			id: tournamentId
		},
		data: {
			...tournament
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
	events: { slug: string; name: string; status?: EventStatus; highScoring?: boolean }[]
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
	event: { name?: string; slug?: string; status?: EventStatus }
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
		console.log(e);
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

export async function getUserInfo(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
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

	return {
		name: user.name,
		tournaments: [
			...user.roles
				.reduce((acc, role) => {
					const obj = {
						role: role.role,
						event: role.event,
						tournament: role.tournament
					};
					acc.get(role.tournamentId)?.push(obj) ?? acc.set(role.tournamentId, [obj]);
					return acc;
				}, new Map<string, { role: TournamentRoles; event: Event | null; tournament: Tournament }[]>())
				.entries()
		].map(([_, roles]) => ({
			tournament: roles[0].tournament,
			roles: roles.map((role) => ({
				role: role.role,
				event: role.event
			}))
		}))
	};
}

export async function getTournamentInfo(tournamentId: string) {
	const tournament = await prisma.tournament.findUnique({
		where: { id: tournamentId },
		include: {
			events: true,
			roles: true,
			teams: true,
			tracks: true
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
