import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

let client: SupabaseClient | undefined;

// Lazily constructed so importing this module (e.g. during Next.js's build-time
// "collecting page data" step) never touches process.env — only calling
// getSupabaseAdmin() at request time does. A top-level createClient() call
// previously crashed the entire production build whenever SUPABASE_URL wasn't
// set, even though nothing had actually invoked the upload route yet.
export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
  }
  return client;
}
