import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";

// Each side is its own piece: a client link never downloads the dashboard, and the reverse.
const ClientPage = lazy(() => import("./client/ClientPage.tsx"));
const DashboardRoutes = lazy(() => import("./dashboard/DashboardRoutes.tsx"));

// Only the dev server has this page, so the production build leaves it out.
const DevTestPage = import.meta.env.DEV ? lazy(() => import("./dev/DevTestPage")) : null;
const DevSequencePage = import.meta.env.DEV ? lazy(() => import("./dev/DevSequencePage")) : null;
const DevBreakPage = import.meta.env.DEV ? lazy(() => import("./dev/DevBreakPage")) : null;
const DevTrailPages = import.meta.env.DEV ? lazy(() => import("./dev/DevTrailPages")) : null;
const DevSwapsForm = import.meta.env.DEV ? lazy(() => import("./dev/DevSwapsForm")) : null;
const DevSwapsRecall = import.meta.env.DEV ? lazy(() => import("./dev/DevSwapsRecall")) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/t/:token"
          element={
            <Suspense>
              <ClientPage />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <Suspense>
              <DashboardRoutes />
            </Suspense>
          }
        />
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
        {DevSequencePage && (
          <Route
            path="/dev/sequence"
            element={
              <Suspense>
                <DevSequencePage />
              </Suspense>
            }
          />
        )}
        {DevBreakPage && (
          <Route
            path="/dev/break"
            element={
              <Suspense>
                <DevBreakPage />
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
        {DevSwapsRecall && (
          <Route
            path="/dev/swaps-recall"
            element={
              <Suspense>
                <DevSwapsRecall />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
