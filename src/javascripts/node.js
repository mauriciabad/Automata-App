/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */

export default class Node {
  constructor(label, isFinal = false) {
    this.label = label;
    this.isFinal = isFinal;
    this._adjacencies = new Set();
  }

  addAdjacency(node, label) {
    if (!this.hasAdjacency(node, label)) this._adjacencies.add({ node, label });
  }

  isAdjecent({ node, label }) {
    if (label === undefined && node === undefined) return false;
    if (label === undefined) return this.adjacentNodes.includes(node);
    if (node === undefined) return this.labels.includes(label);
    return this.hasAdjacency(node, label);
  }

  removeAdjacency(node, label) {
    for (const adjacency of this._adjacencies) {
      if (adjacency.node === node && adjacency.label === label) {
        this._adjacencies.delete(adjacency);
        break;
      }
    }
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

  getAdjacency(node, label) {
    for (const adjacency of this._adjacencies) {
      if (adjacency.node === node && adjacency.label === label) {
        return adjacency;
      }
    }
    return undefined;
  }

  hasAdjacency(node, label) {
    return this.getAdjacency(node, label) !== undefined;
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
        if (adjacency.label === '' && !accessibleNodes.has(adjacency.node)) {
          accessibleNodes.add(adjacency.node);
          accessibleNodes.add(...adjacency.node.epsilonAccessibleNodes(accessibleNodes));
        }
      }
    }

    return accessibleNodes;
  }

  epsilonLoops() {
    const loops = [];

    this.epsilonLoopsRec(loops, [], new Set(), [this]);

    return loops;
  }

  epsilonLoopsRec(loops, path, visited, visitList) {
    if (visitList.length === 0) return;

    const node = visitList.pop();
    path.push(node);

    if (visited.has(node)) {
      if (path.includes(node)) {
        loops.push(new Set(path.slice(path.indexOf(node) + 1)));
      }
    } else {
      visited.add(node);

      const adjecentEpsilonNodes = node.adjacencies
        .filter((adjacency) => adjacency.label === '')
        .map((adjacency) => adjacency.node);

      for (const eNode of adjecentEpsilonNodes) {
        visitList.push(eNode);
        this.epsilonLoopsRec(loops, path, visited, visitList);
        path.pop();
      }
    }
  }

  nodesInLoop() {
    const loopNodes = new Set();

    this.nodesInLoopRec(loopNodes, [], new Set(), [this]);

    return loopNodes;
  }

  nodesInLoopRec(loopNodes, path, visited, visitList) {
    if (visitList.length === 0) return;

    const node = visitList.pop();
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
        visitList.push(adjacency.node);
        this.nodesInLoopRec(loopNodes, path, visited, visitList);
      }
    }
    path.pop();
  }

  checkIsFinal() {
    const nodesInLoop = this.nodesInLoop();
    return this.checkIsFinalRec(nodesInLoop, [], new Set(), [this]);
  }

  checkIsFinalRec(nodesInLoop, path, visited, visitList) {
    if (visitList.length === 0) return true;

    const node = visitList.pop();
    path.push(node);

    if (!visited.has(node)) {
      visited.add(node);

      if (node.isFinal) {
        for (const pathNode of path) {
          if (nodesInLoop.has(pathNode)) return false;
        }
      }

      for (const adjacency of node.adjacencies) {
        visitList.push(adjacency.node);
        if (!this.checkIsFinalRec(nodesInLoop, path, visited, visitList)) return false;
      }
    }
    path.pop();
    return true;
  }

  acceptedStrings() {
    const accepted = new Set();
    this.acceptedStringsRec(accepted, [], new Set(), [{ node: this, label: '' }]);
    return [...accepted].sort();
  }

  acceptedStringsRec(accepted, path, visited, visitList) {
    if (visitList.length === 0) return;
    if (path.length >= 10 || accepted.size >= 200) return;

    const adjacency = visitList.pop();
    path.push(adjacency.label);

    if (!visited.has(adjacency)) {
      visited.add(adjacency);

      if (adjacency.node.isFinal) accepted.add(path.join(''));

      for (const nextAdjacency of adjacency.node.adjacencies) {
        visitList.push(nextAdjacency);
        this.acceptedStringsRec(accepted, path, visited, visitList);
      }
    }
    visited.delete(adjacency);
    path.pop();
  }
}
