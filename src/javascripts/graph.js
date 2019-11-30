/* eslint-disable no-restricted-syntax */
import Node from './node';

export default class Graph {
  constructor({
    regex, states, transitions, final, start, alphabet, comments,
  }) {
    this.title = comments ? comments[0] : 'Graph';
    this.invalid = false;
    this.fromRegex = regex !== '';

    if (this.fromRegex) {
      this.nodes = new Map();
      this.alphabet = new Set();

      try {
        const nodeIn = this.addVertex(undefined);
        const nodeOut = this.addVertex(undefined, true);
        this.start = nodeIn;
        this.addRegex(nodeIn, nodeOut, regex);
        this.simplify();
      } catch (e) {
        this.nodes = new Map();
        this.alphabet = new Set();
        this.start = this.addVertex(undefined, false);
        this.invalid = true;
        this.errorMessage = e.message;
      }
    } else {
      this.nodes = new Map();
      this.alphabet = new Set(alphabet);

      for (const nodeName of states) {
        const node = this.addVertex(nodeName, final.includes(nodeName));
        if (nodeName === start) this.start = node;
      }

      for (const edge of transitions) {
        this.addEdge(edge.origin, edge.destination, edge.label);
      }
    }
  }

  addRegexAdd(nodeIn, nodeOut, operands) {
    let lastNode = nodeIn;
    for (const operand of operands) {
      const node = this.addVertex(undefined);
      this.addRegex(lastNode, node, operand);
      lastNode = node;
    }
    lastNode.addAdjacency(nodeOut, '');
  }

  addRegexOr(nodeIn, nodeOut, operands) {
    for (const operand of operands) {
      const nodeIn2 = this.addVertex(undefined);
      const nodeOut2 = this.addVertex(undefined);
      nodeIn.addAdjacency(nodeIn2, '');
      nodeOut2.addAdjacency(nodeOut, '');
      this.addRegex(nodeIn2, nodeOut2, operand);
    }
  }

  addRegexRepeat(nodeIn, nodeOut, operands) {
    const nodeCenter = this.addVertex(undefined);
    const nodeRight = this.addVertex(undefined);

    nodeIn.addAdjacency(nodeRight, '');
    nodeCenter.addAdjacency(nodeRight, '');
    nodeRight.addAdjacency(nodeIn, '');
    nodeRight.addAdjacency(nodeOut, '');

    this.addRegex(nodeIn, nodeCenter, operands[0]);
  }

  addRegexBasic(nodeIn, nodeOut, label) {
    nodeIn.addAdjacency(nodeOut, label);
    this.alphabet.add(label);
  }

  addRegex(nodeIn, nodeOut, regex = ['']) {
    const operator = regex[0];
    if (operator === '(' || operator === ')') throw Error('Invalid regex: \nMissing operator');
    const operands = [];
    let level = 0;
    let operandBegining = 2;
    for (let i = 2; i < regex.length - 1; i += 1) {
      switch (regex[i]) {
        case '(': level += 1; break;
        case ')': level -= 1; break;
        case ',':
          if (level === 0) {
            operands.push(regex.slice(operandBegining, i));
            operandBegining = i + 1;
          }
          break;
        default: break;
      }
    }

    operands.push(regex.slice(operandBegining, regex.length - 1));

    if (level !== 0) throw Error('Invalid regex: \nParenthesis are wrong');

    switch (operator) {
      case '*': this.addRegexRepeat(nodeIn, nodeOut, operands); break;
      case '.': this.addRegexAdd(nodeIn, nodeOut, operands); break;
      case '|': this.addRegexOr(nodeIn, nodeOut, operands); break;
      case '': case undefined: throw Error('Invalid regex: \nMissing operands');
      case '(': case ')': throw Error('Invalid regex: \nMissing operator');
      default: this.addRegexBasic(nodeIn, nodeOut, regex); break;
    }
  }

  simplifyFinals() {
    const rebundantFinalNodes = new Set();
    const undeletableFinalNodes = new Set();
    for (const node of this.nodes.values()) {
      for (const adjecency of node.adjacencies) {
        if (adjecency.node.isFinal) {
          if (adjecency.label === '') {
            rebundantFinalNodes.add(adjecency.node);
            node.isFinal = true;
          } else {
            undeletableFinalNodes.add(adjecency.node);
          }
        }
      }
    }
    for (const node of rebundantFinalNodes) {
      if (!undeletableFinalNodes.has(node)) this.removeVertex(node.label);
    }
  }

  nodesOrigins() {
    const nodesOrigins = new Map();

    for (const node of this.nodes.values()) {
      for (const adjecency of node.adjacencies) {
        if (!Array.isArray(nodesOrigins.get(adjecency.node))) nodesOrigins.set(adjecency.node, []);
        nodesOrigins.get(adjecency.node).push(node);
      }
    }
    return nodesOrigins;
  }

