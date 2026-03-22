import * as d3 from "d3";

export function createLamportLayout(processes, events) {
  const margin = { top: 40, right: 70, bottom: 30, left: 40 };
  const width = 900;
  const innerW = width - margin.left - margin.right;
  const rowGap = 60;

  const x = d3
    .scalePoint()
    .domain(processes)
    .range([margin.left, margin.left + innerW])
    .padding(0.5);

  const lastYByProcess = new Map(
    processes.map((p) => [p, margin.top - rowGap])
  );
  const sendYByMessage = new Map();

  const nodes = events.map((ev) => {
    const prevY = lastYByProcess.get(ev.process) ?? margin.top - rowGap;
    let y = prevY + rowGap;

    if (ev.type === "SEND" && ev.message_id) {
      sendYByMessage.set(ev.message_id, y);
    }

    if (
      ev.type === "RECEIVE" &&
      ev.message_id &&
      sendYByMessage.has(ev.message_id)
    ) {
      const sendY = sendYByMessage.get(ev.message_id);
      y = Math.max(y, sendY + rowGap);
    }

    lastYByProcess.set(ev.process, y);

    return {
      ...ev,
      x: x(ev.process),
      y,
    };
  });

  return { width, margin, x, nodes };
}