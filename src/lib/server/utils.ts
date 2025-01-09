import { error } from '@sveltejs/kit';
import type { Event, Role, User } from '$drizzle/types';
import { isAdmin } from './db';

type UserWithRoles = User & { roles: (Role & { supEvents: Event[] })[] };

export async function checkIsDirector(
	user: UserWithRoles | undefined,
	tournamentId: string,
	throwError = true
) {
	if (user == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}
	if (await isAdmin(user.id)) return true;

	const userRole = user.roles.find(
		(role) =>
			role.role === 'TD' && role.tournamentId.toString() === tournamentId
	);
	if (userRole == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}

export async function checkScoremasterPerms(
	user: UserWithRoles | undefined,
	tournamentId: string,
	throwError = true
) {
	if (user == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}
	if (await isAdmin(user.id)) return true;

	const userRole = user.roles.find(
		(role) =>
			(role.role === 'TD' || role.role === 'SM') &&
			role.tournamentId.toString() === tournamentId
	);
	if (userRole == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}

export async function checkEventPerms(
	user: UserWithRoles | undefined,
	tournamentId: string,
	eventId: bigint,
	throwError = true
) {
	if (user == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}
	if (await isAdmin(user.id)) return true;

	const userRole = user.roles.find(
		(role) => role.tournamentId.toString() === tournamentId
	);
	if (
		userRole == undefined ||
		(userRole.role === 'ES' &&
			userRole.supEvents.find((event) => event.id === eventId) === undefined)
	) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}

export async function checkTournamentAccess(
	user: UserWithRoles | undefined,
	tournamentId: string,
	throwError = true
) {
	if (user == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}
	if (await isAdmin(user.id)) return true;

	const userRole = user.roles.find(
		(role) => role.tournamentId,
		toString() === tournamentId
	);
	if (userRole == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}
