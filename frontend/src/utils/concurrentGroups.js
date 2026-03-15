export function buildConcurrentGroups(concurrentPairs = []) {
  const grouped = new Map();

  for (const pair of concurrentPairs) {
    const left = pair.event1 ?? pair.a;
    const right = pair.event2 ?? pair.b;

    if (!left || !right) continue;

    if (!grouped.has(left)) {
      grouped.set(left, new Set());
    }

    grouped.get(left).add(right);
  }

  const merged = new Map();

  for (const [event, othersSet] of grouped.entries()) {
    const others = [...othersSet].sort(compareEventIds);
    const key = others.join("|");

    if (!merged.has(key)) {
      merged.set(key, {
        events: [],
        others,
      });
    }

    merged.get(key).events.push(event);
  }

  return [...merged.values()]
    .map((group) => ({
      events: group.events.sort(compareEventIds),
      others: group.others,
    }))
    .sort((a, b) => compareEventIds(a.events[0], b.events[0]));
}

function compareEventIds(a, b) {
  const aNum = parseInt(String(a).replace(/\D/g, ""), 10);
  const bNum = parseInt(String(b).replace(/\D/g, ""), 10);

  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }

  return String(a).localeCompare(String(b));
}