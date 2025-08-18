import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

/**
 * Removed duplicate Sentry.init to avoid multiple Session Replay instances.
 * Client initialization is handled in sentry.client.config.ts
 */
