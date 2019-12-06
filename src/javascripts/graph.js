/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import Node from './node';

export default class Graph {
  constructor(data, type = 'original') {
    this.rawData = data;
    this.title = data.comments ? data.comments[0] : 'Graph';
    this.invalid = false;
    this.fromRegex = !!data.regex;
    this.type = type;
    this.isPda = data.stack.length > 0;
    this.stack = data.stack;

    if (this.fromRegex) {
      this.nodes = new Map();
      this.alphabet = new Set();

      try {
        const nodeIn = this.addVertex(undefined);
        const nodeOut = this.addVertex(undefined, true);
        this.start = nodeIn;
        this.addRegex(nodeIn, nodeOut, data.regex);
      } catch (e) {
        this.invalidate(e.message);
      }
    } else {
      this.nodes = new Map();
      this.alphabet = new Set(data.alphabet || []);

      for (const nodeName of data.states || []) {
        const node = this.addVertex(nodeName, (data.final || []).includes(nodeName));
        if (nodeName === data.start) this.start = node;
      }

      for (const edge of data.transitions || []) {
        this.addEdge(edge.origin, edge.destination, edge.label, edge.stack.remove, edge.stack.add);
      }

      if (!this.start) this.invalidate('Missing start node');
    }

    switch (this.type) {
      case 'dfa':
        this.simplify();
        this.addSink();
        break;
      case 'simplified':
        this.simplify();
        break;
      default:
      case 'original':
        break;
    }
  }

  invalidate(message) {
    this.nodes = new Map();
    this.alphabet = new Set();
    this.start = this.addVertex(undefined, false);
    this.invalid = true;
    this.errorMessage = message;
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

  nodesOrigins() {
    const nodesOrigins = new Map();

    for (const node of this.nodes.values()) {
      nodesOrigins.set(node, new Set());
    }

    for (const node of this.nodes.values()) {
      for (const adjecency of node.adjacencies) {
        nodesOrigins.get(adjecency.node).add(node);
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
            if (adjecency.node.isFinal && adjecency.label === '') firstNode.isFinal = true;

            firstNode.addAdjacency(adjecency.node, adjecency.label);
          }
          for (const originNode of nodesOrigins.get(node).values()) {
            for (const originNodeAdjecency of originNode.adjacencies) {
              if (node === originNodeAdjecency.node) {
                if (originNodeAdjecency.label !== '') {
                  originNode.addAdjacency(firstNode, originNodeAdjecency.label);
                }
              }
            }
          }
          this.removeVertex(node.label);
        }
      }
      if (firstNode.hasAdjacency(firstNode, '')) firstNode.removeAdjacency(firstNode, '');
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

          for (const originNode of nodesOrigins.get(node).values()) {
            if (originNode !== destinationNode) {
              originNode.addAdjacency(destinationNode, '');
              nodesOrigins.get(destinationNode).add(originNode);
            }
          }
        }
        if (node.adjacencies.length === 0 && nodesOrigins.has(node)) {
          for (const originNode of nodesOrigins.get(node).values()) {
            originNode.isFinal = node.isFinal;
          }
        }

