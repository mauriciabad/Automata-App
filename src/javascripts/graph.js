const Node = require('./node');

/**
 * Graph data structure implemented with an adjacent list
 * This is a adaptation of this code: https://github.com/amejiarosario/dsa.js-data-structures-algorithms-javascript/blob/master/src/data-structures/graphs/graph.js
 */
class Graph {
  constructor({
    states, transitions, final, start, alphabet,
  }) {
    this.nodes = new Map();
    this.start = start;
    this.alphabet = alphabet;

    if (states) {
      states.forEach((node) => {
        this.addVertex(node, final.includes(node));
      });
    }

    if (transitions) {
      transitions.forEach((edge) => {
        this.addEdge(edge.origin, edge.destination);
      });
    }
  }

  addVertex(value) {
    if (this.nodes.has(value)) {
      return this.nodes.get(value);
    }
    const vertex = new Node(value);
    this.nodes.set(value, vertex);
    return vertex;
  }

  removeVertex(value) {
    const current = this.nodes.get(value);
    if (current) {
      Array.from(this.nodes.values()).forEach((node) => node.removeAdjacent(current));
    }
    return this.nodes.delete(value);
  }

  addEdge(source, destination) {
    const sourceNode = this.addVertex(source);
    const destinationNode = this.addVertex(destination);

    sourceNode.addAdjacent(destinationNode);

    return [sourceNode, destinationNode];
  }

  removeEdge(source, destination) {
    const sourceNode = this.nodes.get(source);
    const destinationNode = this.nodes.get(destination);

    if (sourceNode && destinationNode) {
      sourceNode.removeAdjacent(destinationNode);
    }

    return [sourceNode, destinationNode];
  }

  areAdjacents(source, destination) {
    const sourceNode = this.nodes.get(source);
    const destinationNode = this.nodes.get(destination);

    if (sourceNode && destinationNode) {
      return sourceNode.isAdjacent(destinationNode);
    }

    return false;
  }

  isDfa() { // TODO: This is not working as it shoud, check why
    // (its bevause the node transition doesnt have a letter
    // and its using the node name instead of the transition letter)

    // eslint-disable-next-line no-restricted-syntax
    for (const node of this.nodes.values()) {
      const foundLetters = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const adjacent of node.getAdjacents()) {
        const letter = adjacent.value;
        if (foundLetters.includes(letter)) return false;
        foundLetters.push(letter);
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
}

module.exports = Graph;
