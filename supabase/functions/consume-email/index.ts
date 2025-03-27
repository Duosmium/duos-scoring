// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import * as Sentry from 'https://deno.land/x/sentry@8.55.0/index.mjs';
import { Pgmq } from 'https://deno.land/x/pgmq@v0.2.1/mod.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

Sentry.init({
	dsn: Deno.env.get('PUBLIC_SENTRY_DSN'),
	defaultIntegrations: false,
	tracesSampleRate: 1.0,
	environment: Deno.env.get('PUBLIC_SENTRY_ENV') || 'production'
});

// Set region and execution_id as custom tags
Sentry.setTag('region', Deno.env.get('SB_REGION'));
Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'));

type Email = Queue.Email;

const QUEUE_NAME = 'emails';

let pgmq: Pgmq;
const smtp = new SMTPClient({
	connection: {
		hostname: 'email-smtp.us-east-1.amazonaws.com',
		port: 2465,
		tls: true,
		auth: {
			username: Deno.env.get('PRIVATE_SMTP_USER') ?? '',
			password: Deno.env.get('PRIVATE_SMTP_PASS') ?? ''
		}
	}
});

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let unloading = false;

addEventListener('beforeunload', async () => {
	console.log('Function will be shutdown');
	unloading = true;
	await smtp.close();
	if (pgmq) await pgmq.close();
});

async function consumeEmails(): Promise<void> {
	if (!pgmq) {
		console.log('Connecting to Postgres...');
		try {
			pgmq = await Pgmq.new({
				dsn: Deno.env.get('SUPABASE_DB_URL')
			});
			console.log('Connected to Postgres');
		} catch (err) {
			Sentry.captureException(err);
			console.error('Failed to connect to Postgres', err);
			return;
		}
	}

	const vt = 10; // seconds before message becomes readable again
	try {
		let receivedMsg = await pgmq.msg.read<Email>(QUEUE_NAME, vt);
		while (receivedMsg && !unloading) {
			console.log('Received message...');

			const payload = receivedMsg.message;
			try {
				await smtp.send({
					from: `Duosmium Scoring <${payload.fromUser || 'info'}@scoring.duosmium.org>`,
					to: payload.to,
					replyTo: 'support@duosmium.org',
					subject: payload.subject,
					content: payload.text,
					html: payload.html
				});
				console.log('Email sent');
				await pgmq.msg.delete(QUEUE_NAME, receivedMsg.msgId);
			} catch (err) {
				console.log('Failed to send email: ' + err);
			}
			await sleep(50);
			receivedMsg = await pgmq.msg.read<Email>(QUEUE_NAME, vt);
		}
		console.log('No more messages received.');
		await smtp.close();
		if (pgmq) await pgmq.close();
		return;
	} catch (err) {
		Sentry.captureException(err);
		console.error('error occurred: ' + err);
		await smtp.close();
		if (pgmq) await pgmq.close();
		return;
	}
}

Deno.serve(() => {
	EdgeRuntime.waitUntil(consumeEmails());

	return new Response('Task started', {
		status: 202
	});
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/consume-email' \
    --header 'Authorization: Bearer <TOKEN>' \
*/
