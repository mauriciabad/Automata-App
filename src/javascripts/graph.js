/* eslint-disable no-restricted-syntax */
import Node from './node';

export default class Graph {
  constructor({
    states, transitions, final, start, alphabet,
  }) {
    this.nodes = new Map();
    this.alphabet = alphabet;

    for (const nodeName of states) {
      const node = this.addVertex(nodeName, final.includes(nodeName));
      if (nodeName === start) this.start = node;
    }

    for (const edge of transitions) {
      this.addEdge(edge.origin, edge.destination, edge.label);
    }
  }

  addVertex(nodeName, isFinal) {
    if (this.nodes.has(nodeName)) {
      return this.nodes.get(nodeName);
    }
    const node = new Node(nodeName, isFinal);
    this.nodes.set(nodeName, node);
    return node;
  }

  removeVertex(nodeName) {
    const current = this.nodes.get(nodeName);
    if (current) {
      Array.from(this.nodes.values()).forEach((node) => node.removeAllAdjacent(current));
    }
    return this.nodes.delete(nodeName);
  }

  addEdge(source, destination, label) {
    const sourceNode = this.addVertex(source);
    const destinationNode = this.addVertex(destination);

    sourceNode.addAdjacency(destinationNode, label);

    return [sourceNode, destinationNode, label];
  }

  removeEdge(source, destination, label) {
    const sourceNode = this.nodes.get(source);
    const destinationNode = this.nodes.get(destination);

    if (sourceNode) {
      if (destinationNode) {
        if (label !== undefined) {
          sourceNode.removeAdjacent(destinationNode, label);
        } else {
          sourceNode.removeAllAdjacencies(destinationNode);
        }
      } else {
        sourceNode.removeAllAdjacencies();
      }
    }

    return [sourceNode, destinationNode, label];
  }

  isDfa() {
    for (const node of this.nodes.values()) {
      const foundLetters = [];

      for (const adjacentcy of node.adjacencies) {
        if (foundLetters.includes(adjacentcy.label)) return false;
        foundLetters.push(adjacentcy.label);
      }

      if (foundLetters.length !== this.alphabet.length) return false;
    }
    return true;
  }

  isTree() {
    const visitedNodes = [this.start];
    visitedNodes.pop(); // TODO: Implement real function
    return false;
  }

  // TODO: not working because getAdjacents() returns adjacencies, not nodes
  /*
  * dfs(first = this.start) {
    const visited = new Map();
    const visitList = [];

    visitList.push(first);

    while (visitList.length !== 0) {
      const node = visitList.pop();
      if (node && !visited.has(node)) {
        yield node;
        visited.set(node);
        visitList.push(...node.getAdjacents());
      }
    }
  }
  */

  isValidPath(word) {
    let originNodes = new Set([this.start]);

    for (const letter of word) {
      const nextOriginNodes = new Set();

      for (const node of originNodes) {
        for (const adjacency of node.adjacencies) {
          if (adjacency.label === letter) nextOriginNodes.add(adjacency.node);
        }
      }

      if (nextOriginNodes.size === 0) return false;

      originNodes = nextOriginNodes;
    }

    for (const node of originNodes) {
      if (node.isFinal) return true;
    }

    return false;
  }
}
