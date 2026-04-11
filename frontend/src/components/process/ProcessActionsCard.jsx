import { useState } from "react";
import "../../styles/actions.css";

export default function ProcessActionsCard({
  processes,
  busy,
  onAddProcess,
  onSendMessage,
}) {
  const [fromPid, setFromPid] = useState("");
  const [toPid, setToPid] = useState("");

  const handleSend = () => {
    if (!fromPid || !toPid || fromPid === toPid) return;
    onSendMessage(fromPid, toPid);
    setFromPid("");
    setToPid("");
  };

  const sendDisabled = busy || !fromPid || !toPid || fromPid === toPid;

  return (
    <div className="process-actions-card">
      <div className="process-actions-card__header">
        <button
          onClick={onAddProcess}
          disabled={busy}
          className="btn btn-primary process-actions-card__add-button"
        >
          + Add process
        </button>
      </div>

      <div className="process-actions-card__label">Send message</div>

      <div className="process-actions-card__controls">
        <select
          value={fromPid}
          onChange={(e) => setFromPid(e.target.value)}
          disabled={busy}
          className="process-actions-card__select"
          aria-label="From process"
        >
          <option value="">From...</option>
          {processes.map((pid) => (
            <option key={pid} value={pid}>
              {pid}
            </option>
          ))}
        </select>

        <select
          value={toPid}
          onChange={(e) => setToPid(e.target.value)}
          disabled={busy}
          className="process-actions-card__select"
          aria-label="To process"
        >
          <option value="">To...</option>
          {processes.map((pid) => (
            <option key={pid} value={pid}>
              {pid}
            </option>
          ))}
        </select>

        <button
          onClick={handleSend}
          disabled={sendDisabled}
          className="btn btn-secondary process-actions-card__send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}