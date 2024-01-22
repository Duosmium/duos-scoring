import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession();
	if (session) {
		await locals.supabase.auth.signOut();
	}
	redirect(303, '/');
};
