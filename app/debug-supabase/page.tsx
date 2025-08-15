"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // keep relative path

export default function DebugSupabase() {
  const [status, setStatus] = useState("Checking…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error, count } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true }); // head:true gets just the count
      if (error) { setError(error.message); return; }
      setStatus(`Connected ✅ assignments rows: ${count}`);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Supabase Connection Test</h1>
      <p className="mt-2">{status}</p>
      {error && <p className="text-red-600 mt-2">Error: {error}</p>}
      <p className="opacity-70 mt-4">Next: open /assignments once we add the UI.</p>
    </div>
  );
}

