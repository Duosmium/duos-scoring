import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENV } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 0.3,
	environment: PUBLIC_SENTRY_ENV || 'production',
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	integrations: [
		Sentry.replayIntegration({
			maskAllText: true,
			blockAllMedia: true
		})
	]
});

export const handleError = Sentry.handleErrorWithSentry();
