export default function ProcessCard({ pid, busy, onDelete, onAddEvent }) {
  return (
    <div
      style={{
        border: "1px solid #010101",
        borderRadius: 12,
        padding: 12,
        background: "#0f0101cd",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>{pid}</div>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => onDelete(pid)} disabled={busy}>
          Delete
        </button>

        <button
          onClick={() => onAddEvent(pid)}
          disabled={busy}
          style={{ marginLeft: 8 }}
        >
          Add local event
        </button>
      </div>
    </div>
  );
}
