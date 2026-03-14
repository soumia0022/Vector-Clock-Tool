import ProcessCard from "./ProcessCard";
import ProcessActionsCard from "./ProcessActionsCard";
import "../../styles/process_grid.css";

export default function ProcessGrid({
  processes,
  events,
  busy,
  onDelete,
  onAddEvent,
  onDeleteEvent,
  onAddProcess,
  onSendMessage,
}) {
  return (
    <div className="process-grid-wrapper">
      <ProcessActionsCard
        processes={processes}
        busy={busy}
        onAddProcess={onAddProcess}
        onSendMessage={onSendMessage}
      />

      <div className="process-grid-scroll">
        <div className="process-grid">
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
                onDeleteEvent={onDeleteEvent}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}