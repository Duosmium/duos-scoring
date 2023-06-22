import { addEvents, getTournamentInfo, updateEvent } from '$lib/db';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import defaultEventData from '$lib/data/events';
import slugify from 'slugify';
import type { TrialStatus } from '@prisma/client';

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		if (formData.get('addEvents')?.toString() === 'true') {
			const tournament = await getTournamentInfo(params.id);
			if (tournament === false) {
				return fail(500, { message: 'Error fetching tournament information' });
			}
			const currentEvents =
				defaultEventData[tournament.division as keyof typeof defaultEventData]?.[
					tournament.year as keyof typeof defaultEventData.B
				] ?? [];
			if (currentEvents.length === 0) {
				return fail(400, { message: 'No default events for this division and year' });
			}
			await addEvents(
				params.id,
				currentEvents.map((event) => ({
					name: event,
					slug: slugify(event, { lower: true, strict: true, trim: true })
				}))
			);
			// TODO: error handling
			return { success: true };
		}

		// TODO: data validation
		const events = formData.getAll('event').map((eventId) => eventId.toString());
		// TODO: error handling
		events.forEach(async (eventId) => {
			if (eventId.startsWith('new')) {
				await addEvents(params.id, [
					{
						name: formData.get(`${eventId}_name`)?.toString() as string,
						slug: slugify(formData.get(`${eventId}_name`)?.toString() as string, {
							lower: true,
							strict: true,
							trim: true
						}),
						trialStatus: (formData.get(`${eventId}_status`)?.toString() as TrialStatus) ?? undefined
					}
				]);
			} else {
				const name = formData.get(`${eventId}_name`)?.toString() ?? undefined;
				await updateEvent(BigInt(eventId), {
					name,
					slug: name ? slugify(name, { lower: true, strict: true, trim: true }) : undefined,
					trialStatus: (formData.get(`${eventId}_status`)?.toString() as TrialStatus) ?? undefined
				});
			}
		});
		return { success: true };
	}
} satisfies Actions;
