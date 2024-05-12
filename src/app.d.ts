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
			user: Exclude<Awaited<ReturnType<typeof getUserInfo>>, false>;
			tournament?: Exclude<Awaited<ReturnType<typeof getTournamentInfo>>, false>;
			role?: Exclude<Awaited<ReturnType<typeof getUserInfo>>, false>['roles'][number];
		}
		interface PageData {
			session: Session | null;
		}
		// interface Platform {}
	}

	namespace PrismaJson {
		interface SlidesSettings {
			tournamentLogo: string;
			tournamentLogoDimensions: [number, number];
			logoTextHeight: number;
			logoAwardsHeight: number;
			sidebarLineHeight: number;
			dividerOffset: number;
			titleFontSize: number;
			headerFontSize: number;
			sidebarFontSize: number;
			teamFontSize: number;
			teamLineHeight: number;
			themeBgColor: string;
			themeTextColor: string;
			bgColor: string;
			textColor: string;
			headerTextColor: string;
			randomOrder: boolean;
			combineTracks: boolean;
			separateTracks: boolean;
			overallSchools: boolean;
			overallPoints: boolean;
			eventsOnly: boolean;
			tournamentUrl: string;
			qrCode: boolean;
		}

		type SlidesBatches = bigint[][];
	}
}

export {};
