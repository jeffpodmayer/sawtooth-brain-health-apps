// Full screen for client screens (ADR-005). Browsers only allow it from a click.

import screenfull from "screenfull";

// Call this inside a click handler. If the browser refuses, the page carries on at window size.
export function enterFullScreen() {
  if (screenfull.isEnabled && !screenfull.isFullscreen) {
    screenfull.request().catch(() => {});
  }
}

// Leaves full screen. Browsers allow this without a click.
// Nothing happens if the page isn't in full screen.
export function exitFullScreen() {
  if (screenfull.isEnabled && screenfull.isFullscreen) {
    screenfull.exit().catch(() => {});
  }
}
