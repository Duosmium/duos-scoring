import { error } from '@sveltejs/kit';

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
const ses = new SESv2Client({ region: 'us-east-1' });

export async function sendInvite(
	email: string,
	invite: string,
	tournamentName: string,
	events?: string[]
) {
	try {
		await ses.send(
			new SendEmailCommand({
				FromEmailAddress: 'Duosmium Scoring <invite@scoring.duosmium.org>',
				FeedbackForwardingEmailAddress: 'security@duosmium.org',
				Destination: {
					ToAddresses: [email]
				},
				ReplyToAddresses: ['support@duosmium.org'],
				Content: {
					Simple: {
						Subject: {
							Data: `Join the ${tournamentName}!`
						},
						Body: {
							Text: {
								Data:
									`You have been invited to join ${tournamentName} on Duosmium Scoring!\n` +
									((events?.length ?? 0) > 0
										? `You will be added to these events: ${events?.join(', ')}\n`
										: '') +
									`Click here to accept the invite: https://scoring.duosmium.org/invite/${invite}`
							},
							Html: {
								Data:
									`<h2>You have been invited to join ${tournamentName} on Duosmium Scoring!</h2>\n` +
									((events?.length ?? 0) > 0
										? `<p>You will be added to these events: ${events?.join(', ')}</p>\n`
										: '') +
									`<p><a href="https://scoring.duosmium.org/invite/${invite}">Click here</a> to accept the invite.</p>\n` +
									'<hr /><p style="color:#898989;font-size:12px;">Duosmium Scoring</p>'
							}
						}
					}
				}
			})
		);
	} catch (err) {
		console.error(err);
		error(500, 'Failed to send email!');
	}
}
