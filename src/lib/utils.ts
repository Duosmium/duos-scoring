import { error } from '@sveltejs/kit';
import { getUserInfo } from './db';
import { TournamentRoles } from '@prisma/client';

export async function checkIsDirector(userId: string, tournamentId: string, throwError = true) {
	const user = await getUserInfo(userId);

	if (user === false) {
		if (throwError) {
			throw error(500, 'Error fetching user information');
		} else {
			return false;
		}
	}
	const userRole = user.roles.find(
		(role) => role.role === TournamentRoles.DIRECTOR && role.tournament.id === tournamentId
	);
	if (userRole == undefined) {
		if (throwError) {
			throw error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}

export async function checkEventPerms(userId: string, eventId: bigint, throwError = true) {
	const user = await getUserInfo(userId);

	if (user === false) {
		if (throwError) {
			throw error(500, 'Error fetching user information');
		} else {
			return false;
		}
	}
	const userRole = user.roles.find(
		(role) => role.role === TournamentRoles.DIRECTOR || role.event?.id === eventId
	);
	if (userRole == undefined) {
		if (throwError) {
			throw error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}
