import ProcessCard from "./ProcessCard";

export default function ProcessGrid({ processes, events, busy, onDelete, onAddEvent }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {processes.map((pid) => {
        const eventsForProcess = events.filter((ev) => ev.process === pid);

        return (
        <ProcessCard
          key={pid}
          pid={pid}
          events={eventsForProcess} 
          busy={busy}
          onDelete={onDelete}
          onAddEvent={onAddEvent}
        />
        );
    })}
    </div>
  );
}
