/* eslint-disable no-restricted-syntax */
/**
 * Raw graph
 */
const regxParser = {
  comments: /^ *# *(.*) *$/gm,
  alphabet: /alphabet: *(\w*)/i,
  stack: /stack: *(\w*)/i,
  states: /states: *((.*)*)/i,
  final: /final: *((.*)*)/i,
  transitions: /transitions: *\n([^]+?) *end\./i,
  transition: /^ *([^\n,\->[\]]+) *,? *(\w?) *(\[ *(\w?) *,? *(\w?) *\]?)? *-*>? *([^\n,\->[\]]*)?/gm,
  dfa: /dfa: *(\w*)/i,
  finite: /finite: *(\w*)/i,
  words: /words: *\n([^]+?) *end\./i,
  word: /^ *(\w*)[^\w\n]+(\w+)/gm,
};

const afirmative = ['y', 'ye', 'yes', 'true', '1', 'ok'];

class RawGraph {
  constructor(str) {
    const commentMatches = str.matchAll(regxParser.comments);
    const alphabetMatch = str.match(regxParser.alphabet);
    const stackMatch = str.match(regxParser.stack);
    const statesMatch = str.match(regxParser.states);
    const finalMatch = str.match(regxParser.final);
    const transitionsMatches = (str.match(regxParser.transitions) || ['', ''])[1].matchAll(regxParser.transition);
    const dfaMatch = str.match(regxParser.dfa);
    const finiteMatch = str.match(regxParser.finite);
    const wordsMatches = (str.match(regxParser.words) || ['', ''])[1].matchAll(regxParser.word);

    this.comments = Array.from(commentMatches, (match) => match[1]);
    this.alphabet = (alphabetMatch ? alphabetMatch[1] : '').split('');
    this.stack = (stackMatch ? stackMatch[1] : '');
    this.states = (statesMatch ? statesMatch[1] : '').split(',').map((item) => item.trim()).filter((item) => item !== '');
    this.final = (finalMatch ? finalMatch[1] : '').split(',').map((item) => item.trim()).filter((item) => item !== '');
    this.transitions = Array.from(transitionsMatches, (match) => {
      if (match[1] && !this.states.includes(match[1])) this.states.push(match[1]);
      if (match[6] && !this.states.includes(match[6])) this.states.push(match[6]);
      const label = (match[2] === '_') ? '' : match[2] || '';
      if (label && !this.alphabet.includes(label)) this.alphabet.push(label);
      return {
        origin: match[1] || '',
        destination: match[6] || '',
        label,
        stack: {
          remove: (match[4] === '_') ? '' : match[4] || '',
          add: (match[5] === '_') ? '' : match[5] || '',
        },
      };
    });
    this.dfa = (dfaMatch ? afirmative.includes(dfaMatch[1].toLowerCase()) : false);
    this.finite = (finiteMatch ? afirmative.includes(finiteMatch[1].toLowerCase()) : false);
    this.words = Array.from(wordsMatches, (match) => ({
      word: match[1] || '',
      accepted: afirmative.includes(match[2].toLowerCase()),
    }));
    this.start = this.states[0] || '';
  }

  isDfa() {
    const nodes = {};

    for (const state of this.states) {
      nodes[state] = new Set(this.alphabet);
    }

    for (const transition of this.transitions) {
      if (transition.label === '') return false; // Epsilon found

      if (nodes[transition.origin].has(transition.label)) {
        nodes[transition.origin].delete(transition.label);
      } else {
        return false; // Repeated letter in a node
      }
    }

    for (const node of Object.values(nodes)) {
      if (node.size > 0) return false; // Missing letter in a node
    }

    return true;
  }
}

module.exports = RawGraph;
