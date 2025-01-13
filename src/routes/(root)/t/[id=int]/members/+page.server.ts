import type { PageServerLoad } from './$types';

import { checkIsDirector } from '$lib/server/utils';
import { supabase } from '$lib/server/supabaseAdmin';
import {
	getEvents,
	getInvites,
	getRoles,
	getUserEmailLookup
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	await checkIsDirector(locals.user, params.id);

	const roles = (await getRoles(params.id)) || [];

	const emails = await getUserEmailLookup(roles.map((role) => role.user.id));

	const invites = (await getInvites(params.id)) || [];
	const events = (await getEvents(params.id)) || [];
	return {
		roles,
		invites,
		events,
		emails
	};
};
