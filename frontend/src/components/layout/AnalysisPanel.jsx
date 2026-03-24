export default function AnalysisPanel({
  state,
  hbChains = [],
  activeHbChain = null,
  onHoverChain,
  concurrentGroups = [],
  activeConcurrentGroup = null,
  onHoverConcurrentGroup,
}) {
  if (!state) return null;

  const isSameChain = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => item === b[i]);
  };

  const isSameConcurrentGroup = (a, b) => {
    if (!a || !b) return false;
    if (a.events.length !== b.events.length) return false;
    if (a.others.length !== b.others.length) return false;

    const sameLeft = a.events.every((item, i) => item === b.events[i]);
    const sameRight = a.others.every((item, i) => item === b.others[i]);

    return sameLeft && sameRight;
  };

  return (
    <div className="side-panel">
      <div className="side-panel-title">Analysis</div>

      <div className="section-title-with-info">
        <div className="section-title">Happens-before chains</div>
        <div className="info-tooltip">
          <span className="info-tooltip__icon">ⓘ</span>
          <div className="info-tooltip__bubble">
            The happens-before relation is transitive. If e1 → e2 and e2 → e3,
            then e1 → e3.
          </div>
        </div>
      </div>

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

      <div className="section-title-with-info">
        <div className="section-title">Concurrent groups</div>
        <div className="info-tooltip">
          <span className="info-tooltip__icon">ⓘ</span>
          <div className="info-tooltip__bubble">
            Every individual event on the left (purple) is concurrent with every
            individual event on the right (red).
          </div>
        </div>
      </div>

      {concurrentGroups.length ? (
        <ul className="analysis-list">
          {concurrentGroups.map((group, idx) => {
            const active = isSameConcurrentGroup(group, activeConcurrentGroup);

            return (
              <li
                key={idx}
                className={`analysis-chain ${active ? "is-active" : ""}`}
                onMouseEnter={() => onHoverConcurrentGroup?.(group)}
                onMouseLeave={() => onHoverConcurrentGroup?.(null)}
              >
                {group.events.join(", ")} ‖ {`{${group.others.join(", ")}}`}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="muted-text">Not computed yet.</div>
      )}
    </div>
  );
}