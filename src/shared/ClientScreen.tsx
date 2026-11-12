// The layout for every client screen around the tests: content in the middle of the page.

import type { ReactNode } from "react";

type ClientScreenProps = {
  children: ReactNode;
};

function ClientScreen({ children }: ClientScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <div className="max-w-2xl">{children}</div>
    </main>
  );
}

export default ClientScreen;
