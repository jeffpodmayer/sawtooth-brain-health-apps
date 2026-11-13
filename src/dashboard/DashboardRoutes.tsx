// Every clinician page, under /dashboard. Loaded as its own piece, so client links never download it.

import { Navigate, Route, Routes } from "react-router";
import ClientPage from "./ClientPage";
import ClientsPage from "./ClientsPage";
import DashboardLayout from "./DashboardLayout";
import RequireSignIn from "./RequireSignIn";
import ResultsPage from "./ResultsPage";
import SignInPage from "./SignInPage";

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route element={<RequireSignIn />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/clients" replace />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientPage />} />
          <Route path="results" element={<ResultsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default DashboardRoutes;
