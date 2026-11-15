// Shown when something a client needs didn't arrive or didn't save: the link check, a clip, or a result.

import ClientScreen from "./ClientScreen";

const buttonClass =
  "mt-8 h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

// Moves keyboard and screen reader users to the message when it appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

type TryAgainScreenProps = {
  onTryAgain: () => void;
};

function TryAgainScreen({ onTryAgain }: TryAgainScreenProps) {
  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        Something went wrong
      </h1>
      <p className="mt-4">Please check your internet connection and try again.</p>
      <button type="button" onClick={onTryAgain} className={buttonClass}>
        Try again
      </button>
    </ClientScreen>
  );
}

export default TryAgainScreen;
