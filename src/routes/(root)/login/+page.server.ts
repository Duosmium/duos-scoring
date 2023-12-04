// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { getSession } }) => {
	const session = await getSession();

	if (session && url.searchParams.get('reset') === null) {
		throw redirect(303, '/dashboard');
	}

	return { url: url.origin };
};
