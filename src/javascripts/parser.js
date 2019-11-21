/**
 * Reads the input and retruns an object with the data
 */

const regxParser = {
  comments: /^ *# *(.*) *$/gm,
  alphabet: /alphabet: *(\w*)/i,
  stack:    /stack: *(\w*)/i,
  states:   /states: *((.*)*)/i,
  final:    /final: *((.*)*)/i,
  dfa:      /dfa: *(\w*)/i,
  finite:   /finite: *(\w*)/i,
  words:    /words: *\n([^]+?) *end\./i,
  word:     /^ *(\w*)[^\w\n]+(\w+)/gm,
  transitions: /transitions: *\n([^]+?) *end\./i,
  transition:  /^ *([^\n,\->[\]]+) *,? *(\w?) *(\[ *(\w?) *,? *(\w?) *\]?)? *-*>? *([^\n,\->[\]]*)?/gm,
};

const afirmative = ['y', 'ye', 'yes', 'true', '1', 'ok'];

function parse(str) {
  const commentMatches = str.matchAll(regxParser.comments);
  const alphabetMatch  = str.match(regxParser.alphabet);
  const stackMatch     = str.match(regxParser.stack);
  const statesMatch    = str.match(regxParser.states);
  const finalMatch     = str.match(regxParser.final);
  const dfaMatch       = str.match(regxParser.dfa);
  const finiteMatch    = str.match(regxParser.finite);
  const transitionsMatches = (str.match(regxParser.transitions) || ['', ''])[1].matchAll(regxParser.transition);
  const wordsMatches       = (str.match(regxParser.words) || ['', ''])[1].matchAll(regxParser.word);

  return {
    comments: Array.from(commentMatches, (match) => match[1]),
    alphabet: (alphabetMatch ? alphabetMatch[1] : ''),
    stack:    (stackMatch    ? stackMatch[1]    : ''),
    states:   (statesMatch   ? statesMatch[1]   : '').split(',').map((item) => item.trim()).filter((item) => item !== ''),
    final:    (finalMatch    ? finalMatch[1]    : '').split(',').map((item) => item.trim()).filter((item) => item !== ''),
    transitions: Array.from(transitionsMatches, (match) => ({
      origin:       match[1] || '',
      destination:  match[6] || '',
      label:       (match[2] === '_') ? '' : match[2] || '',
      stack: {
        remove: (match[4] === '_') ? '' : match[4] || '',
        add:    (match[5] === '_') ? '' : match[5] || '',
      },
    })),
    dfa:    (dfaMatch ? afirmative.includes(dfaMatch[1].toLowerCase()) : false),
    finite: (finiteMatch ? afirmative.includes(finiteMatch[1].toLowerCase()) : false),
    words: Array.from(wordsMatches, (match) => ({
      word: match[1] || '',
      accepted: afirmative.includes(match[2].toLowerCase()),
    })),
  };
}

module.exports = parse;
