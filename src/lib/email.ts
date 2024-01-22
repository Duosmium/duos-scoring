import { PRIVATE_RESEND_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';

import { Resend } from 'resend';
const resend = new Resend(PRIVATE_RESEND_API_KEY);

export async function sendInvite(
	email: string,
	invite: string,
	tournamentName: string,
	events?: string[]
) {
	try {
		await resend.emails.send({
			from: 'Duosmium Scoring <invite@scoring.duosmium.org>',
			to: [email],
			subject: `Join the ${tournamentName}!`,
			html:
				`<h2>You have been invited to join ${tournamentName} on Duosmium Scoring!</h2>\n` +
				((events?.length ?? 0) > 0
					? `<p>You will be added to these events: ${events?.join(', ')}</p>\n`
					: '') +
				`<p><a href="https://scoring.duosmium.org/invite/${invite}">Click here</a> to accept the invite.</p>\n` +
				'<hr /><p style="color:#898989;font-size:12px;">Duosmium Scoring</p>',
			text:
				`You have been invited to join ${tournamentName} on Duosmium Scoring!\n` +
				((events?.length ?? 0) > 0
					? `You will be added to these events: ${events?.join(', ')}\n`
					: '') +
				`Click here to accept the invite: https://scoring.duosmium.org/invite/${invite}`
		});
	} catch (err) {
		error(500, 'Failed to send emails: ' + err);
	}
}
