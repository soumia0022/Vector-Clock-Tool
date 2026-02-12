import { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function App() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadState = async () => {
    setError("");
    const r = await fetch(`${API}/state`);
    const data = await r.json();
    setState(data);
  };

  useEffect(() => {
    loadState().catch((e) => setError(String(e)));
  }, []);

  const addProcess = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API}/process`, { method: "POST" });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to add process");
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const addLocalEventToP1 = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API}/event/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process: "P1" }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed to add local event");
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <h1>Vector Clock Tool</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={addProcess} disabled={busy}>
          Add process
        </button>

        <button onClick={addLocalEventToP1} disabled={busy || !state?.processes?.includes("P1")}>
          Add local event to P1
        </button>

        <button onClick={() => loadState()} disabled={busy}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          {error}
        </div>
      )}

      <pre style={{ background: "#0f0101cd", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
