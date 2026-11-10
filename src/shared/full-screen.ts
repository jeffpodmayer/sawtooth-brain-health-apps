// Full screen for client screens (ADR-005). Browsers only allow it from a click.

import screenfull from "screenfull";

// Call this inside a click handler. If the browser refuses, the page carries on at window size.
export function enterFullScreen() {
  if (screenfull.isEnabled && !screenfull.isFullscreen) {
    screenfull.request().catch(() => {});
  }
}
