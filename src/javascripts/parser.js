/**
 * Reads the input and retruns an object with the data
 */

const regxParser = {
  comments: /^ *# *(.*) *$/gm,
  alphabet: /alphabet: *(.*) */i,
  states: /states: *((.*)*) */i,
  final: /final: *((.*)*) */i,
  transitions: /transitions: *\n([^]*) *end\./i,
  transition: /^ *([^\n,\->[\]]+) *,? *([^\n,\->[\]]?) *(\[ *([^\n,\->[\]]?) *,? *([^\n,\->[\]]?) *\]?)? *-?-?>? *([^\n,\->[\]]*)? */gm,
};

function parse(str) {
  const transitions = str.match(regxParser.transitions)[1];

  return {
    comments: Array.from(str.matchAll(regxParser.comments), (match) => match[1]),
    alphabet: str.match(regxParser.alphabet)[1] || '',
    states: str.match(regxParser.states)[1].split(',').map((item) => item.trim()).filter((item) => item !== ''),
    final: str.match(regxParser.final)[1].split(',').map((item) => item.trim()).filter((item) => item !== ''),
    transitions: Array.from(transitions.matchAll(regxParser.transition), (match) => ({
      origin: match[1] || '',
      destination: match[6] || '',
      label: (match[2] === '_') ? '' : match[2] || '',
    })),
  };
}

module.exports = parse;
