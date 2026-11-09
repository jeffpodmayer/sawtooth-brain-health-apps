import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";

// Only the dev server has this page, so the production build leaves it out.
const DevTestPage = import.meta.env.DEV ? lazy(() => import("./dev/DevTestPage")) : null;
const DevTrailPages = import.meta.env.DEV ? lazy(() => import("./dev/DevTrailPages")) : null;
const DevSwapsForm = import.meta.env.DEV ? lazy(() => import("./dev/DevSwapsForm")) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {DevTestPage && (
          <Route
            path="/dev/test/:testId"
            element={
              <Suspense>
                <DevTestPage />
              </Suspense>
            }
          />
        )}
        {DevTrailPages && (
          <Route
            path="/dev/trail-pages"
            element={
              <Suspense>
                <DevTrailPages />
              </Suspense>
            }
          />
        )}
        {DevSwapsForm && (
          <Route
            path="/dev/swaps-form"
            element={
              <Suspense>
                <DevSwapsForm />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
