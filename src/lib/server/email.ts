import { DATABASE_URL } from '$env/static/private';
import { captureException } from '@sentry/sveltekit';
import { Pgmq } from 'pgmq-js';

let pgmq: Pgmq;

export async function sendEmails(emails: Queue.Email[]) {
	if (!pgmq) {
		try {
			const params = new URL(DATABASE_URL);
			pgmq = await Pgmq.new(
				{
					user: params.username,
					password: params.password,
					host: params.hostname,
					port: parseInt(params.port),
					database: params.pathname.split('/')[1],
					ssl: false
				},
				{ skipExtensionCreation: true }
			);
		} catch (err) {
			console.error(err);
			captureException(err);
			return false;
		}
	}
	try {
		await pgmq.msg.sendBatch('emails', emails);
	} catch (err) {
		console.error(err);
		captureException(err);
		return false;
	}
	return true;
}

export async function sendInvites(
	invites: {
		email: string;
		invite: string;
		tournamentName: string;
		events?: string[];
	}[]
) {
	return await sendEmails(
		invites.map((i) => ({
			fromUser: 'invite',
			to: i.email,
			subject: `Join the ${i.tournamentName}!`,
			text:
				`You have been invited to join ${i.tournamentName} on Duosmium Scoring!\n` +
				((i.events?.length ?? 0) > 0
					? `You will be added to these events: ${i.events?.join(', ')}\n`
					: '') +
				`Click here to accept the invite: https://scoring.duosmium.org/invite/${i.invite}`,
			html:
				`<h2>You have been invited to join ${i.tournamentName} on Duosmium Scoring!</h2>\n` +
				((i.events?.length ?? 0) > 0
					? `<p>You will be added to these events: ${i.events?.join(', ')}</p>\n`
					: '') +
				`<p><a href="https://scoring.duosmium.org/invite/${i.invite}">Click here</a> to accept the invite.</p>\n` +
				'<hr /><p style="color:#898989;font-size:12px;">Duosmium Scoring</p>'
		}))
	);
}
