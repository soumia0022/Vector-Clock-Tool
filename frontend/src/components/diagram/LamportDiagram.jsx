import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import "../../styles/lamport.css";

const EVENT_STYLES = {
  LOCAL: {
    fill: "#2563eb",
    marker: "dot",
  },
  SEND: {
    fill: "#d97706",
    marker: "triangle",
  },
  RECEIVE: {
    fill: "#059669",
    marker: "square",
  },
};

function getEventStyle(type) {
  return (
    EVENT_STYLES[type] || {
      fill: "#6b7280",
      marker: "dot",
    }
  );
}

function getNodeRadius(eventId, currentEventId) {
  return eventId === currentEventId ? 13 : 9;
}

function drawInnerMarker(group, eventType, isActive = false) {
  group.selectAll(".event-marker").remove();

  const { marker } = getEventStyle(eventType);
  const scale = isActive ? 1.2 : 1;

  if (marker === "dot") {
    group
      .append("circle")
      .attr("class", "event-marker")
      .attr("r", 2.8 * scale)
      .attr("fill", "#111827");
  }

  if (marker === "triangle") {
    const topY = -4.8 * scale;
    const sideX = 4.8 * scale;
    const bottomY = 3.8 * scale;

    group
      .append("path")
      .attr("class", "event-marker")
      .attr("d", `M 0 ${topY} L ${sideX} ${bottomY} L ${-sideX} ${bottomY} Z`)
      .attr("fill", "#111827");
  }

  if (marker === "square") {
    const size = 7.2 * scale;

    group
      .append("rect")
      .attr("class", "event-marker")
      .attr("x", -size / 2)
      .attr("y", -size / 2)
      .attr("width", size)
      .attr("height", size)
      .attr("fill", "#111827");
  }
}

