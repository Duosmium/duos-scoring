import { PRIVATE_SMTP_PASS, PRIVATE_SMTP_USER } from '$env/static/private';
import { error } from '@sveltejs/kit';

import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
	host: 'email-smtp.us-east-1.amazonaws.com',
	port: 465,
	secure: true,
	auth: {
		user: PRIVATE_SMTP_USER,
		pass: PRIVATE_SMTP_PASS
	}
});

export async function sendInvite(
	email: string,
	invite: string,
	tournamentName: string,
	events?: string[]
) {
	try {
		await mailer.sendMail({
			from: 'Duosmium Scoring <invite@scoring.duosmium.org>',
			to: email,
			replyTo: 'support@duosmium.org',
			subject: `Join the ${tournamentName}!`,
			text:
				`You have been invited to join ${tournamentName} on Duosmium Scoring!\n` +
				((events?.length ?? 0) > 0
					? `You will be added to these events: ${events?.join(', ')}\n`
					: '') +
				`Click here to accept the invite: https://scoring.duosmium.org/invite/${invite}`,
			html:
				`<h2>You have been invited to join ${tournamentName} on Duosmium Scoring!</h2>\n` +
				((events?.length ?? 0) > 0
					? `<p>You will be added to these events: ${events?.join(', ')}</p>\n`
					: '') +
				`<p><a href="https://scoring.duosmium.org/invite/${invite}">Click here</a> to accept the invite.</p>\n` +
				'<hr /><p style="color:#898989;font-size:12px;">Duosmium Scoring</p>'
		});
	} catch (err) {
		console.error(err);
		error(500, 'Failed to send email!');
		return false;
	}
	return true;
}
