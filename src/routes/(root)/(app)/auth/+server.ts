import type { EmailOtpType } from '@supabase/supabase-js';
import { error, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { captureException } from '@sentry/sveltekit';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;

	const redirectTo = new URL(
		url.searchParams.get('next') ?? '/dashboard',
		'https://scoring.duosmium.org'
	);
	redirectTo.searchParams.delete('token_hash');
	redirectTo.searchParams.delete('type');
	redirectTo.searchParams.delete('next');

	if (token_hash && type) {
		const { error: authError } = await supabase.auth.verifyOtp({
			type,
			token_hash
		});
		if (!authError) {
			return redirect(303, redirectTo);
		}

		if (!authError.status || authError.status >= 500) {
			captureException(authError);
		}
		error(authError.status || 500, authError.message);
	}
	error(400, 'Missing token or type');
};
