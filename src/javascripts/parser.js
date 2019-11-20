/**
 * Reads the input and retruns an object with the data
 */

const regxParser = {
  alphabet: /alphabet:\s*((.)*)\s*/im,
  states: /states:\s*((.)*)\s*/im,
  final: /final:\s*((.)*)\s*/im,
  transitions: /transitions:\s*\n((.*\n)*)\s*end\./im,
  transition: /\s*(.)\s*,\s*(.)\s*(\[\s*(.)\s*,\s*(.)\s*\]\s*)?-->\s*(.)\s*/,
};

function parse(str) {
  return {
    alphabet: str.match(regxParser.alphabet)[1],
    states: str.match(regxParser.states)[1].split(',').map((item) => item.trim()),
    final: str.match(regxParser.final)[1].split(',').map((item) => item.trim()),
    transitions: str.match(regxParser.transitions)[1].slice(0, -1).split('\n').map((item) => {
      const match = item.match(regxParser.transition);
      return {
        origin: match[1],
        destination: match[6],
        label: (match[2] === '_') ? '' : match[2],
      };
    }),
  };
}

module.exports = parse;
