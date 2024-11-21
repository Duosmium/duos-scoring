import type { RequestHandler } from './$types';
import { checkScoremasterPerms } from '$lib/server/utils';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import cookie from 'cookie';
import { captureException } from '@sentry/sveltekit';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	await checkScoremasterPerms(locals.user, params.id);

	try {
		const browser = await puppeteer.launch({
			executablePath:
				process.env.PUPPETEER_EXECUTABLE_PATH ||
				(await chromium.executablePath()),
			args: chromium.args,
			defaultViewport: {
				width: 1024,
				height: 720,
				deviceScaleFactor: 1
			},
			headless: chromium.headless
		});

		const page = await browser.newPage();
		page.setJavaScriptEnabled(true);

		const domain = new URL(request.url).host;
		const cookies = Object.entries(
			cookie.parse(request.headers.get('cookie') || '', { decode: (s) => s })
		).map(([name, value]) => ({
			name,
			value,
			domain
		}));
		await page.setCookie(...cookies);

		const timeout = 8500; // 8.5 seconds, netlify function timeout is 10 sec
		const url = new URL(
			`/t/${params.id}/results/histo/${params.event}/render`,
			request.url
		).toString();
		const response = await Promise.race([
			page.goto(url, {
				timeout,
				waitUntil: ['networkidle0']
			}),
			new Promise((res) => {
				setTimeout(() => {
					res(false);
				}, timeout - 1500);
			})
		]);

		if (response === false) {
			await page.evaluate(() => window.stop());
		}

		const screenshot = await page.screenshot({
			type: 'png',
			encoding: 'binary',
			fullPage: false,
			captureBeyondViewport: false,
			clip: {
				x: 0,
				y: 0,
				width: 1024,
				height: 720
			}
		});

		// await browser.close(); // for some reason this doesn't finish

		return new Response(screenshot as Buffer, {
			headers: {
				'Content-Type': 'image/png'
			}
		});
	} catch (error) {
		console.error(error);
		captureException(error);
		return new Response(
			JSON.stringify(
				{
					error: (error as { message: string }).message
				},
				null,
				2
			),
			{
				status: (error as { httpStatusCode?: number }).httpStatusCode || 500
			}
		);
	}
};
