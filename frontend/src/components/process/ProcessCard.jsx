import { useState } from "react";
import { Trash2 } from "lucide-react";
import "../../styles/process_card.css";
export default function ProcessCard({
  pid,
  events,
  busy,
  onDelete,
  onAddEvent,
  onDeleteEvent,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="process-card">
      <div className="process-card__header">
        <button
          type="button"
          className="process-card__toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span className="process-card__title">{pid}</span>
          <span className="process-card__chevron">{expanded ? "▾" : "▸"}</span>
        </button>

        <button
          type="button"
          className="process-card__add"
          onClick={() => onAddEvent(pid)}
          disabled={busy}
          title={`Add event to ${pid}`}
          aria-label={`Add event to ${pid}`}
        >
          +
        </button>

        <button
          className="process-card__delete"
          onClick={() => onDelete(pid)}
          disabled={busy}
          title={`Delete ${pid}`}
          aria-label={`Delete ${pid}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="process-card__events">
          {events.length === 0 && (
            <div className="process-card__empty">No events yet</div>
          )}

          {events.map((event) => (
            <div key={event.id} className="process-event">
              <button
                className="process-event__delete"
                type="button"
                onClick={() => onDeleteEvent(event.id)}
                disabled={busy}
                id="delete-event-button"
                aria-label={`Delete event ${event.id}`}
              >
                <Trash2 size={16} />
              </button>
              <div><strong>{event.id}</strong></div>
              <div><strong>{event.type}</strong></div>
              <div>ts: [{event.timestamp.join(", ")}]</div>

              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}