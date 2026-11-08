// Development-only page (roadmap 4.6): plays three clips back to back.
// Open /audio-demo.html on the dev server. The production build leaves it out.

import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import AudioDemo from "./AudioDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AudioDemo />
  </StrictMode>,
);
