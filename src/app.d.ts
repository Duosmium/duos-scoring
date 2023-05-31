// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
			getSession(): Promise<Session | null>;
			userId: string;
		}
		interface PageData {
			session: Session | null;
		}
		// interface Platform {}
	}
}

export {};
