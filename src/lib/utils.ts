import { error } from '@sveltejs/kit';
import { getUserInfo } from './db';
import { TournamentRoles } from '@prisma/client';

export async function checkIsDirector(userId: string, tournamentId: string) {
	const user = await getUserInfo(userId);

	if (user === false) {
		throw error(500, 'Error fetching user information');
	}
	const userRole = user.roles.find(
		(role) => role.role === TournamentRoles.DIRECTOR && role.tournament.id === tournamentId
	);
	if (userRole == undefined) {
		throw error(403, 'You do not have permission to view this page');
	}

	return true;
}

export async function checkEventPerms(userId: string, eventId: bigint) {
	const user = await getUserInfo(userId);

	if (user === false) {
		throw error(500, 'Error fetching user information');
	}
	const userRole = user.roles.find(
		(role) => role.role === TournamentRoles.DIRECTOR || role.event?.id === eventId
	);
	if (userRole == undefined) {
		throw error(403, 'You do not have permission to view this page');
	}

	return true;
}
