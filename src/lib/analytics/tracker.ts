import type { TrackEventInput } from "./events";

export type AnalyticsAdapter = Readonly<{
  name: string;
  track(event: TrackEventInput): void | PromiseLike<void>;
}>;

export type AnalyticsTracker = Readonly<{
  trackEvent(event: TrackEventInput): void;
}>;

export const noopAnalyticsAdapter: AnalyticsAdapter = {
  name: "noop",
  track: () => undefined,
};

export function createAnalyticsTracker(
  adapter: AnalyticsAdapter = noopAnalyticsAdapter,
): AnalyticsTracker {
  return {
    trackEvent(event) {
      try {
        const result = adapter.track(event);

        if (result) {
          void Promise.resolve(result).catch(() => undefined);
        }
      } catch {
        // Analytics must not change product behavior.
      }
    },
  };
}

export const { trackEvent } = createAnalyticsTracker();
