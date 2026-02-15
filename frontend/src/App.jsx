import { useEffect, useState } from "react";
import { getState, createProcess, deleteProcess, addLocalEvent } from "./api";
import ProcessGrid from "./components/ProcessGrid";

export default function App() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadState = async () => {
    setError("");
    const data = await getState();
    setState(data);
  };

  useEffect(() => {
    loadState().catch((e) => setError(String(e)));
  }, []);

  const handleAddProcess = async () => {
    setBusy(true);
    try {
      const data = await createProcess();
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProcess = async (pid) => {
    setBusy(true);
    try {
      const data = await deleteProcess(pid);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAddEvent = async (pid) => {
    setBusy(true);
    try {
      const data = await addLocalEvent(pid);
      if (!data.ok) throw new Error(data.error);
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

      <button onClick={handleAddProcess} disabled={busy}>
        Add process
      </button>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {state && (
        <ProcessGrid
          processes={state.processes}
          events={state.events}
          busy={busy}
          onDelete={handleDeleteProcess}
          onAddEvent={handleAddEvent}
        />
      )}

      <pre style={{ background: "#0f0101cd", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
