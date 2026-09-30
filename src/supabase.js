import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://akxmlijwgntqctboszfo.supabase.co";
const supabaseAnonKey = "sb_publishable_nmLG2XIgvovUfawadKM9FQ_BRor7Jhu";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);