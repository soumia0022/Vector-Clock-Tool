export default function AnalysisPanel({
  state,
  hbChains = [],
  activeHbChain = null,
  onHoverChain,
  concurrentGroups = [],
}) {
  if (!state) return null;

  const isSameChain = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => item === b[i]);
  };

  return (
    <div className="side-panel">
      <div className="side-panel-title">Analysis</div>

      <div className="section-title">Happens-before chains</div>
      {hbChains.length ? (
        <ul className="analysis-list">
          {hbChains.map((chain, idx) => {
            const active = isSameChain(chain, activeHbChain);

            return (
              <li
                key={idx}
                className={`analysis-chain ${active ? "is-active" : ""}`}
                onMouseEnter={() => onHoverChain?.(chain)}
                onMouseLeave={() => onHoverChain?.(null)}
              >
                {chain.join(" → ")}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="muted-text">Not computed yet.</div>
      )}

      <hr className="divider" />

      <div className="section-title">Concurrent groups</div>
{concurrentGroups.length ? (
  <ul className="analysis-list">
    {concurrentGroups.map((group, idx) => (
      <li key={idx}>
        {group.events.join(", ")} ‖ {"{"}{group.others.join(", ")}{"}"}
      </li>
    ))}
  </ul>
) : (
  <div className="muted-text">Not computed yet.</div>
)}
    </div>
  );
}