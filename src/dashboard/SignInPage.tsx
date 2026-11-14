// Clinicians sign in with email and password (ADR-043), restyled at 8.9. Accounts are made by Jeff, never here.

import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

const fieldClass =
  "mt-2 block h-14 w-full rounded-lg border border-field-line bg-white px-4 text-ink focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";
const buttonClass =
  "mt-8 h-14 w-full rounded-lg bg-accent px-8 font-semibold text-white hover:bg-accent-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70";

type Problem = "wrong" | "failed" | null;

function SignInPage() {
  const session = useSession();
  const [signingIn, setSigningIn] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  // The dashboard's font and 18px text (client screens stay at 20px), and buttons show a pointer on hover.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 font-dashboard text-lg [&_button:not(:disabled)]:cursor-pointer">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-line bg-surface p-8">
        <h1 className="text-center text-3xl">Sign in</h1>

        <label className="mt-8 block font-semibold">
          Email
          <input name="email" type="email" autoComplete="email" required className={fieldClass} />
        </label>

        <label htmlFor="sign-in-password" className="mt-6 block font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            id="sign-in-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${fieldClass} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-controls="sign-in-password"
            className="absolute right-1 top-1/2 h-12 -translate-y-1/2 rounded-lg px-4 font-semibold text-accent hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
          >
            {/* Heard as "Show password" or "Hide password". */}
            {showPassword ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </button>
        </div>

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
