// PWO Supabase configuration.
// Paste your Supabase Project URL and Publishable key here.
// Never put a Secret/service_role key in a browser app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yvakaggshmmyxbygtxrj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__idyPGa5vwccmENqjBgo-Q_5JqqjTiD";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

export const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
