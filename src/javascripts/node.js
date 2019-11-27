/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */

export default class Node {
  constructor(value, isFinal = false) {
    this.value = value;
    this.isFinal = isFinal;
    this._adjacencies = new Set();
  }

  addAdjacency(node, label) {
    this._adjacencies.add({ node, label });
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
    return Array.from(this._adjacencies);
  }

  get adjecentNodes() {
    const adjecentNodes = new Set();
    for (const adjacency of this._adjacencies) {
      adjecentNodes.add(adjacency.node);
    }
    return Array.from(adjecentNodes);
  }

  get labels() {
    const labels = new Set();
    for (const adjacency of this._adjacencies) {
      labels.add(adjacency.node);
    }
    return Array.from(labels);
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

    return Array.from(accessibleNodes);
  }
}
