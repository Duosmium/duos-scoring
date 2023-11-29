import { PRIVATE_RESEND_API_KEY } from '$env/static/private';

import { Resend } from 'resend';
const resend = new Resend(PRIVATE_RESEND_API_KEY);

export async function sendInvite(
	email: string,
	invite: string,
	tournamentName: string,
	events?: string[]
) {
	try {
		const data = await resend.emails.send({
			from: 'Duosmium Scoring <invite@scoring.duosmium.org>',
			to: [email],
			subject: `Join the ${tournamentName}!`,
			// TODO: make email pretty
			html:
				`<p>You have been invited to join ${tournamentName} on Duosmium Scoring!</p>` +
				((events?.length ?? 0) > 0
					? `<p>You will be added to these events: ${events?.join(', ')}</p>`
					: '') +
				`<p><a href="https://scoring.duosmium.org/invite/${invite}">Click here</a> to accept the invite.</p>`,
			text:
				`You have been invited to join ${tournamentName} on Duosmium Scoring!\n` +
				((events?.length ?? 0) > 0
					? `You will be added to these events: ${events?.join(', ')}\n`
					: '') +
				`Click here to accept the invite: https://scoring.duosmium.org/invite/${invite}`
		});

		console.log(data);
	} catch (error) {
		console.error(error);
	}
}
