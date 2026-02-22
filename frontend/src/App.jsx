import { useEffect, useState } from "react";
import {
  getState,
  createProcess,
  deleteProcess,
  addLocalEvent,
  deleteEvent,
  computeHappensBefore,
  computeConcurrentEvents,
  sendMessage,
} from "./api";

import ProcessGrid from "./components/ProcessGrid";
import LamportDiagram from "./components/LamportDiagram";
import SendPanel from "./components/SendPanel";

export default function App() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // NEW: track which process is hovered in the right panel
  const [hoveredPid, setHoveredPid] = useState(null);

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

  const handleDeleteEvent = async (eventId) => {
    setBusy(true);
    try {
      const data = await deleteEvent(eventId);
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleComputeHappensBefore = async () => {
    setBusy(true);
    try {
      const data = await computeHappensBefore();
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleComputeConcurrent = async () => {
    setBusy(true);
    try {
      const data = await computeConcurrentEvents();
      if (!data.ok) throw new Error(data.error);
      await loadState();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async (fromPid, toPid) => {
    setBusy(true);
    try {
      const data = await sendMessage(fromPid, toPid);
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
      <h1 style={{ marginBottom: 8 }}>Vector Clock Tool</h1>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      {/* Top controls */}
      {state && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SendPanel processes={state.processes} onSend={handleSendMessage} busy={busy} />
        </div>
      )}

      {state && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 2.5fr 1fr",
      gap: 16,
      alignItems: "start",
    }}
  >
    {/* LEFT: HB + CO */}
    <div>
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.2)",
          borderRadius: 12,
          padding: 12,
          background: "rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Happens-before
        </div>

        {state.hb?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {state.hb.map((e, idx) => (
              <li key={idx}>
                {e.from} → {e.to}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.6 }}>Not computed yet.</div>
        )}

        <hr style={{ margin: "16px 0", opacity: 0.2 }} />

        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Concurrent pairs
        </div>

        {state.co?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {state.co.map((p, idx) => (
              <li key={idx}>
                {(p.event1 ?? p.a)} ‖ {(p.event2 ?? p.b)}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.6 }}>Not computed yet.</div>
        )}
      </div>
    </div>

    {/* MIDDLE: Lamport Diagram */}
    <div>
      <LamportDiagram
        processes={state.processes}
        events={state.events}
        onAddProcess={handleAddProcess}
        canAdd={!busy}
        highlightProcess={hoveredPid}
      />
    </div>

    {/* RIGHT: Process Cards */}
    <div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Processes
      </div>

      <ProcessGrid
        processes={state.processes}
        events={state.events}
        busy={busy}
        onDelete={handleDeleteProcess}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
        onHoverProcess={setHoveredPid}
      />
    </div>
  </div>
)}

      {state && (
        <pre style={{ background: "#0f0101cd", padding: 12, borderRadius: 8, marginTop: 16 }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      )}
    </div>
  );
}