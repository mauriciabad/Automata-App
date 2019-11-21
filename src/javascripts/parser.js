/**
 * Reads the input and retruns an object with the data
 */

const regxParser = {
  comments: /^ *# *(.*) *$/gm,
  alphabet: /alphabet: *(.*) */i,
  stack: /stack: *(.*) */i,
  states: /states: *((.*)*) */i,
  final: /final: *((.*)*) */i,
  transitions: /transitions: *\n([^]*) *end\./i,
  transition: /^ *([^\n,\->[\]]+) *,? *([^\n,\->[\]]?) *(\[ *([^\n,\->[\]]?) *,? *([^\n,\->[\]]?) *\]?)? *-*>? *([^\n,\->[\]]*)? */gm,
};

function parse(str) {
  const commentMatches = str.matchAll(regxParser.comments);
  const alphabetMatch = str.match(regxParser.alphabet);
  const stackMatch = str.match(regxParser.stack);
  const statesMatch = str.match(regxParser.states);
  const finalMatch = str.match(regxParser.final);
  const transitionsMatches = (str.match(regxParser.transitions) || ['', ''])[1].matchAll(regxParser.transition);

  return {
    comments: Array.from(commentMatches, (match) => match[1]),
    alphabet: (alphabetMatch ? alphabetMatch[1] : ''),
    stack: (stackMatch ? stackMatch[1] : ''),
    states: (statesMatch ? statesMatch[1] : '').split(',').map((item) => item.trim()).filter((item) => item !== ''),
    final: (finalMatch ? finalMatch[1] : '').split(',').map((item) => item.trim()).filter((item) => item !== ''),
    transitions: Array.from(transitionsMatches, (match) => ({
      origin: match[1] || '',
      destination: match[6] || '',
      label: (match[2] === '_') ? '' : match[2] || '',
    })),
  };
}

module.exports = parse;
