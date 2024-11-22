import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENV } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';

export const handleError = Sentry.handleErrorWithSentry();

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 1.0,
	environment: PUBLIC_SENTRY_ENV || 'production'
});
