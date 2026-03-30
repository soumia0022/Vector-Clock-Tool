export const EVENT_STYLES = {
  LOCAL: {
    fill: "#2563eb",
    marker: "dot",
  },
  SEND: {
    fill: "#d5d906",
    marker: "triangle",
  },
  RECEIVE: {
    fill: "#059669",
    marker: "square",
  },
};

export function getEventStyle(type) {
  return (
    EVENT_STYLES[type] || {
      fill: "#6b7280",
      marker: "dot",
    }
  );
}

export function getNodeRadius(eventId, currentEventId) {
  return eventId === currentEventId ? 13 : 9;
}