  simplifyEpsilonLoops() {
    const nodesOrigins = this.nodesOrigins();

    for (const loop of this.start.epsilonLoops()) {
      const firstNode = Array.from(loop).reduce(
        (oldNode, node) => (node === this.start ? node : oldNode),
        Array.from(loop)[0],
      );

      for (const node of loop) {
        if (node !== firstNode) {
          for (const adjecency of node.adjacencies) {
            if (adjecency.node.isFinal) firstNode.isFinal = true;
            if (adjecency.label !== '') {
              firstNode.addAdjacency(adjecency.node, adjecency.label);
            }
          }
          for (const originNode of nodesOrigins.get(node)) {
            for (const originNodeAdjecency of node.adjacencies) {
              if (originNode === originNodeAdjecency.node) {
                if (originNode === firstNode && originNodeAdjecency.label !== '') {
                  originNode.addAdjacency(firstNode, originNodeAdjecency.label);
                }
              }
            }
          }
          this.removeVertex(node.label);
        }
      }
    }
  }

  simplifyConsecutiveEpsilons() {
    const undeletableEpsilonNodes = new Set([this.start]);
    const nodesOrigins = this.nodesOrigins();

    for (const node of this.nodes.values()) {
      for (const adjecency of node.adjacencies) {
        if (adjecency.label !== '') {
          undeletableEpsilonNodes.add(node);
          undeletableEpsilonNodes.add(adjecency.node);
        }
      }
    }

    for (const node of this.nodes.values()) {
      if (!undeletableEpsilonNodes.has(node)) {
        for (const adjecency of node.adjacencies) {
          const destinationNode = adjecency.node;
          if (node.isFinal) destinationNode.isFinal = true;

          for (const originNode of nodesOrigins.get(node)) {
            if (originNode !== destinationNode) {
              originNode.addAdjacency(destinationNode, '');
              nodesOrigins.get(destinationNode).push(originNode);
            }
          }
        }
        if (node.adjacencies.length === 0) {
          for (const originNode of nodesOrigins.get(node)) {
            originNode.isFinal = true;
          }
        }

        this.removeVertex(node.label);
        node.isFinal = true;
      }
    }
  }

  simplify() {
    this.simplifyConsecutiveEpsilons();
    this.simplifyEpsilonLoops();
  }

  addVertex(nodeName, isFinal = false) {
    let newNodeName = nodeName;
    if (newNodeName === undefined) newNodeName = this.nodes.size + 1;

    if (this.nodes.has(newNodeName)) {
      return this.nodes.get(newNodeName);
    }
    const node = new Node(newNodeName, isFinal);
    this.nodes.set(newNodeName, node);
    return node;
  }

  removeVertex(nodeName) {
    const current = this.nodes.get(nodeName);
    if (current) {
      for (const node of this.nodes.values()) {
        node.removeAllAdjacencies(current);
      }
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
      const foundLetters = new Set();

      for (const adjacentcy of node.adjacencies) {
        if (foundLetters.has(adjacentcy.label)) return false;
        foundLetters.add(adjacentcy.label);
      }

      if (foundLetters.size !== this.alphabet.size) return false;
    }
    return true;
  }

  isFinite() {
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
    let originNodes = new Set(this.start ? this.start.epsilonAccessibleNodes() : []);

    for (const letter of word) {
      const nextOriginNodes = new Set();

      for (const node of originNodes) {
        for (const adjacency of node.adjacencies) {
          if (adjacency.label === letter) {
            for (const node2 of adjacency.node.epsilonAccessibleNodes()) {
              nextOriginNodes.add(node2);
            }
          }
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

  toDotFormat() {
    if (this.invalid) {
      return `digraph "${this.title}" {
  "${this.errorMessage.replace(/"/g, '\\"') || 'Invalid input'}" [shape="plaintext" width=3];
}`;
    }

    if (this.nodes.size === 0) {
      return `digraph "${this.title}" {
  "Empty" [shape="plaintext" width=3 fontcolor="#666666"];
}`;
    }

    const nodesInDotFormat = [];
    const edgesInDotFormat = [];

    for (const node of this.nodes.values()) {
      nodesInDotFormat.push(`"${node.label}" [${this.fromRegex ? 'label= "", ' : ''}${node.isFinal ? 'shape=doublecircle' : ''}]`);

      for (const adjacency of node.adjacencies) {
        edgesInDotFormat.push(`"${node.label}" -> "${adjacency.node.label}" [label="${adjacency.label || 'ε'}"]`);
      }
    }

    return `digraph "${this.title}" {
  rankdir=LR;
  node [shape="circle"];
  "_" [label= "", shape=point]
  ${nodesInDotFormat.join('\n  ')}

  "_" -> "${this.start ? this.start.label || '_' : '_'}"
  ${edgesInDotFormat.join('\n  ')}
}`;
  }
}
