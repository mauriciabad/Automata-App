/**
 * Reads the input and retruns an object with the data
 */

const regxParser = {
  alphabet: /alphabet:\s*(.*)\s*/i,
  states: /states:\s*((.*)*)\s*/i,
  final: /final:\s*((.*)*)\s*/i,
  transitions: /transitions:\s*\n((.*\n)*)\s*end\./i,
  transition: /\s*(.*)\s*,\s*(.)\s*(\[\s*(.)\s*,\s*(.)\s*\]\s*)?-->\s*(.*)\s*/g,
};

function parse(str) {
  const transitions = str.match(regxParser.transitions)[1];

  return {
    alphabet: str.match(regxParser.alphabet)[1],
    states: str.match(regxParser.states)[1].split(',').map((item) => item.trim()),
    final: str.match(regxParser.final)[1].split(',').map((item) => item.trim()),
    transitions: Array.from(transitions.matchAll(regxParser.transition), (match) => ({
      origin: match[1],
      destination: match[6],
      label: (match[2] === '_') ? '' : match[2],
    })),
  };
}

module.exports = parse;
