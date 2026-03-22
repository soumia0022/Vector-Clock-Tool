export default function DebugPanel({ state }) {
  if (!state) return null;

  return (
    <pre className="debug-card">
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}