import { useState } from "react";
import "../styles/process_card.css";

export default function ProcessCard({
  pid,
  events,
  busy,
  onDelete,
  onAddEvent,
  onDeleteEvent,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="process-card">
      <div className="process-card__header">
        <button
          type="button"
          className="process-card__toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <span className={`process-card__chevron ${open ? "is-open" : ""}`}>
            ▸
          </span>
          <span className="process-card__title-wrap">
            <strong className="process-card__title">{pid}</strong>
            <span className="process-card__count">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          </span>
        </button>

        <div className="process-card__actions">
          <button
            onClick={() => onAddEvent(pid)}
            disabled={busy}
            className="btn btn-primary process-card__button"
          >
            + Event
          </button>

          <button
            onClick={() => onDelete(pid)}
            disabled={busy}
            className="btn btn-outline process-card__button"
          >
            Delete
          </button>
        </div>
      </div>

      {open && (
        <div className="process-card__events">
          {events.length === 0 && (
            <div className="process-card__empty">No events yet</div>
          )}

          {events.map((event) => (
            <details key={event.id} className="process-event">
              <summary className="process-event__summary">
                <div className="process-event__summary-left">
                  <strong>{event.id}</strong>
                  <span className="process-event__type">{event.type}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteEvent(event.id);
                  }}
                  disabled={busy}
                  className="btn btn-outline process-event__delete"
                >
                  Delete
                </button>
              </summary>

              <div className="process-event__body">
                <div className="process-event__row">
                  <span className="process-event__label">ID</span>
                  <strong>{event.id}</strong>
                </div>

                <div className="process-event__row">
                  <span className="process-event__label">Type</span>
                  <strong>{event.type}</strong>
                </div>

                <div className="process-event__row">
                  <span className="process-event__label">Process</span>
                  <strong>{pid}</strong>
                </div>

                <div className="process-event__timestamp">
                  ts: [{event.timestamp.join(", ")}]
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}