import {} from '$lib/db';
import type { RequestHandler } from './$types';
import { checkIsDirector } from '$lib/utils';

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
	await checkIsDirector(locals.userId, params.id);

	const payload: {
		[key: string]: string;
	} = await request.json();

	payload;

	return new Response('ok');
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	await checkIsDirector(locals.userId, params.id);

	const payload: {
		[key: string]: string;
	} = await request.json();
	if (!payload.id || typeof payload.id !== 'string') {
		return new Response('missing', { status: 404 });
	}
	if (!payload.data) {
		// TODO: validate data
		return new Response('invalid payload', { status: 400 });
	}

	return new Response('ok');
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await checkIsDirector(locals.userId, params.id);

	const payload = await request.json();

	payload;

	return new Response('ok');
};
