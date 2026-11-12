// The bar across the top of every dashboard page, with sign-out.

import { Outlet } from "react-router";
import { supabase } from "./supabase";

const signOutClass =
  "h-12 rounded-lg border-2 border-accent px-6 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

function DashboardLayout() {
  return (
    <>
      <header className="flex items-center justify-between border-b-2 border-form-gray px-8 py-4">
        <p className="text-xl font-bold">Sawtooth Assessments</p>
        <button type="button" onClick={() => supabase.auth.signOut()} className={signOutClass}>
          Sign out
        </button>
      </header>
      <Outlet />
    </>
  );
}

export default DashboardLayout;
