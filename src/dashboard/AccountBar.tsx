// The signed-in clinician's name and a Sign out link, at the top right of every dashboard page (8.9).
// No menu: signing out is one click.

import { textButtonClass } from "./styles";
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
        className={`h-9 px-3 text-base ${textButtonClass}`}
      >
        Sign out
      </button>
    </div>
  );
}

export default AccountBar;
