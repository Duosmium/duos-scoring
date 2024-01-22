import { error } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';

const userWithRoles = Prisma.validator<Prisma.UserArgs>()({
	include: { roles: { include: { supEvents: true } } }
});
type User = Prisma.UserGetPayload<typeof userWithRoles>;

export async function checkIsDirector(
	user: User | undefined,
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
	const userRole = user.roles.find(
		(role) => role.role === 'TD' && role.tournamentId.toString() === tournamentId
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
	user: User | undefined,
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
	const userRole = user.roles.find(
		(role) =>
			(role.role === 'TD' || role.role === 'SM') && role.tournamentId.toString() === tournamentId
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
	user: User | undefined,
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
	const userRole = user.roles.find((role) => role.tournamentId.toString() === tournamentId);
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
	user: User | undefined,
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
	const userRole = user.roles.find((role) => role.tournamentId, toString() === tournamentId);
	if (userRole == undefined) {
		if (throwError) {
			error(403, 'You do not have permission to view this page');
		} else {
			return false;
		}
	}

	return true;
}
