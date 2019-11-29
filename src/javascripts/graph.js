/* eslint-disable no-restricted-syntax */
import Node from './node';

export default class Graph {
  constructor({
    regex, regexValidity, states, transitions, final, start, alphabet, comments,
  }) {
    this.title = comments ? comments[0] : 'Graph';
    this.fromRegex = regex !== '' && regexValidity.parentheses;

    if (this.fromRegex) {
      this.nodes = new Map();
      this.alphabet = new Set();

      const nodeIn = this.addVertex(undefined);
      const nodeOut = this.addVertex(undefined, true);
      this.start = nodeIn;
      try {
        this.addRegex(nodeIn, nodeOut, regex);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
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
      const node = this.addVertex(undefined);
      node.addAdjacency(nodeOut, '');
      this.addRegex(nodeIn, node, operand);
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

    if (level !== 0) throw Error('Parenthesis are wrong');

    switch (operator) {
      case '*': this.addRegexRepeat(nodeIn, nodeOut, operands); break;
      case '.': this.addRegexAdd(nodeIn, nodeOut, operands); break;
      case '|': this.addRegexOr(nodeIn, nodeOut, operands); break;
      case '': throw Error('No operands in a operation');
      case '(': case ')': throw Error('Missing operator (*.|)');
      default: this.addRegexBasic(nodeIn, nodeOut, regex); break;
    }
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
    let originNodes = new Set(this.start.epsilonAccessibleNodes());

    for (const letter of word) {
      const nextOriginNodes = new Set();

      for (const node of originNodes) {
        for (const adjacency of node.adjacencies) {
          if (adjacency.label === letter) {
            adjacency.node.epsilonAccessibleNodes().forEach(nextOriginNodes.add, nextOriginNodes);
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

  "_" -> "${this.start.label || '_'}"
  ${edgesInDotFormat.join('\n  ')}
}`;
  }
}
