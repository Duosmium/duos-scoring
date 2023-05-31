import { updateTournament } from '$lib/db';
import type { Actions } from './$types';
import type { Divisions, States, TournamentLevels } from '@prisma/client';

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		// TODO: actual data validation/sanitization
		const name = formData.get('name')?.toString() as string;
		const shortName = formData.get('shortName')?.toString() as string;
		const slug = formData.get('slug')?.toString() as string;
		const location = formData.get('location')?.toString() as string;
		const state = formData.get('state')?.toString() as States;
		const level = formData.get('level')?.toString() as TournamentLevels;
		const division = formData.get('division')?.toString() as Divisions;
		const year = parseInt(formData.get('year')?.toString() ?? '');

		const startDate = new Date(formData.get('startDate')?.toString() ?? '');
		const endDate = new Date(formData.get('endDate')?.toString() ?? '');
		const awardsDate = new Date(formData.get('awardsDate')?.toString() ?? '');

		const medals = parseInt(formData.get('medals')?.toString() ?? '') || null;
		const trophies = parseInt(formData.get('trophies')?.toString() ?? '') || null;
		const bids = parseInt(formData.get('bids')?.toString() ?? '') || null;
		const nOffset = parseInt(formData.get('nOffset')?.toString() ?? '') || null;
		const drops = parseInt(formData.get('drops')?.toString() ?? '') || null;

		try {
			await updateTournament(params.id, {
				id: slug,
				name,
				shortName,
				location,
				state,
				level,
				division,
				year,
				startDate,
				endDate,
				awardsDate,
				medals,
				trophies,
				bids,
				nOffset,
				drops
			});
		} catch (e) {
			console.error(e);
			return {
				error: 'Error updating tournament.'
			};
		}

		return {
			success: true
		};
	}
} satisfies Actions;
