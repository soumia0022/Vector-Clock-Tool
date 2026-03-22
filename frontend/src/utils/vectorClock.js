export function zeroVector(length) {
  return Array(length).fill(0);
}

export function vectorsEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((value, i) => value === b[i]);
}

export function vectorMax(a = [], b = []) {
  return a.map((value, i) => Math.max(value, b[i]));
}

export function findPreviousEventForProcess(events, pid, beforeIndex) {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    if (events[i].process === pid) return events[i];
  }
  return null;
}

export function findMatchingSendEvent(events, receiveEvent, receiveIndex) {
  if (!receiveEvent?.message_id) return null;

  for (let i = receiveIndex - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type === "SEND" && ev.message_id === receiveEvent.message_id) {
      return ev;
    }
  }

  return null;
}