// The bar across the top of every dashboard page (redesigned at 8.9): the practice name, and the clinician's
// name with Sign out. The client page's breadcrumb leads back to the Clients list.

import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import AccountBar from "./AccountBar";
import { supabase } from "./supabase";
import { type Me } from "./useMe";
import { useSession } from "./useSession";

function DashboardLayout() {
  const session = useSession();
  const userId = session?.user.id;
  const [me, setMe] = useState<Me | null>(null);

  // The signed-in clinician's name and practice. RLS lets them read only their own practice.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("clinicians")
      .select("display_name, practices(name)")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setMe({ displayName: data.display_name, practiceName: data.practices?.name ?? "" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // The dashboard's font and 18px text (client screens stay at 20px), and its buttons show a pointer on hover.
  return (
    <div className="font-dashboard text-lg [&_button:not(:disabled)]:cursor-pointer">
      <header className="border-b border-line bg-surface shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
          <p className="font-semibold">{me?.practiceName}</p>
          <AccountBar displayName={me?.displayName ?? null} />
        </div>
      </header>
      {/* Pages read the clinician's name with useMe. */}
      <Outlet context={me} />
    </div>
  );
}

export default DashboardLayout;
