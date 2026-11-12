// The one Supabase client in the browser, for the clinician dashboard only (ADR-043).
// Client screens never import this: they go through the Edge Functions (ADR-037).

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/functions/_shared/database.types.ts";
import { env } from "../shared/env";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey);
