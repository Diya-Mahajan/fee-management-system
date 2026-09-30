import { supabase } from "./supabase";

async function testSupabase() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ SUPABASE ERROR:", error);
  } else {
    console.log("✅ SUPABASE CONNECTED!");
    console.log("Students:", data);
  }
}

testSupabase();