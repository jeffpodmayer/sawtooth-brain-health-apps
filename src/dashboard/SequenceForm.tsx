// The Generate Test Sequence form (roadmap 8.4b, restyled at 8.9): a client ID and the tests to give.
// create_sequence saves the client (if new), the sequence and its tests together (ADR-044).

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { clientCodeProblem, digitsOnly } from "./clientCode";
import { formatDate } from "./formatDate";
import { sequenceTests } from "./sequence-tests";
import { buttonClass, fieldClass } from "./styles";
import { supabase } from "./supabase";

export type CreatedSequence = {
  code: string;
  linkToken: string;
  clientIsNew: boolean;
  clientAddedAt: string;
  testNames: string[];
};

type Test = { id: string; name: string };

type TestsLoad = { state: "loading" } | { state: "failed" } | { state: "loaded"; tests: Test[] };

// What the database said about a typed code. Shown only while that code is still in the field.
type Lookup = { code: string; addedAt: string | null };

type Props = {
  fixedCode?: string; // opened from a client's page: the ID is shown, not typed
  onCreated: (created: CreatedSequence) => void;
  onCancel: () => void;
};

function SequenceForm({ fixedCode, onCreated, onCancel }: Props) {
  const [testsLoad, setTestsLoad] = useState<TestsLoad>({ state: "loading" });
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [code, setCode] = useState(fixedCode ?? "");
  const [codeProblem, setCodeProblem] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [creating, setCreating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // The practice's enabled tests (RLS), in the app's set order, all ticked to start.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("enabled_tests")
      .select("test_id")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setTestsLoad({ state: "failed" });
          return;
        }
        const enabled = new Set(data.map((row) => row.test_id));
        const tests = sequenceTests.filter((test) => enabled.has(test.id));
        setTestsLoad({ state: "loaded", tests });
        setTicked(new Set(tests.map((test) => test.id)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Once typing pauses, ask whether the code is already one of the practice's clients (RLS).
  // A fixed ID came from the client's own page, so it's already a client.
  useEffect(() => {
    if (fixedCode) return;
    const typed = code.trim();
    if (clientCodeProblem(typed) !== null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      supabase
        .from("clients")
        .select("created_at")
        .eq("code", typed)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled || error) return;
          setLookup({ code: typed, addedAt: data?.created_at ?? null });
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, fixedCode]);

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(digitsOnly(event.currentTarget.value));
    setCodeProblem(null);
    setProblem(null);
  }

  function handleTickChange(testId: string, isTicked: boolean) {
    const next = new Set(ticked);
    if (isTicked) next.add(testId);
    else next.delete(testId);
    setTicked(next);
    setProblem(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (testsLoad.state !== "loaded") return;
    const typed = code.trim();

    const typedProblem = clientCodeProblem(typed);
    if (typedProblem) {
      setCodeProblem(typedProblem);
      return;
    }
    // In the order the tests are listed, which is the order they're given.
    const chosen = testsLoad.tests.filter((test) => ticked.has(test.id));
    if (chosen.length === 0) {
      setProblem("Tick at least one test.");
      return;
    }

    setCreating(true);
    setProblem(null);
    const { data, error } = await supabase
      .rpc("create_sequence", { client_code: typed, test_ids: chosen.map((test) => test.id) })
      .single();

    if (error) {
      setCreating(false);
      setProblem("Couldn't create the link. Check your internet connection and try again.");
      return;
    }

    onCreated({
      code: typed,
      linkToken: data.link_token,
      clientIsNew: data.client_is_new,
      clientAddedAt: data.client_created_at,
      testNames: chosen.map((test) => test.name),
    });
  }

  const currentLookup = lookup?.code === code.trim() ? lookup : null;
  let codeStatus = "";
  if (codeProblem) codeStatus = codeProblem;
  else if (currentLookup?.addedAt) codeStatus = `Existing client, added ${formatDate(currentLookup.addedAt)}.`;
  else if (currentLookup) codeStatus = "New client.";
  // A found or new client gets a teal mark; a problem stays plain text.
  const statusMark = codeProblem ? null : currentLookup?.addedAt ? "✓" : currentLookup ? "＋" : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6">
      {fixedCode ? (
        <div>
          <p className="font-semibold">Client ID</p>
          <p className="mt-1">{fixedCode}</p>
        </div>
      ) : (
        <>
          <label className="block font-semibold">
            Client ID
            <input
              name="code"
              value={code}
              onChange={handleCodeChange}
              autoComplete="off"
              inputMode="numeric"
              maxLength={4}
              spellCheck={false}
              aria-invalid={codeProblem !== null}
              aria-describedby="sequence-code-status"
              className={`mt-2 max-w-64 ${fieldClass}`}
            />
          </label>
          <p
            id="sequence-code-status"
            role="status"
            className={`mt-1 min-h-7 font-semibold ${statusMark ? "text-success-ink" : ""}`}
          >
            {statusMark && <span aria-hidden="true">{statusMark} </span>}
            {codeStatus}
          </p>
        </>
      )}

      <fieldset className="mt-2">
        <legend className="font-semibold">Tests</legend>
        {testsLoad.state === "loading" && <p className="mt-2">Loading…</p>}
        {testsLoad.state === "failed" && (
          <p role="alert" className="mt-2">
            Couldn't load the tests. Close this window and try again.
          </p>
        )}
        {testsLoad.state === "loaded" && testsLoad.tests.length === 0 && (
          <p className="mt-2">No tests are turned on for your practice.</p>
        )}
        {testsLoad.state === "loaded" && testsLoad.tests.length > 0 && (
          <div className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line">
            {testsLoad.tests.map((test) => {
              return (
                <label key={test.id} className="flex h-14 cursor-pointer items-center gap-4 bg-surface px-4 hover:bg-hover">
                  <input
                    type="checkbox"
                    checked={ticked.has(test.id)}
                    onChange={(event) => handleTickChange(test.id, event.currentTarget.checked)}
                    className="size-6 accent-accent"
                  />
                  {test.name}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Takes space only when there's a problem; an alert is read out as soon as it appears. */}
      {problem && (
        <p role="alert" className="mt-4">
          {problem}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-4">
        <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
          Cancel
        </button>
        <button type="submit" disabled={creating || testsLoad.state !== "loaded"} className={buttonClass("primary")}>
          {creating ? "Creating…" : "Create link"}
        </button>
      </div>
    </form>
  );
}

export default SequenceForm;
