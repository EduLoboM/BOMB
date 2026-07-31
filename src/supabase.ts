import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

export const supabase = createClient(
    process.env.SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_KEY || "placeholder-key",
    { auth: { persistSession: false } }
);


