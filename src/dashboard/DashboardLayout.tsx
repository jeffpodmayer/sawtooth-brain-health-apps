// The bar across the top of every dashboard page, with the page links and sign-out.

import { NavLink, Outlet } from "react-router";
import { supabase } from "./supabase";

const navLinkClass =
  "inline-flex h-12 items-center px-2 font-bold text-accent underline-offset-8 aria-[current=page]:underline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
const signOutClass =
  "h-12 rounded-lg border-2 border-accent px-6 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

function DashboardLayout() {
  return (
    <>
      <header className="flex items-center justify-between border-b-2 border-form-gray px-8 py-4">
        <div className="flex items-center gap-8">
          <p className="text-xl font-bold">Sawtooth Assessments</p>
          <nav aria-label="Dashboard">
            <NavLink to="/dashboard/clients" className={navLinkClass}>
              Clients
            </NavLink>
          </nav>
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()} className={signOutClass}>
          Sign out
        </button>
      </header>
      <Outlet />
    </>
  );
}

export default DashboardLayout;
