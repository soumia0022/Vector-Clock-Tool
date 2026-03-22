import { getNodeRadius } from "../../constants/lamport";

export function buildMessageLinks(nodes) {
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

  return links;
}

export function buildStraightMessagePath(source, target, currentEventId) {
  const sourceRadius = getNodeRadius(source.id, currentEventId);
  const targetRadius = getNodeRadius(target.id, currentEventId);

  const arrowGap = 10;
  const sourceGap = 2;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy) || 1;

  const startX = source.x + (dx / len) * (sourceRadius + sourceGap);
  const startY = source.y + (dy / len) * (sourceRadius + sourceGap);

  const endOffset = targetRadius + arrowGap;
  const endX = target.x - (dx / len) * endOffset;
  const endY = target.y - (dy / len) * endOffset;

  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

export function buildHbSegmentPath(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  if (source.process === target.process) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  const c1x = source.x + dx * 0.25;
  const c1y = source.y + dy * 0.25;
  const c2x = source.x + dx * 0.75;
  const c2y = target.y - dy * 0.25;

  return `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;
}