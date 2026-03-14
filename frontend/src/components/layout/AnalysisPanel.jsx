export default function AnalysisPanel({ state }) {
  if (!state) return null;

  return (
    <div className="side-panel">
      <div className="side-panel-title">Analysis</div>

      <div className="section-title">Happens-before</div>
      {state.hb?.length ? (
        <ul className="analysis-list">
          {state.hb.map((e, idx) => (
            <li key={idx}>
              {e.from} → {e.to}
            </li>
          ))}
        </ul>
      ) : (
        <div className="muted-text">Not computed yet.</div>
      )}

      <hr className="divider" />

      <div className="section-title">Concurrent pairs</div>
      {state.co?.length ? (
        <ul className="analysis-list">
          {state.co.map((pair, idx) => (
            <li key={idx}>
              {(pair.event1 ?? pair.a)} ‖ {(pair.event2 ?? pair.b)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="muted-text">Not computed yet.</div>
      )}
    </div>
  );
}