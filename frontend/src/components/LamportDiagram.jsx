import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import "../styles/lamport.css";

export default function LamportDiagram({
  processes = [],
  events = [],
  height = 520,
  onAddProcess,
  canAdd = true,
  highlightProcess = null,
  animateMessages = true,
}) {
  const svgRef = useRef(null);
  const seenMsgIdsRef = useRef(new Set());

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

    const viewport = svg.append("g").attr("class", "viewport");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3.5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("dblclick.zoom", null);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("fill", "currentColor")
      .attr("font-size", 16)
      .attr("font-weight", 600)
      ;

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
      .attr("opacity", (d) =>
        highlightProcess ? (d === highlightProcess ? 0.85 : 0.12) : 0.25
      )
      .attr("stroke-width", (d) =>
        highlightProcess && d === highlightProcess ? 4 : 2
      );

    lanes
      .selectAll("text")
      .data(processes)
      .join("text")
      .attr("x", (d) => x(d))
      .attr("y", margin.top - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("opacity", highlightProcess ? 0.9 : 0.85)
      .attr("font-size", 13)
      .text((d) => d);

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

    const linkSel = linkG
      .selectAll("path.link")
      .data(links, (d) => d.id)
      .join("path")
      .attr("class", "link")
      .attr("d", (d) => curvedPath(d.source, d.target))
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("opacity", 0.35)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    linkSel
      .append("title")
      .text((d) => `message: ${d.id}\n${d.source.id} → ${d.target.id}`);

    if (animateMessages) {
      const animLayer = viewport.append("g").attr("class", "message-anim");

      links.forEach((lnk) => {
        const msgId = lnk.id;
        const isNew = !seenMsgIdsRef.current.has(msgId);

        if (!isNew) return;
        seenMsgIdsRef.current.add(msgId);

        const pathNode = linkG
          .selectAll("path.link")
          .filter((d) => d.id === msgId)
          .node();

        if (!pathNode) return;

        const total = pathNode.getTotalLength();

        const dot = animLayer
          .append("circle")
          .attr("r", 6)
          .attr("fill", "currentColor")
          .attr("opacity", 0.85);

        dot
          .transition()
          .duration(900)
          .ease(d3.easeCubicInOut)
          .tween("pathTween", () => {
            return (t) => {
              const p = pathNode.getPointAtLength(t * total);
              dot.attr("cx", p.x).attr("cy", p.y);
            };
          })
          .transition()
          .duration(200)
          .attr("opacity", 0)
          .remove();
      });
    }

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
      .attr("opacity", (d) =>
        highlightProcess ? (d.process === highlightProcess ? 0.95 : 0.25) : 0.9
      );

    node
      .select("text")
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "currentColor")
      .attr("opacity", (d) =>
        highlightProcess ? (d.process === highlightProcess ? 0.95 : 0.25) : 0.9
      )
      .attr("font-size", 12)
      .text((d) => `${d.id} (${d.type})`);

    node
      .select("title")
      .text((d) => {
        const ts = Array.isArray(d.timestamp) ? `[${d.timestamp.join(", ")}]` : "";
        const msg = d.message_id ? `\nmessage: ${d.message_id}` : "";
        return `${d.id}\nprocess: ${d.process}\ntype: ${d.type}\nts: ${ts}${msg}`;
      });
  }, [layout, height, processes, highlightProcess, animateMessages]);

  const buttonDisabled = !canAdd || typeof onAddProcess !== "function";

  return (
    <div className="lamport-diagram">
      

      <svg ref={svgRef} className="lamport-diagram__svg" />

      <div className="lamport-diagram__tip">
        Tip: drag to pan • scroll to zoom • messages animate when new SEND/RECEIVE appears
      </div>
    </div>
  );
}