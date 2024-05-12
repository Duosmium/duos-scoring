// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (session && url.searchParams.get('reset') === null) {
		redirect(303, '/dashboard');
	}

	return { url: url.origin };
};
