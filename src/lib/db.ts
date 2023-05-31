import {
	PrismaClient,
	type Tournament,
	type Event,
	type TournamentRoles,
	EventStatus
} from '@prisma/client';
const prisma = new PrismaClient();

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
	events: { slug: string; name: string; status?: EventStatus }[]
) {
	await prisma.event.createMany({
		data: events.map((event) => ({
			...event,
			tournamentId
		}))
	});
}

export async function updateEvent(
	eventId: number,
	event: { name?: string; slug?: string; status?: EventStatus }
) {
	await prisma.event.update({
		where: {
			id: eventId
		},
		data: {
			...event
		}
	});
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

	return tournament;
}
