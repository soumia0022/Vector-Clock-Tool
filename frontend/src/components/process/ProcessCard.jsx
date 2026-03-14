export default function ProcessCard({
  pid,
  events,
  busy,
  onDelete,
  onAddEvent,
  onDeleteEvent,
}) {
  return (
    <div className="process-card">
      <div className="process-card__header">
        <strong className="process-card__title">{pid}</strong>

        <div className="process-card__actions">
          <button onClick={() => onAddEvent(pid)} disabled={busy}>
            + Event
          </button>

          <button onClick={() => onDelete(pid)} disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      <div className="process-card__events">
        {events.length === 0 && (
          <div className="process-card__empty">No events yet</div>
        )}

        {events.map((event) => (
          <div key={event.id} className="process-event">
            <div><strong>{event.id}</strong></div>
            <div><strong>{event.type}</strong></div>
            <div>ts: [{event.timestamp.join(", ")}]</div>
            <button
              onClick={() => onDeleteEvent(event.id)}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}