import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.tsx";
import ClientPage from "./client/ClientPage.tsx";

// The dashboard is its own piece, so a client link never downloads it. The client page loads with the
// first request: a second download that failed would leave the client on a blank page.
const DashboardRoutes = lazy(() => import("./dashboard/DashboardRoutes.tsx"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/t/:token" element={<ClientPage />} />
        <Route
          path="/dashboard/*"
          element={
            <Suspense>
              <DashboardRoutes />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
