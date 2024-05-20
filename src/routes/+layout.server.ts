import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user: supabaseUser } = await safeGetSession();

	return { session, supabase: null, supabaseUser };
};
