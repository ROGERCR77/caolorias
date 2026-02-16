import * as SentryCapacitor from '@sentry/capacitor';
import * as SentryReact from '@sentry/react';

const SENTRY_DSN = 'https://f51af4ac2a6cd8a6afd3d7ed2dbab24d@o4510897976770560.ingest.us.sentry.io/4510898027560960';

export function initSentry() {
  SentryCapacitor.init(
    {
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE || 'production',
      release: `caolorias@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        SentryReact.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      beforeSend(event) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.log('[Sentry] Event captured (dev mode, not sent):', event.exception?.values?.[0]?.value);
          return null;
        }
        return event;
      },
    },
    SentryReact.init,
  );
}

export { SentryReact };
