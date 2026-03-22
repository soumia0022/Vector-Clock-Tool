import { useState } from "react";

export default function SendPanel({ processes, onSend, busy }) {
  const [fromPid, setFromPid] = useState("");
  const [toPid, setToPid] = useState("");

  const handleSend = () => {
    if (!fromPid || !toPid || fromPid === toPid) return;
    onSend(fromPid, toPid);
  };

  return (
    <div className="send-panel">
      <h3>Send Message</h3>

      <select value={fromPid} onChange={(e) => setFromPid(e.target.value)}>
        <option value="">From...</option>
        {processes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={toPid}
        onChange={(e) => setToPid(e.target.value)}
      >
        <option value="">To...</option>
        {processes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <button
        onClick={handleSend}
        disabled={busy || !fromPid || !toPid || fromPid === toPid}
      >
        Send
      </button>
    </div>
  );
}