        this.removeVertex(node.label);
        node.isFinal = true;
      }
    }
  }

  simplifySkipableNodes() {
    const nodesOrigins = this.nodesOrigins();

    for (const node of this.nodes.values()) {
      if (node !== this.start && !node.isFinal && node.adjacencies.length !== 0) {
        let skipable = true;
        for (const adjecency of node.adjacencies) {
          if (adjecency.label !== '') {
            skipable = false;
            break;
          }
        }
        if (skipable) {
          for (const originNode of nodesOrigins.get(node).values()) {
            for (const originNodeAdjecency of originNode.adjacencies) {
              for (const destinationNode of node.adjecentNodes) {
                originNode.addAdjacency(destinationNode, originNodeAdjecency.label);
              }
            }
          }
          this.removeVertex(node.label);
        }
      }
    }
  }

  simplifyStart() {
    const nodesOrigins = this.nodesOrigins();

    for (const startAdjecency of this.start.adjacencies) {
      const { node } = startAdjecency;
      if (node !== this.start) {
        let skipable = nodesOrigins.get(node).size === 1;
        if (skipable) {
          for (const adj of [...nodesOrigins.get(node)][0].adjacencies) {
            if (adj.node === node && adj.label !== '') {
              skipable = false;
              break;
            }
          }
        }

        if (skipable && startAdjecency.label === '') {
          for (const adjecency of node.adjacencies) {
            this.start.addAdjacency(adjecency.node, adjecency.label);
          }
          if (node.isFinal) this.start.isFinal = true;
          this.removeVertex(node.label);
        }
      }
    }
  }

  simplifySelfEpsilonLoops() {
    for (const node of this.nodes.values()) {
      node.removeAdjacency(node, '');
    }
  }

  simplifyPowersetAlgorithm() {
    for (const node of this.nodes.values()) {
      for (const accesibleNode of node.epsilonAccessibleNodes()) {
        if (accesibleNode.isFinal) node.isFinal = true;
        for (const accesibleNodeAdjacency of accesibleNode.adjacencies) {
          if (accesibleNodeAdjacency.label !== '')node.addAdjacency(accesibleNodeAdjacency.node, accesibleNodeAdjacency.label);
        }
      }
      for (const adjacency of node.adjacencies) {
        if (adjacency.label === '') node.removeAdjacency(adjacency.node, adjacency.label);
      }
    }
  }

  simplify() {
    if (!this.isPda) {
      this.simplifyConsecutiveEpsilons();
      this.simplifyEpsilonLoops();
      this.simplifyStart();
      this.simplifySkipableNodes();
      this.simplifySelfEpsilonLoops();
      this.simplifyPowersetAlgorithm();
    }
  }

  addSink() {
    if (!this.isPda) {
      const sink = this.addVertex('Sink');
      for (const letter of this.alphabet) {
        sink.addAdjacency(sink, letter);
      }
      for (const node of this.nodes.values()) {
        for (const letter of this.alphabet) {
          if (!node.isAdjecent({ label: letter })) node.addAdjacency(sink, letter);
        }
      }
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
      for (const node of this.nodes.values()) {
        node.removeAllAdjacencies(current);
      }
    }
    return this.nodes.delete(nodeName);
  }

  addEdge(source, destination, label, stackPop = '', stackPush = '') {
    const sourceNode = this.addVertex(source);
    const destinationNode = this.addVertex(destination);

    sourceNode.addAdjacency(destinationNode, label, stackPop, stackPush);
  }

  removeEdge(source, destination, label, stackPop = '', stackPush = '') {
    const sourceNode = this.nodes.get(source);
    const destinationNode = this.nodes.get(destination);

    if (sourceNode) {
      if (destinationNode) {
        if (label !== undefined) {
          sourceNode.removeAdjacent(destinationNode, label, stackPop, stackPush);
        } else {
          sourceNode.removeAllAdjacencies(destinationNode);
        }
      } else {
        sourceNode.removeAllAdjacencies();
      }
    }

    return [sourceNode, destinationNode, label];
  }

  get isDfa() {
    if (this._isDfa !== undefined) return this._isDfa;
    this._isDfa = this.evalIsDfa();
    return this._isDfa;
  }

  evalIsDfa() {
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

  get isFinite() {
    if (this._isFinite !== undefined) return this._isFinite;
    this._isFinite = this.start.checkIsFinal();
    return this._isFinite;
  }

  get toDfa() {
    if (this._dfaGraph !== undefined) return this._dfaGraph;
    this.generateDfa();
    return this._dfaGraph;
  }

  get acceptedStrings() {
    if (this._acceptedStrings !== undefined) return this._acceptedStrings;
    this._acceptedStrings = this.isFinite ? this.start.acceptedStrings() : [];
    return this._acceptedStrings;
  }

  newRawData() {
    const transitions = [];

    for (const node of this.nodes.values()) {
      for (const adjacency of node.adjacencies) {
        transitions.push({
          origin: node.label,
          destination: adjacency.node.label,
          label: adjacency.label,
          stack: {
            remove: adjacency.stackPop,
            add: adjacency.stackPush,
          },
        });
      }
    }

    return {
      alphabet: [...this.alphabet],
      states: [...this.nodes.values()].map((node) => node.label),
      start: this.start.label,
      stack: [...this.stack],
      transitions,
      final: [...this.nodes.values()].filter((node) => node.isFinal).map((node) => node.label),
    };
  }

  toRawText() {
    const data = this.newRawData();

    return `${this.rawData.comments.reduce((total, comment) => `${total}# ${comment}\n`, '')}alphabet: ${data.alphabet.join('')}
${data.stack ? `stack: ${data.stack.join('')}\n` : ''}states: ${data.states.join(',')}
final: ${data.final.join(',')}
transitions: ${data.transitions.reduce((total, transition) => `${total}${transition.origin},${transition.label}${transition.stack.add || transition.stack.remove ? ` [${transition.stack.remove || '_'},${transition.stack.add || '_'}]` : ''} --> ${transition.destination}\n`, '\n')}end.

dfa: ${data.isDfa ? 'y' : 'n'}
finite: ${data.isFinite ? 'y' : 'n'}

words: ${this.rawData.words.reduce((total, word) => `${total}${word.word},${word.accepted ? 'y' : 'n'}\n`, '\n')}end.
${this.rawData.regex ? `\nregex: ${this.rawData.regex}` : ''}`;
  }

  isAcceptedString(word) {
    if (this.isPda) return this.isAcceptedStringPda(word);

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

  isAcceptedStringPda(word) {
    let originNodeStacks = this.start.epsilonAccessibleNodesPda();

    for (const letter of word) {
      const nextOriginNodeStacks = new Map();

      for (const [node, stacks] of originNodeStacks) {
        for (const stack of stacks) {
          const pop = stack.slice(-1);

          for (const adjacency of node.adjacencies) {
            if (adjacency.label === letter && (adjacency.stackPop === '' || adjacency.stackPop === pop)) {
              if (stack.length <= 1000) {
                const nextStack = ((adjacency.stackPop === '') ? stack : stack.slice(0, -1)) + adjacency.stackPush;
                const epsilonAccessibleNodes = adjacency.node.epsilonAccessibleNodesPda(nextStack);

                for (const [node2, stacks2] of epsilonAccessibleNodes) {
                  if (!nextOriginNodeStacks.has(node2)) nextOriginNodeStacks.set(node2, new Set());
                  nextOriginNodeStacks.get(node2).add(...stacks2);
                }
              }
            }
          }
        }
      }

      if (nextOriginNodeStacks.size === 0) return false;

      originNodeStacks = nextOriginNodeStacks;
    }

    for (const [node, stacks] of originNodeStacks) {
      for (const stack of stacks) {
        if (node.isFinal && stack === '') return true;
      }
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
      nodesInDotFormat.push(`"${node.label}" [${this.fromRegex && node.label !== 'Sink' ? 'label=""' : ''} ${node.isFinal ? ' shape=doublecircle' : ''}]`);

      for (const adjacency of node.adjacencies) {
        edgesInDotFormat.push(`"${node.label}" -> "${adjacency.node.label}" [label="${adjacency.label || 'ε'}${adjacency.stackPush || adjacency.stackPop ? `, ${adjacency.stackPop || 'ε'} → ${adjacency.stackPush || 'ε'}` : ''}"]`);
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
