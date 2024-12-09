import type { EmailOtpType } from '@supabase/supabase-js';
import { error, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { captureException } from '@sentry/sveltekit';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = new URL(
		url.searchParams.get('next') ?? '/',
		'https://scoring.duosmium.org'
	).pathname;

	const redirectTo = new URL('https://scoring.duosmium.org');
	redirectTo.pathname = next;

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		if (!error) {
			return redirect(303, redirectTo);
		}
		captureException(error);
	}
	error(500, 'Something went wrong during authentication.');
};
