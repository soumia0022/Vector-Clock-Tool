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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const baseSpeed = 700; // base step speed
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

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

  useEffect(() => {
  if (!state) return;
  // start at end by default, or start at 0 if you prefer
  setPlayIndex(state.events.length);
}, [state]);

  useEffect(() => {
  if (!state) return;
  if (!isPlaying) return;

  const max = state.events.length;

  const t = setInterval(() => {
    setPlayIndex((i) => {
      if (i >= max) {
        // stop at the end
        setIsPlaying(false);
        return max;
      }
      return i + 1;
    });
  }, baseSpeed / speedMultiplier);

  return () => clearInterval(t);
}, [isPlaying, speedMultiplier, state]);

  const visibleEvents = state ? state.events.slice(0, playIndex) : [];

  const progressPercent =
  state && state.events.length > 0
    ? (playIndex / state.events.length) * 100
    : 0;

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
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
    <button
      onClick={() => setPlayIndex(0)}
      disabled={busy || state.events.length === 0}
    >
      Reset
    </button>

    <button
      onClick={() => setPlayIndex((i) => Math.max(0, i - 1))}
      disabled={busy || state.events.length === 0 || playIndex === 0}
    >
      Step ◀
    </button>

    <button
      onClick={() => setIsPlaying((p) => !p)}
      disabled={busy || state.events.length === 0}
    >
      {isPlaying ? "Pause" : "Play"}
    </button>

    <button
      onClick={() => setPlayIndex((i) => Math.min(state.events.length, i + 1))}
      disabled={busy || state.events.length === 0 || playIndex >= state.events.length}
    >
      Step ▶
    </button>

    <button
      onClick={() => setPlayIndex(state.events.length)}
      disabled={busy || state.events.length === 0}
    >
      Jump to end
    </button>

    <div style={{ marginLeft: 10, display: "flex", alignItems: "center", gap: 6 }}>
  <span style={{ fontSize: 12, opacity: 0.75 }}>Speed</span>

  {[0.5, 0.75, 1, 1.5, 2].map((s) => (
    <button
      key={s}
      onClick={() => setSpeedMultiplier(s)}
      style={{
        padding: "2px 8px",
        fontSize: 12,
        borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.2)",
        background: speedMultiplier === s ? "#333" : "transparent",
        color: speedMultiplier === s ? "white" : "inherit",
        cursor: "pointer",
      }}
    >
      x{s}
    </button>
  ))}
</div>

    <div style={{ marginLeft: 10, fontSize: 12, opacity: 0.75 }}>
      {playIndex}/{state.events.length} events
    </div>
  </div>
)}
{state && (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        width: "100%",
        height: 10,
        background: "rgba(0,0,0,0.12)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progressPercent}%`,
          height: "100%",
          background: "rgba(0,0,0,0.75)",
          borderRadius: 999,
          transition: isPlaying ? "width 0.2s linear" : "width 0.2s ease",
        }}
      />
    </div>

    <div
      style={{
        marginTop: 6,
        fontSize: 12,
        opacity: 0.75,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>Progress</span>
      <span>
        {playIndex} / {state.events.length} events
      </span>
    </div>
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
        events={visibleEvents}
        onAddProcess={handleAddProcess}
        canAdd={!busy}
        highlightProcess={hoveredPid}
        animateMessages={true}
        playIndex={playIndex}
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