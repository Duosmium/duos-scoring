// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';
import type { getTournamentInfo, getUserInfo } from '$lib/db';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
			getSession(): Promise<Session | null>;
			userId: string;
			tournament?: Exclude<Awaited<ReturnType<typeof getTournamentInfo>>, false>;
			user?: Exclude<Awaited<ReturnType<typeof getUserInfo>>, false>;
			role?: Exclude<Awaited<ReturnType<typeof getUserInfo>>, false>['roles'][number];
		}
		interface PageData {
			session: Session | null;
		}
		// interface Platform {}
	}
}

export {};
