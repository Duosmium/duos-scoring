import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';

export const GET: RequestHandler = async (event) => {
	const {
		url,
		locals: { supabase }
	} = event;
	const tokenHash = url.searchParams.get('token_hash') as string;
	const type = url.searchParams.get('type') as EmailOtpType;
	const next = url.searchParams.get('next') ?? '/';

	if (tokenHash && type) {
		const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
		if (!error) {
			redirect(303, next);
		}
	}

	error(500, 'Something went wrong during authentication.');
};
