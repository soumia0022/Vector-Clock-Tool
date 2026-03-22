import {
  zeroVector,
  vectorsEqual,
  vectorMax,
  findPreviousEventForProcess,
  findMatchingSendEvent,
} from "./vectorClock";

export function getEventExplanation(state, playIndex) {
  if (!state || playIndex <= 0 || playIndex > state.events.length) return null;

  const events = state.events;
  const currentIndex = playIndex - 1;
  const event = events[currentIndex];
  const processCount = state.processes.length;
  const processIndex = state.processes.indexOf(event.process);

  const previousEvent = findPreviousEventForProcess(
    events,
    event.process,
    currentIndex
  );

  const beforeVector = previousEvent
    ? [...previousEvent.timestamp]
    : zeroVector(processCount);

  const afterVector = [...event.timestamp];

  if (event.type === "LOCAL") {
    const expected = [...beforeVector];
    expected[processIndex] += 1;

    return {
      title: `${event.id} — Local event on ${event.process}`,
      rule: `${event.process} increments its own entry by 1 for a local event.`,
      before: beforeVector,
      after: afterVector,
      highlightIndex: processIndex,
      extra: vectorsEqual(expected, afterVector)
        ? `Before [${beforeVector.join(", ")}] → after [${afterVector.join(", ")}].`
        : `Expected [${expected.join(", ")}], stored [${afterVector.join(", ")}].`,
    };
  }

  if (event.type === "SEND") {
    return {
      title: `${event.id} — Send event from ${event.process}`,
      rule: `A send is also an event, so ${event.process} increments its own entry by 1 before sending.`,
      before: beforeVector,
      after: afterVector,
      highlightIndex: processIndex,
      extra: event.message_id
        ? `Message ${event.message_id} carries timestamp [${afterVector.join(", ")}].`
        : `The sent message carries timestamp [${afterVector.join(", ")}].`,
    };
  }

  if (event.type === "RECEIVE") {
    const sendEvent = findMatchingSendEvent(events, event, currentIndex);
    const receiverBefore = beforeVector;

    if (sendEvent) {
      const merged = vectorMax(receiverBefore, sendEvent.timestamp);
      const expected = [...merged];
      expected[processIndex] += 1;

      return {
        title: `${event.id} — Receive event on ${event.process}`,
        rule: `On receive, take the element-wise max of the receiver clock and the message timestamp, then increment the receiver's own entry by 1.`,
        before: receiverBefore,
        after: afterVector,
        highlightIndex: processIndex,
        messageVector: [...sendEvent.timestamp],
        mergedVector: merged,
        extra: `max([${receiverBefore.join(", ")}], [${sendEvent.timestamp.join(", ")}]) = [${merged.join(", ")}], then increment ${event.process} → [${afterVector.join(", ")}].`,
      };
    }

    return {
      title: `${event.id} — Receive event on ${event.process}`,
      rule: `A receive takes the max with the incoming message timestamp, then increments the receiver's own entry by 1.`,
      before: receiverBefore,
      after: afterVector,
      highlightIndex: processIndex,
      extra: `Final stored timestamp: [${afterVector.join(", ")}].`,
    };
  }

  return {
    title: `${event.id} — ${event.type} on ${event.process}`,
    rule: `This event updates the vector clock.`,
    before: beforeVector,
    after: afterVector,
    highlightIndex: processIndex,
    extra: `Stored timestamp: [${afterVector.join(", ")}].`,
  };
}