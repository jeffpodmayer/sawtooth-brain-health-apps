// The New Test Sequence form (roadmap 8.4b, restyled at 8.9): a client ID, picked or typed, and the tests to give.
// create_sequence saves the client (if new), the sequence and its tests together (ADR-044).

import { useEffect, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type SubmitEvent } from "react";
import { matchingClients, type ClientSummary } from "./client-search";
import { clientCodeProblem, digitsOnly } from "./clientCode";
import { loadClients } from "./clients";
import { formatDate } from "./formatDate";
import { sequenceTests } from "./sequence-tests";
import { TestListSkeleton } from "./Skeleton";
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
  // The practice's clients for the dropdown; null until read, or if the read failed.
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(-1); // the highlighted option, or -1 for none
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

  // The practice's clients, read once when the window opens, so typing never waits on the network.
  // A fixed ID came from the client's own page, so there's nothing to pick. If the read fails, the
  // dropdown and the line under the field stay empty, and create_sequence still decides new or existing.
  useEffect(() => {
    if (fixedCode) return;
    let cancelled = false;
    loadClients().then(
      (loaded) => !cancelled && setClients(loaded),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [fixedCode]);

  const matches = clients ? matchingClients(clients, code) : [];
  const exact = clients?.find((client) => client.code === code) ?? null;
  // Hidden once the field holds an existing client's whole ID, so a picked client doesn't keep the list open.
  const showList = listOpen && matches.length > 0 && exact === null;
  const activeId = showList && active >= 0 ? `client-option-${matches[active].code}` : undefined;

  // Keeps the highlighted option in view when the arrow keys move past the visible part of the list.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setCode(digitsOnly(event.currentTarget.value));
    setListOpen(true);
    setActive(-1);
    setCodeProblem(null);
    setProblem(null);
  }

  function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setListOpen(true);
      setActive((index) => Math.min(index + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && showList && active >= 0) {
      event.preventDefault(); // picks the client instead of submitting the form
      pick(matches[active]);
    } else if (event.key === "Escape" && showList) {
      event.preventDefault(); // closes the list, not the window
      setListOpen(false);
    }
  }

  function pick(client: ClientSummary) {
    setCode(client.code);
    setListOpen(false);
    setActive(-1);
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

  // Once all four digits are in, a quiet note beside the field says whether it's an existing or a new client.
  // The pipe is only seen; a screen reader hears a comma instead of "vertical bar".
  const known = clients !== null && clientCodeProblem(code) === null;
  let codeStatus: ReactNode = null;
  if (codeProblem) codeStatus = codeProblem;
  else if (known && exact) {
    codeStatus = (
      <>
        Existing client
        <span aria-hidden="true"> | </span>
        <span className="sr-only">, </span>
        {exact.lastVisitAt ? `Last visit ${formatDate(exact.lastVisitAt)}` : "No visits yet"}
      </>
    );
  } else if (known) codeStatus = "New client";

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6">
      {fixedCode ? (
        <div>
          <p className="font-semibold">Client ID</p>
          <p className="mt-1">{fixedCode}</p>
        </div>
      ) : (
        <>
          <label htmlFor="sequence-code" className="block font-semibold">
            Client ID
          </label>
          {/* A combo box: type to filter the practice's clients, then pick one with the mouse or ↓/↑ and Enter. */}
          {/* The note sits on the field's bottom edge, on one line; the field only needs room for four digits. */}
          <div className="mt-2 flex items-end gap-4">
            <div className="relative w-32 shrink-0">
              <input
                id="sequence-code"
                name="code"
                role="combobox"
                aria-expanded={showList}
                aria-controls="client-options"
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleCodeKeyDown}
                onFocus={() => setListOpen(true)}
                onBlur={() => setListOpen(false)}
                autoComplete="off"
                inputMode="numeric"
                maxLength={4}
                spellCheck={false}
                aria-invalid={codeProblem !== null}
                aria-describedby="sequence-code-status"
                className={fieldClass}
              />
              {showList && (
                <ul
                  id="client-options"
                  role="listbox"
                  aria-label="Clients"
                  className="absolute left-0 top-full z-10 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
                >
                  {matches.map((client, index) => (
                    <li
                      key={client.id}
                      id={`client-option-${client.code}`}
                      role="option"
                      aria-selected={index === active}
                      onMouseDown={(event) => event.preventDefault()} // keeps the cursor in the field
                      onClick={() => pick(client)}
                      className={`cursor-pointer px-4 py-2 ${index === active ? "bg-hover" : "hover:bg-hover"}`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        {client.code}
                        {client.visitOpen && (
                          <span className="rounded-full bg-success-bg px-2 text-base font-normal text-success-ink">
                            Open
                          </span>
                        )}
                      </span>
                      <span className="block text-base text-ink-muted">
                        {client.lastVisitAt ? `Last visit ${formatDate(client.lastVisitAt)}` : "No visits yet"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* A problem stays dark so it stands out; the existing or new note is grey. */}
            <p
              id="sequence-code-status"
              role="status"
              className={`pb-1 text-base ${codeProblem ? "text-ink" : "whitespace-nowrap text-ink-muted"}`}
            >
              {codeStatus}
            </p>
          </div>
        </>
      )}

      <fieldset className="mt-6">
        <legend className="font-semibold">Tests</legend>
        {testsLoad.state === "loading" && <TestListSkeleton />}
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
                <label
                  key={test.id}
                  className="flex h-14 cursor-pointer items-center gap-4 bg-surface px-4 hover:bg-hover"
                >
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
