const Node = require('./node');

/**
 * Graph data structure implemented with an adjacent list
 * This is a adaptation of this code: https://github.com/amejiarosario/dsa.js-data-structures-algorithms-javascript/blob/master/src/data-structures/graphs/graph.js
 */
class Graph {
  constructor({ states, transitions }) {
    this.nodes = new Map();

    if (states) {
      states.forEach((node) => {
        this.addVertex(node);
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
}

module.exports = Graph;
