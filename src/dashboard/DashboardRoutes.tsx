// Every clinician page, under /dashboard. Loaded as its own piece, so client links never download it.

// The dashboard's font loads with this piece only, so client screens never download it (ADR-047).
import "@fontsource-variable/atkinson-hyperlegible-next";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import ClientPage from "./visit/ClientPage";
import ClientsPage from "./clients/ClientsPage";
import DashboardLayout from "./DashboardLayout";
import RequireSignIn from "./sign-in/RequireSignIn";
import SignInPage from "./sign-in/SignInPage";

function DashboardRoutes() {
  // The tab reads "Sawtooth · Dashboard" on every clinician page, so it stands apart from a client's "Sawtooth"
  // tab during a session. Back to plain "Sawtooth" on leaving.
  useEffect(() => {
    document.title = "Sawtooth · Dashboard";
    return () => {
      document.title = "Sawtooth";
    };
  }, []);

  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route element={<RequireSignIn />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/clients" replace />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default DashboardRoutes;
