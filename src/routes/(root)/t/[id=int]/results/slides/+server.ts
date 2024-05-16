import {
	addSlidesBatch,
	clearSlides,
	getSlides,
	markSlidesDone,
	setSlidesChannel,
	updateSlidesSettings
} from '$lib/db';
import { checkScoremasterPerms } from '$lib/utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';
import { supabase } from '$lib/supabaseAdmin';

export const GET: RequestHandler = async ({ params, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const slides = await getSlides(params.id);

	return json(slides);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: {
		events?: string[];
		done?: boolean;
	} = await request.json();
	if (payload.events == undefined && payload.done == undefined)
		return new Response('missing events or done', { status: 400 });
	if (
		payload.events &&
		(!Array.isArray(payload.events) || payload.events.some((event) => typeof event !== 'string'))
	)
		return new Response('invalid events', { status: 400 });

	if (payload.done != undefined && typeof payload.done !== 'boolean')
		return new Response('invalid done', { status: 400 });

	const slides = await getSlides(params.id);
	let channelId = slides.channelId;
	if (!slides.channelId) {
		channelId = nanoid(22);
		const channelStatus = await setSlidesChannel(params.id, channelId);
		if (!channelStatus) {
			return new Response('error creating presentation', { status: 500 });
		}
	}

	if (payload.events) {
		const batchStatus = await addSlidesBatch(
			params.id,
			payload.events.map((e) => BigInt(e))
		);
		if (!batchStatus) {
			return new Response('error adding events', { status: 500 });
		}
	}

	if (payload.done != undefined) {
		const doneStatus = await markSlidesDone(params.id, payload.done);
		if (!doneStatus) {
			return new Response('error marking presentation done', { status: 500 });
		}
	}

	if (slides.channelId) {
		const slidesChannel = supabase.channel(slides.channelId);
		slidesChannel.subscribe((status) => {
			// Wait for successful connection
			if (status !== 'SUBSCRIBED') {
				return null;
			}

			slidesChannel.send({
				type: 'broadcast',
				event: 'update'
			});
		});
	}

	return new Response(channelId);
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const payload: PrismaJson.SlidesSettings = await request.json();
	if (!payload) return new Response('invalid payload', { status: 400 });

	const status = await updateSlidesSettings(params.id, payload);
	if (!status) return new Response('failed to update settings', { status: 500 });

	return new Response('ok');
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	await checkScoremasterPerms(locals.user, params.id);

	const slides = await getSlides(params.id);
	if (!slides.channelId) return new Response('no presentation in progress', { status: 400 });

	const status = await clearSlides(params.id);

	if (!status) {
		return new Response('error clearing presentation', { status: 500 });
	}
	return new Response('ok');
};
