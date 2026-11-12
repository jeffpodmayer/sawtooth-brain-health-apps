// Development only (roadmap 7.4): the break screen on its own, to check how it looks.
// Continue goes full screen and stays here. Add ?locked to the address to see it locked.

import { useSearchParams } from "react-router";
import BreakScreen from "../shared/BreakScreen";
import { enterFullScreen } from "../shared/full-screen";

function DevBreakPage() {
  const [searchParams] = useSearchParams();

  return <BreakScreen locked={searchParams.has("locked")} onContinue={enterFullScreen} />;
}

export default DevBreakPage;
