// The signed-in clinician's name and a Sign out link, at the top right of every dashboard page (8.9).
// No menu: signing out is one click.

import { supabase } from "./supabase";

function AccountBar({ displayName }: { displayName: string | null }) {
  return (
    <div className="flex items-center gap-3 text-base">
      {displayName && (
        <>
          <span className="text-ink-muted">{displayName}</span>
          {/* A thin upright line between the name and Sign out. */}
          <span aria-hidden="true" className="h-4 w-px bg-field-line" />
        </>
      )}
      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        className="-ml-2 h-12 rounded-lg px-2 text-accent underline-offset-4 hover:text-accent-strong hover:underline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
      >
        Sign out
      </button>
    </div>
  );
}

export default AccountBar;
