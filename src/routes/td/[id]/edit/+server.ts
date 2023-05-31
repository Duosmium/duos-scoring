import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (() => {
	throw redirect(302, 'edit/general');
}) satisfies RequestHandler;
