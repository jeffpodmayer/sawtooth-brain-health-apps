import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";

// Only the dev server has this page, so the production build leaves it out.
const DevTestPage = import.meta.env.DEV ? lazy(() => import("./dev/DevTestPage")) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {DevTestPage && (
          <Route
            path="/dev/test/trail-making"
            element={
              <Suspense>
                <DevTestPage />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
