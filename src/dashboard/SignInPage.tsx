// Clinicians sign in with email and password (ADR-043). Accounts are made by Jeff, never here.

import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

const fieldClass =
  "mt-2 block h-14 w-full rounded-lg border-2 border-ink-muted bg-white px-4 text-ink focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
const buttonClass =
  "mt-8 h-14 w-full rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70";

type Problem = "wrong" | "failed" | null;

function SignInPage() {
  const session = useSession();
  const [signingIn, setSigningIn] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSigningIn(true);
    setProblem(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setSigningIn(false);
    if (error) {
      setProblem(error.code === "invalid_credentials" ? "wrong" : "failed");
    }
  }

  if (session === undefined) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h1 className="text-center text-4xl font-bold">Sign in</h1>

        <label className="mt-8 block font-bold">
          Email
          <input name="email" type="email" autoComplete="email" required className={fieldClass} />
        </label>

        <label className="mt-6 block font-bold">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
        </label>

        {problem && (
          <p role="alert" className="mt-6">
            {problem === "wrong"
              ? "That email and password don't match. Try again."
              : "Couldn't sign in. Check your internet connection and try again."}
          </p>
        )}

        <button type="submit" disabled={signingIn} className={buttonClass}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default SignInPage;
