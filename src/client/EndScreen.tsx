// Shown when the client has finished every test (roadmap 7.8). The sequence is already
// closed by then, by the save of its last test, so reopening the link is refused.
// It leaves full screen, so the client can see their other tabs and go back to the video call.

import { useEffect } from "react";
import ClientScreen from "../shared/ClientScreen";
import { exitFullScreen } from "../shared/full-screen";

// Moves keyboard and screen reader users to the heading when the screen appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

function EndScreen() {
  useEffect(() => {
    exitFullScreen();
  }, []);

  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        Thank you
      </h1>
      <p className="mt-4">You have finished. You can close this page and go back to your video call.</p>
    </ClientScreen>
  );
}

export default EndScreen;
