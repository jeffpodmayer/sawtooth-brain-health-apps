// Shows the dashboard's pages only to a signed-in clinician. Anyone else goes to sign-in.

import { Navigate, Outlet } from "react-router";
import { useSession } from "./useSession";

function RequireSignIn() {
  const session = useSession();
  if (session === undefined) return null;
  if (session === null) return <Navigate to="/dashboard/sign-in" replace />;
  return <Outlet />;
}

export default RequireSignIn;
