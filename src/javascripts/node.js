/**
 * Graph node/vertex that hold adjacencies nodes
 * This is a adaptation of this code: https://github.com/amejiarosario/dsa.js-data-structures-algorithms-javascript/blob/master/src/data-structures/graphs/node.js
 */
class Node {
  constructor(value, isFinal = false) {
    this.value = value;
    this.isFinal = isFinal;
    this.adjacents = new Set();
  }

  addAdjacent(node) {
    this.adjacents.add(node);
  }

  removeAdjacent(node) {
    return this.adjacents.delete(node);
  }

  isAdjacent(node) {
    return this.adjacents.has(node);
  }

  getAdjacents() {
    return Array.from(this.adjacents);
  }
}

module.exports = Node;
