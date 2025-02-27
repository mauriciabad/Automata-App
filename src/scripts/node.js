/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */

export default class Node {
  constructor(label, isFinal = false) {
    this.label = label;
    this.isFinal = isFinal;
    this._adjacencies = new Set();
  }

  addAdjacency(node, label, stackPop = "", stackPush = "") {
    if (!this.hasAdjacency(node, label, stackPop, stackPush)) {
      this._adjacencies.add({
        node,
        label,
        stackPop,
        stackPush,
      });
    }
  }

  isAdjecent({ node, label }) {
    if (label === undefined && node === undefined) return false;
    if (label === undefined) return this.adjacentNodes.includes(node);
    if (node === undefined) return this.labels.includes(label);
    return this.hasAdjacency(node, label);
  }

  removeAdjacency(node, label, stackPop = "", stackPush = "") {
    this._adjacencies.delete(
      this.getAdjacency(node, label, stackPop, stackPush)
    );
  }

  removeAllAdjacencies(node) {
    if (node === undefined) this._adjacencies.clear();
    else {
      for (const adjacency of this._adjacencies) {
        if (adjacency.node === node) {
          this._adjacencies.delete(adjacency);
        }
      }
    }
  }

  getAdjacency(node, label, stackPop = "", stackPush = "") {
    for (const adjacency of this._adjacencies) {
      if (
        adjacency.node === node &&
        adjacency.label === label &&
        adjacency.stackPop === stackPop &&
        adjacency.stackPush === stackPush
      ) {
        return adjacency;
      }
    }
    return undefined;
  }

  hasAdjacency(node, label, stackPop = "", stackPush = "") {
    return this.getAdjacency(node, label, stackPop, stackPush) !== undefined;
  }

  get adjacencies() {
    return [...this._adjacencies];
  }

  get adjecentNodes() {
    const adjecentNodes = new Set();
    for (const adjacency of this._adjacencies) {
      adjecentNodes.add(adjacency.node);
    }
    return [...adjecentNodes];
  }

  get labels() {
    const labels = new Set();
    for (const adjacency of this._adjacencies) {
      labels.add(adjacency.label);
    }
    return [...labels];
  }

  epsilonAccessibleNodes(accessibleNodes = new Set([this])) {
    for (const node of accessibleNodes) {
      for (const adjacency of node.adjacencies) {
        if (adjacency.label === "" && !accessibleNodes.has(adjacency.node)) {
          accessibleNodes.add(adjacency.node);
          accessibleNodes.add(
            ...adjacency.node.epsilonAccessibleNodes(accessibleNodes)
          );
        }
      }
    }

    return accessibleNodes;
  }

  epsilonAccessibleNodesPdaRec(nodeStacks = new Map([[this, new Set([""])]])) {
    for (const [node, stacks] of nodeStacks) {
      for (const stack of stacks) {
        const pop = stack.length >= 1 ? stack.slice(-1) : undefined;

        for (const adjacency of node.adjacencies) {
          if (
            adjacency.label === "" &&
            (adjacency.stackPop === "" || (pop && adjacency.stackPop === pop))
          ) {
            if (stack.length <= 1000) {
              let newStack =
                adjacency.stackPop === pop ? stack.slice(0, -1) : stack;
              newStack += adjacency.stackPush;
              if (!nodeStacks.has(adjacency.node))
                nodeStacks.set(adjacency.node, new Set());
              if (!nodeStacks.get(adjacency.node).has(newStack)) {
                nodeStacks.get(adjacency.node).add(newStack);
                const nextNodeStacks =
                  adjacency.node.epsilonAccessibleNodesPdaRec(nodeStacks);

                // Add nextNodeStacks to nodeStacks
                for (const [node2, stacks2] of nextNodeStacks) {
                  if (!nodeStacks.has(node2)) nodeStacks.set(node2, new Set());
                  nodeStacks.get(node2).add(...stacks2);
                }
              }
            }
          }
        }
      }
    }

    return nodeStacks;
  }

  epsilonAccessibleNodesPda(stack = "") {
    return this.epsilonAccessibleNodesPdaRec(
      new Map([[this, new Set([stack || ""])]])
    );
  }

  epsilonLoops() {
    const loops = [];

    this.epsilonLoopsRec(loops, [], new Set(), [this]);

    return loops;
  }

  epsilonLoopsRec(loops, path, visited, visitNextList) {
    if (visitNextList.length === 0) return;

    const node = visitNextList.pop();
    path.push(node);

    if (visited.has(node)) {
      if (path.includes(node)) {
        loops.push(new Set(path.slice(path.indexOf(node) + 1)));
      }
    } else {
      visited.add(node);

      const adjecentEpsilonNodes = node.adjacencies
        .filter((adjacency) => adjacency.label === "")
        .map((adjacency) => adjacency.node);

      for (const eNode of adjecentEpsilonNodes) {
        visitNextList.push(eNode);
        this.epsilonLoopsRec(loops, path, visited, visitNextList);
        path.pop();
      }
    }
  }

  nodesInLoop() {
    const loopNodes = new Set();

    this.nodesInLoopRec(loopNodes, [], new Set(), [this]);

    return loopNodes;
  }

  nodesInLoopRec(loopNodes, path, visited, visitNextList) {
    if (visitNextList.length === 0) return;

    const node = visitNextList.pop();
    path.push(node);

    if (visited.has(node)) {
      if (path.includes(node)) {
        for (const loopNode of path.slice(path.indexOf(node) + 1)) {
          loopNodes.add(loopNode);
        }
      }
    } else {
      visited.add(node);

      for (const adjacency of node.adjacencies) {
        visitNextList.push(adjacency.node);
        this.nodesInLoopRec(loopNodes, path, visited, visitNextList);
      }
    }
    path.pop();
  }

  checkIsFinite() {
    try {
      const nodesInLoop = this.nodesInLoop();
      return this.checkIsFiniteRec(nodesInLoop, [], new Set(), [this]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return undefined;
    }
  }

  checkIsFiniteRec(nodesInLoop, path, visited, visitNextList) {
    if (visitNextList.length === 0) return true;

    const node = visitNextList.pop();
    path.push(node);

    if (node.isFinal) {
      for (const pathNode of path) {
        if (nodesInLoop.has(pathNode)) return false;
      }
    }

    if (!visited.has(node)) {
      visited.add(node);

      for (const adjacency of node.adjacencies) {
        visitNextList.push(adjacency.node);
        if (!this.checkIsFiniteRec(nodesInLoop, path, visited, visitNextList))
          return false;
      }
    }
    path.pop();
    return true;
  }

  acceptedStrings() {
    const accepted = new Set();
    this.acceptedStringsRec(accepted, [], new Set(), [
      { node: this, label: "" },
    ]);
    return [...accepted].sort();
  }

  acceptedStringsRec(accepted, path, visited, visitNextList) {
    if (visitNextList.length === 0) return;
    if (path.length >= 10 || accepted.size >= 200) return;

    const adjacency = visitNextList.pop();
    path.push(adjacency.label);

    if (!visited.has(adjacency)) {
      visited.add(adjacency);

      if (adjacency.node.isFinal) accepted.add(path.join(""));

      for (const nextAdjacency of adjacency.node.adjacencies) {
        visitNextList.push(nextAdjacency);
        this.acceptedStringsRec(accepted, path, visited, visitNextList);
      }
    }
    visited.delete(adjacency);
    path.pop();
  }
}
