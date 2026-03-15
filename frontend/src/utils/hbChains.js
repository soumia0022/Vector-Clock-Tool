export function buildHbChains(hbPairs = []) {
  const outgoing = new Map();
  const incoming = new Map();
  const nodes = new Set();

  for (const edge of hbPairs) {
    const from = edge.from;
    const to = edge.to;
    if (!from || !to) continue;

    nodes.add(from);
    nodes.add(to);

    if (!outgoing.has(from)) outgoing.set(from, new Set());
    if (!outgoing.has(to)) outgoing.set(to, new Set());

    if (!incoming.has(from)) incoming.set(from, new Set());
    if (!incoming.has(to)) incoming.set(to, new Set());

    outgoing.get(from).add(to);
    incoming.get(to).add(from);
  }

  const nodeList = [...nodes];

  function hasPath(start, target, bannedFrom = null, bannedTo = null) {
    const stack = [start];
    const seen = new Set();

    while (stack.length) {
      const current = stack.pop();
      if (current === target) return true;
      if (seen.has(current)) continue;
      seen.add(current);

      for (const next of outgoing.get(current) || []) {
        if (current === bannedFrom && next === bannedTo) continue;
        if (!seen.has(next)) stack.push(next);
      }
    }

    return false;
  }

  // Step 1: transitive reduction
  const reducedEdges = [];

  for (const from of nodeList) {
    for (const to of outgoing.get(from) || []) {
      const redundant = hasPath(from, to, from, to);
      if (!redundant) {
        reducedEdges.push({ from, to });
      }
    }
  }

  // Step 2: rebuild reduced graph
  const reducedOutgoing = new Map();
  const reducedIncomingCount = new Map();

  for (const node of nodeList) {
    reducedOutgoing.set(node, []);
    reducedIncomingCount.set(node, 0);
  }

  for (const edge of reducedEdges) {
    reducedOutgoing.get(edge.from).push(edge.to);
    reducedIncomingCount.set(
      edge.to,
      (reducedIncomingCount.get(edge.to) || 0) + 1
    );
  }

  // Optional: keep paths visually stable
  for (const [node, nexts] of reducedOutgoing.entries()) {
    nexts.sort((a, b) => {
      const aNum = parseInt(String(a).replace(/\D/g, ""), 10);
      const bNum = parseInt(String(b).replace(/\D/g, ""), 10);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }

      return String(a).localeCompare(String(b));
    });
  }

  // Step 3: find roots and leaves
  const roots = nodeList.filter(
    (node) => (reducedIncomingCount.get(node) || 0) === 0
  );

  const leaves = nodeList.filter(
    (node) => (reducedOutgoing.get(node) || []).length === 0
  );

  // Step 4: enumerate all root-to-leaf paths
  const chains = [];

  function dfs(current, path) {
    const nexts = reducedOutgoing.get(current) || [];

    if (nexts.length === 0) {
      if (path.length > 1) {
        chains.push([...path]);
      }
      return;
    }

    for (const next of nexts) {
      path.push(next);
      dfs(next, path);
      path.pop();
    }
  }

  for (const root of roots) {
    dfs(root, [root]);
  }

  // Step 5: remove duplicates just in case
  const unique = [];
  const seen = new Set();

  for (const chain of chains) {
    const key = chain.join("|");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(chain);
    }
  }

  return unique;
}