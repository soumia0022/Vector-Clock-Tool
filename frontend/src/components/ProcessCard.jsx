export default function ProcessCard({
  pid,
  events,
  busy,
  onDelete,
  onAddEvent,
  onDeleteEvent,
}) {
  return (
    <div
      style={{
        border: "1px solid #010101",
        borderRadius: 12,
        padding: 16,
        background: "#0f0101cd",
        color: "white",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 18 }}>{pid}</strong>

        <div>
          <button onClick={() => onAddEvent(pid)} disabled={busy}>
            + Event
          </button>

          <button
            onClick={() => onDelete(pid)}
            disabled={busy}
            style={{ marginLeft: 8 }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Events */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.length === 0 && (
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            No events yet
          </div>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            style={{
              padding: 8,
              borderRadius: 8,
              background: "#1c1c1c",
              fontSize: 13,
            }}
          >
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
