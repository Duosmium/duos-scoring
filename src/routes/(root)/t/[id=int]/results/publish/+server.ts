import {
	PRIVATE_GH_APP_ID,
	PRIVATE_GH_APP_KEY,
	PRIVATE_GH_INSTALLATION_ID
} from '$env/static/private';
import { error } from '@sveltejs/kit';
import { App } from 'octokit';
import { fetchScores } from '../data.server';
import { generateFilename, generateSciolyFF } from '$lib/sciolyffHelpers';
import { checkScoremasterPerms } from '$lib/utils';
import { captureException } from '@sentry/sveltekit';

const app = new App({
	appId: PRIVATE_GH_APP_ID,
	privateKey: PRIVATE_GH_APP_KEY
});

const octokit = await app.getInstallationOctokit(
	parseInt(PRIVATE_GH_INSTALLATION_ID)
);

export const PUT = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	if (!locals.tournament) {
		error(500, 'Tournament not found');
	}

	const exportHistos = (await request.json()).exportHistos === true;

	const { events, teams, tracks, rankings, histos } = await fetchScores(
		params.id
	);

	const filename = generateFilename(locals.tournament) + '.yaml';
	const sciolyff = generateSciolyFF(
		locals.tournament,
		events,
		tracks,
		teams,
		rankings,
		exportHistos ? histos : undefined
	);

	// base64 encoding
	const content = Buffer.from(sciolyff).toString('base64');

	let sha: string | undefined = undefined;
	try {
		const data = (
			await octokit.rest.repos.getContent({
				owner: 'Duosmium',
				repo: 'duosmium',
				path: 'data/results/' + filename,
				mediaType: { format: 'object' }
			})
		).data;
		if (Array.isArray(data)) {
			error(500, 'Invalid file');
		}
		sha = data.sha;
	} catch (e) {}
	try {
		await octokit.rest.repos.createOrUpdateFileContents({
			owner: 'Duosmium',
			repo: 'duosmium',
			path: 'data/results/' + filename,
			message: 'Upload Results',
			content,
			sha
		});
	} catch (e) {
		console.error(e);
		captureException(e);
		error(500, 'Error uploading file');
	}
	return new Response('ok', { status: 200 });
};
