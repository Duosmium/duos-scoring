import {
	PRIVATE_GH_APP_ID,
	PRIVATE_GH_APP_KEY,
	PRIVATE_GH_INSTALLATION_ID
} from '$env/static/private';
import { error } from '@sveltejs/kit';
import { App, Octokit } from 'octokit';
import { fetchScores } from '../data.server';
import { generateFilename, generateSciolyFF } from '$lib/sciolyffHelpers';
import { checkScoremasterPerms } from '$lib/utils';
import { captureException } from '@sentry/sveltekit';
import yaml from 'js-yaml';
// @ts-ignore
import multiFile from 'octokit-commit-multiple-files';

const app = new App({
	appId: PRIVATE_GH_APP_ID,
	privateKey: PRIVATE_GH_APP_KEY,
	Octokit: Octokit.plugin(multiFile)
});

const octokit = await app.getInstallationOctokit(
	parseInt(PRIVATE_GH_INSTALLATION_ID)
);

async function getFile(path: string) {
	try {
		const data = (
			await octokit.rest.repos.getContent({
				owner: 'Duosmium',
				repo: 'duosmium',
				path,
				mediaType: { format: 'object' }
			})
		).data;
		if (Array.isArray(data) || data.type !== 'file') {
			return false;
		}
		const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
		return { ...data, decodedContent: decoded };
	} catch (e) {}
	return false;
}

export const PUT = async ({ request, locals, params }) => {
	await checkScoremasterPerms(locals.user, params.id);

	if (!locals.tournament) {
		error(404, 'Tournament not found');
	}

	if (!locals.tournament.approved) {
		error(403, 'Tournament not approved');
	}

	const payload: { exportHistos: boolean; markPrelim: boolean } =
		await request.json();
	const exportHistos = payload.exportHistos === true;
	const markPrelim = payload.markPrelim === true;

	const { events, teams, tracks, rankings, histos } = await fetchScores(
		params.id
	);

	const filename = generateFilename(locals.tournament);
	const sciolyff = generateSciolyFF(
		locals.tournament,
		events,
		tracks,
		teams,
		rankings,
		exportHistos ? histos : undefined
	);

	const files: { [k: string]: string } = {};
	const existingFile = await getFile('data/results/' + filename + '.yaml');
	if (!existingFile || existingFile.decodedContent !== sciolyff) {
		files[`data/results/${filename}.yaml`] = sciolyff;
	}

	const official = await getFile('data/official.yaml');
	if (official) {
		const officialList = yaml.load(official.decodedContent) as string[];
		if (!officialList.includes(filename)) {
			files['data/official.yaml'] = yaml.dump(officialList.concat(filename));
		}
	}
	const prelim = await getFile('data/preliminary.yaml');
	if (prelim) {
		const prelimList = yaml.load(prelim.decodedContent) as string[];
		if (markPrelim && !prelimList.includes(filename)) {
			files['data/preliminary.yaml'] = yaml.dump(prelimList.concat(filename));
		}
		if (!markPrelim && prelimList.includes(filename)) {
			files['data/preliminary.yaml'] = yaml.dump(
				prelimList.filter((x) => x !== filename)
			);
		}
	}

	if (Object.keys(files).length === 0) {
		return new Response('ok', { status: 200 });
	}

	try {
		// @ts-ignore - octokit-commit-multiple-files doesn't have types
		await octokit.createOrUpdateFiles({
			owner: 'Duosmium',
			repo: 'duosmium',
			branch: 'main',
			changes: [
				{
					message: '[skip ci] Upload Results',
					files
				}
			]
		});
	} catch (e) {
		console.error(e);
		captureException(e);
		error(500, 'Error uploading file');
	}
	return new Response('ok', { status: 201 });
};
