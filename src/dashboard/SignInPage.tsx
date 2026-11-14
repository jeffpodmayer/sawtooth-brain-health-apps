// Clinicians sign in with email and password (ADR-043), restyled at 8.9. Accounts are made by Jeff, never here.

import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router";
import { buttonClass, fieldClass, textButtonClass } from "./styles";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

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
        <h1 className="text-center text-3xl">Dashboard sign in</h1>

        <label className="mt-8 block font-semibold">
          Email
          <input name="email" type="email" autoComplete="email" required className={`mt-2 ${fieldClass}`} />
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
            className={`mt-2 ${fieldClass} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-controls="sign-in-password"
            className={`absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center ${textButtonClass}`}
          >
            {/* An open eye while hidden (click to show); a crossed-out eye while shown (click to hide). */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M4 4l16 16" />}
            </svg>
            {/* Heard as "Show password" or "Hide password". */}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        </div>

        {problem && (
          <p role="alert" className="mt-6">
            {problem === "wrong"
              ? "That email and password don't match. Try again."
              : "Couldn't sign in. Check your internet connection and try again."}
          </p>
        )}

        <button type="submit" disabled={signingIn} className={`mt-8 w-full ${buttonClass("primary")}`}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default SignInPage;
