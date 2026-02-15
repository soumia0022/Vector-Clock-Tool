import ProcessCard from "./ProcessCard";

export default function ProcessGrid({ processes, busy, onDelete, onAddEvent }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {processes.map((pid) => (
        <ProcessCard
          key={pid}
          pid={pid}
          busy={busy}
          onDelete={onDelete}
          onAddEvent={onAddEvent}
        />
      ))}
    </div>
  );
}