export default function LamportDiagram({
  processes = [],
  events = [],
  height = 520,
  onAddProcess,
  canAdd = true,
  highlightProcess = null,
  animateMessages = true,
  playIndex = 0,
}) {
  const prevPlayIndexRef = useRef(0);
  const svgRef = useRef(null);

  const layout = useMemo(() => {
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
  }, [processes, events]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, margin, x, nodes } = layout;
    const prevPlayIndex = prevPlayIndexRef.current;

    const currentEventId =
      playIndex > 0 && playIndex <= nodes.length
        ? nodes[playIndex - 1]?.id
        : null;

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    const defs = svg.append("defs");

    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 9)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "currentColor")
      .attr("opacity", 0.7);

    const glowFilter = defs
      .append("filter")
      .attr("id", "eventGlow")
      .attr("x", "-80%")
      .attr("y", "-80%")
      .attr("width", "260%")
      .attr("height", "260%");

    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", 4)
      .attr("result", "blur");

    const merge = glowFilter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const viewport = svg.append("g").attr("class", "viewport");

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3.5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("dblclick.zoom", null);

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
    for (const [msgId, sendNode] of sendByMsg.entries()) {
      const receiveNode = recvByMsg.get(msgId);
      if (receiveNode) {
        links.push({
          id: msgId,
          source: sendNode,
          target: receiveNode,
        });
      }
    }

    const linkG = viewport.append("g").attr("class", "message-links");

    const curvedPath = (source, target) => {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const curvature = 0.35;

      const c1x = source.x + dx * 0.25;
      const c1y = source.y + dy * curvature;

      const c2x = source.x + dx * 0.75;
      const c2y = target.y - dy * curvature;

      const sourceRadius = getNodeRadius(source.id, currentEventId);
      const targetRadius = getNodeRadius(target.id, currentEventId);

      const arrowGap = 10;
      const sourceGap = 2;

      const startTangentX = c1x - source.x;
      const startTangentY = c1y - source.y;
      const startLen =
        Math.hypot(startTangentX, startTangentY) || 1;

      const endTangentX = target.x - c2x;
      const endTangentY = target.y - c2y;
      const endLen =
        Math.hypot(endTangentX, endTangentY) || 1;

      const startX =
        source.x + (startTangentX / startLen) * (sourceRadius + sourceGap);
      const startY =
        source.y + (startTangentY / startLen) * (sourceRadius + sourceGap);

      const endOffset = targetRadius + arrowGap;
      const endX = target.x - (endTangentX / endLen) * endOffset;
      const endY = target.y - (endTangentY / endLen) * endOffset;

      return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
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

    const evg = viewport.append("g").attr("class", "events");

    const node = evg
      .selectAll("g.node")
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const ng = enter.append("g").attr("class", "node");
        ng.append("circle").attr("class", "event-glow");
        ng.append("circle").attr("class", "event-outer");
        ng.append("g").attr("class", "event-marker-layer");
        ng.append("text");
        ng.append("title");
        return ng;
      });

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);

    node
      .select("circle.event-glow")
      .attr("r", (d) => (d.id === currentEventId ? 18 : 0))
      .attr("fill", (d) => getEventStyle(d.type).fill)
      .attr("opacity", (d) => (d.id === currentEventId ? 0.22 : 0))
      .attr("filter", "url(#eventGlow)");

    node
      .select("circle.event-outer")
      .attr("r", (d) => getNodeRadius(d.id, currentEventId))
      .attr("fill", (d) => getEventStyle(d.type).fill)
      .attr("stroke", (d) => (d.id === currentEventId ? "#f8fafc" : "#111827"))
      .attr("stroke-width", (d) => (d.id === currentEventId ? 2.6 : 1.4))
      .attr("opacity", (d) => {
        if (highlightProcess) {
          return d.process === highlightProcess ? 1 : 0.28;
        }
        return d.id === currentEventId ? 1 : 0.95;
      });

    node.each(function (d) {
      const markerLayer = d3.select(this).select(".event-marker-layer");
      drawInnerMarker(markerLayer, d.type, d.id === currentEventId);

      markerLayer.attr("opacity", () =>
        highlightProcess ? (d.process === highlightProcess ? 1 : 0.3) : 1
      );
    });

    node
      .select("text")
      .attr("x", (d) => (d.id === currentEventId ? 18 : 14))
      .attr("y", 4)
      .attr("fill", "currentColor")
      .attr("opacity", (d) => {
        if (highlightProcess) {
          return d.process === highlightProcess ? 0.98 : 0.25;
        }
        return d.id === currentEventId ? 1 : 0.9;
      })
      .attr("font-size", (d) => (d.id === currentEventId ? 13 : 12))
      .attr("font-weight", (d) => (d.id === currentEventId ? 700 : 400))
      .text((d) => d.id);

    node
      .select("title")
      .text((d) => {
        const timestampText = Array.isArray(d.timestamp)
          ? `[${d.timestamp.join(", ")}]`
          : "";
        const messageText = d.message_id ? `\nmessage: ${d.message_id}` : "";

        return `${d.id}\nprocess: ${d.process}\ntype: ${d.type}\nts: ${timestampText}${messageText}`;
      });

    if (animateMessages && playIndex > prevPlayIndex) {
      const animLayer = viewport.append("g").attr("class", "message-anim");
      const newlyVisibleEvents = nodes.slice(prevPlayIndex, playIndex);

      newlyVisibleEvents.forEach((ev) => {
        if (ev.type !== "RECEIVE" || !ev.message_id) return;

        const pathNode = linkG
          .selectAll("path.link")
          .filter((d) => d.id === ev.message_id)
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
              const point = pathNode.getPointAtLength(t * total);
              dot.attr("cx", point.x).attr("cy", point.y);
            };
          })
          .transition()
          .duration(200)
          .attr("opacity", 0)
          .remove();
      });
    }

    prevPlayIndexRef.current = playIndex;
  }, [layout, height, processes, highlightProcess, animateMessages, playIndex]);

  return (
    <div className="lamport-diagram">
      <svg ref={svgRef} className="lamport-diagram__svg" />

      <div className="lamport-legend">
        <div className="lamport-legend__item">
          <span className="lamport-legend__symbol lamport-legend__symbol--local" />
          <span>Local</span>
        </div>

        <div className="lamport-legend__item">
          <span className="lamport-legend__symbol lamport-legend__symbol--send" />
          <span>Send</span>
        </div>

        <div className="lamport-legend__item">
          <span className="lamport-legend__symbol lamport-legend__symbol--receive" />
          <span>Receive</span>
        </div>
      </div>

      <div className="lamport-diagram__tip">
        Tip: drag to pan • scroll to zoom • messages animate when new SEND/RECEIVE appears
      </div>
    </div>
  );
}