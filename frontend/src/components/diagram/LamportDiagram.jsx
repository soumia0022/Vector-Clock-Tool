import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import "../../styles/lamport.css";
import { createLamportLayout } from "./layout";
import { drawInnerMarker } from "./markers";
import { getEventStyle, getNodeRadius } from "../../constants/lamport";
import {
  buildMessageLinks,
  buildStraightMessagePath,
  buildHbSegmentPath,
} from "./path";

export default function LamportDiagram({
  processes = [],
  events = [],
  height = 520,
  onAddProcess,
  canAdd = true,
  highlightProcess = null,
  animateMessages = true,
  playIndex = 0,
  activeHbChain = null,
  activeConcurrentGroup = null,
}) {
  const prevPlayIndexRef = useRef(0);
  const svgRef = useRef(null);

  const layout = useMemo(() => {
    return createLamportLayout(processes, events);
  }, [processes, events]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, margin, x, nodes } = layout;
    const prevPlayIndex = prevPlayIndexRef.current;

    const maxNodeY = nodes.length > 0 ? d3.max(nodes, (d) => d.y) : margin.top;
    const contentHeight = Math.max(height, maxNodeY + 60);
    const laneBottom = contentHeight - 20;

    const currentEventId =
      playIndex > 0 && playIndex <= nodes.length
        ? nodes[playIndex - 1]?.id
        : null;

    const activeChainEventIds = new Set(activeHbChain || []);
    const concurrentLeftIds = new Set(activeConcurrentGroup?.events || []);
    const concurrentRightIds = new Set(activeConcurrentGroup?.others || []);
    const activeConcurrentEventIds = new Set([
      ...concurrentLeftIds,
      ...concurrentRightIds,
    ]);

    svg
      .attr("viewBox", `0 0 ${width} ${contentHeight}`)
      .attr("width", "100%")
      .attr("height", contentHeight);

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
      .attr("y2", laneBottom)
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

    const links = buildMessageLinks(nodes);

    const linkG = viewport.append("g").attr("class", "message-links");

    const linkSel = linkG
      .selectAll("path.link")
      .data(links, (d) => d.id)
      .join("path")
      .attr("class", "link")
      .attr("d", (d) =>
        buildStraightMessagePath(d.source, d.target, currentEventId)
      )
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("opacity", 0.35)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    linkSel
      .append("title")
      .text((d) => `message: ${d.id}\n${d.source.id} → ${d.target.id}`);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const hbOverlay = viewport.append("g").attr("class", "hb-overlay");

    if (activeHbChain && activeHbChain.length > 1) {
      const chainSegments = [];

      for (let i = 0; i < activeHbChain.length - 1; i++) {
        const fromId = activeHbChain[i];
        const toId = activeHbChain[i + 1];
        const source = nodeById.get(fromId);
        const target = nodeById.get(toId);

        if (source && target) {
          chainSegments.push({
            id: `${fromId}->${toId}`,
            source,
            target,
          });
        }
      }

      hbOverlay
        .selectAll("path.hb-segment")
        .data(chainSegments, (d) => d.id)
        .join("path")
        .attr("class", "hb-segment")
        .attr("d", (d) => buildHbSegmentPath(d.source, d.target))
        .attr("fill", "none")
        .attr("stroke", "#7c3aed")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("opacity", 0.85)
        .attr("pointer-events", "none");
    }

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
      .attr("r", (d) => {
        if (d.id === currentEventId) return 18;
        if (activeHbChain && activeChainEventIds.has(d.id)) return 14;
        return 0;
      })
      .attr("fill", (d) => {
        if (activeHbChain && activeChainEventIds.has(d.id)) return "#7c3aed";
        return getEventStyle(d.type).fill;
      })
      .attr("opacity", (d) => {
        if (d.id === currentEventId) return 0.22;
        if (activeHbChain && activeChainEventIds.has(d.id)) return 0.18;
        return 0;
      })
      .attr("filter", "url(#eventGlow)");

    node
      .select("circle.event-outer")
      .attr("r", (d) => {
        if (activeConcurrentEventIds.has(d.id)) {
          return Math.max(getNodeRadius(d.id, currentEventId), 11);
        }
        return getNodeRadius(d.id, currentEventId);
      })
      .attr("fill", (d) => getEventStyle(d.type).fill)
      .attr("stroke", (d) => {
        if (concurrentLeftIds.has(d.id)) return "#c21dd8";
        if (concurrentRightIds.has(d.id)) return "#ea580c";
        if (activeHbChain && activeChainEventIds.has(d.id)) return "#7c3aed";
        if (d.id === currentEventId) return "#f8fafc";
        return "#111827";
      })
      .attr("stroke-width", (d) => {
        if (concurrentLeftIds.has(d.id) || concurrentRightIds.has(d.id))
          return 4;
        if (activeHbChain && activeChainEventIds.has(d.id)) return 3;
        if (d.id === currentEventId) return 2.6;
        return 1.4;
      })
      .attr("opacity", (d) => {
        if (activeHbChain) {
          return activeChainEventIds.has(d.id) ? 1 : 0.18;
        }

        if (activeConcurrentGroup) {
          return activeConcurrentEventIds.has(d.id) ? 1 : 0.18;
        }

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
      .attr("fill", (d) => {
        if (concurrentLeftIds.has(d.id)) return "#c21dd8";
        if (concurrentRightIds.has(d.id)) return "#c2410c";
        if (activeHbChain && activeChainEventIds.has(d.id)) return "#5b21b6";
        return "currentColor";
      })
      .attr("opacity", (d) => {
        if (activeConcurrentGroup) {
          return activeConcurrentEventIds.has(d.id) ? 1 : 0.2;
        }

        if (activeHbChain) {
          return activeChainEventIds.has(d.id) ? 1 : 0.2;
        }

        if (highlightProcess) {
          return d.process === highlightProcess ? 0.98 : 0.25;
        }

        return d.id === currentEventId ? 1 : 0.9;
      })
      .attr("font-size", (d) => (d.id === currentEventId ? 13 : 12))
      .attr("font-weight", (d) =>
        d.id === currentEventId ||
        concurrentLeftIds.has(d.id) ||
        concurrentRightIds.has(d.id) ||
        (activeHbChain && activeChainEventIds.has(d.id))
          ? 700
          : 400
      )
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
  }, [
    layout,
    height,
    processes,
    highlightProcess,
    animateMessages,
    playIndex,
    activeHbChain,
    activeConcurrentGroup,
  ]);

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
        Tip: drag to pan • scroll to zoom • messages animate when new
        SEND/RECEIVE appears
      </div>
    </div>
  );
}