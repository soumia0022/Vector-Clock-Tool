import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

export default function LamportDiagram({
  processes = [],
  events = [],
  height = 520,
  onAddProcess,
  canAdd = true,
}) {
  const svgRef = useRef(null);

  const layout = useMemo(() => {
    const margin = { top: 40, right: 70, bottom: 30, left: 40 };
    const width = 900;
    const innerW = width - margin.left - margin.right;

    const x = d3
      .scalePoint()
      .domain(processes)
      .range([margin.left, margin.left + innerW])
      .padding(0.5);

    const rowGap = 50;
    const y = (idx) => margin.top + idx * rowGap;

    const nodes = events.map((ev, idx) => ({
      ...ev,
      x: x(ev.process),
      y: y(idx),
      idx,
    }));

    return { width, margin, x, nodes };
  }, [processes, events]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, margin, x, nodes } = layout;

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    // ---- defs (arrowhead) ----
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "currentColor")
      .attr("opacity", 0.6);

    // ---- zoom/pan ----
    const viewport = svg.append("g").attr("class", "viewport");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3.5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("dblclick.zoom", null);

    // ---- title (not zoomed) ----
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("fill", "currentColor")
      .attr("font-size", 16)
      .attr("font-weight", 600)
      .text("Lamport Diagram");

    // ---- lanes ----
    const lanes = viewport.append("g").attr("class", "lanes");

    lanes
      .selectAll("line")
      .data(processes)
      .join("line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", margin.top)
      .attr("y2", height - 20)
      .attr("stroke", "currentColor")
      .attr("opacity", 0.25)
      .attr("stroke-width", 2);

    lanes
      .selectAll("text")
      .data(processes)
      .join("text")
      .attr("x", (d) => x(d))
      .attr("y", margin.top - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("opacity", 0.85)
      .attr("font-size", 13)
      .text((d) => d);

    // ---- message links ----
    const sendByMsg = new Map();
    const recvByMsg = new Map();

    for (const n of nodes) {
      if (!n.message_id) continue;
      if (n.type === "SEND") sendByMsg.set(n.message_id, n);
      if (n.type === "RECEIVE") recvByMsg.set(n.message_id, n);
    }

    const links = [];
    for (const [msgId, s] of sendByMsg.entries()) {
      const r = recvByMsg.get(msgId);
      if (r) links.push({ id: msgId, source: s, target: r });
    }

    const linkG = viewport.append("g").attr("class", "message-links");

    const curvedPath = (s, t) => {
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const curvature = 0.35;

      const cx1 = s.x + dx * 0.25;
      const cy1 = s.y + dy * curvature;

      const cx2 = s.x + dx * 0.75;
      const cy2 = t.y - dy * curvature;

      return `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
    };

    const link = linkG
      .selectAll("path")
      .data(links, (d) => d.id)
      .join("path")
      .attr("d", (d) => curvedPath(d.source, d.target))
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("opacity", 0.35)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    link.append("title").text((d) => `message: ${d.id}\n${d.source.id} → ${d.target.id}`);

    // ---- events ----
    const evg = viewport.append("g").attr("class", "events");

    const node = evg
      .selectAll("g.node")
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const ng = enter.append("g").attr("class", "node");
        ng.append("circle");
        ng.append("text");
        ng.append("title");
        return ng;
      });

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);

    node
      .select("circle")
      .attr("r", 7)
      .attr("fill", "currentColor")
      .attr("opacity", 0.9);

    node
      .select("text")
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "currentColor")
      .attr("opacity", 0.9)
      .attr("font-size", 12)
      .text((d) => `${d.id} (${d.type})`);

    node
      .select("title")
      .text((d) => {
        const ts = Array.isArray(d.timestamp) ? `[${d.timestamp.join(", ")}]` : "";
        const msg = d.message_id ? `\nmessage: ${d.message_id}` : "";
        return `${d.id}\nprocess: ${d.process}\ntype: ${d.type}\nts: ${ts}${msg}`;
      });
  }, [layout, height, processes]);

  const buttonDisabled = !canAdd || typeof onAddProcess !== "function";

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.2)",
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        background: "rgba(0,0,0,0.03)",
        position: "relative",
      }}
    >
      {/* Real HTML button overlay */}
      <button
        type="button"
        onClick={onAddProcess}
        disabled={buttonDisabled}
        aria-label="Add process"
        title={buttonDisabled ? "Busy…" : "Add process"}
        style={{
          position: "absolute",
          top: 52, // aligns near lane label row
          right: 22,
          width: 34,
          height: 34,
          borderRadius: 999,
          border: "2px solid currentColor",
          background: "transparent",
          fontSize: 22,
          lineHeight: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: buttonDisabled ? 0.4 : 0.9,
          cursor: buttonDisabled ? "not-allowed" : "pointer",
          userSelect: "none",
        }}
      >
        +
      </button>

      <svg ref={svgRef} />

      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        Tip: drag to pan • scroll to zoom • click “+” to add a process
      </div>
    </div>
  );
}