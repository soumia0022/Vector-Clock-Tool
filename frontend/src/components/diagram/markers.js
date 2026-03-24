import { getEventStyle } from "../../constants/lamport";

export function drawInnerMarker(group, eventType, isActive = false) {
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