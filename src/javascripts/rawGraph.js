const regxParser = {
  comments: /^ *# *(.*) *$/gm,
  regex: /[(regex)|(re)|(regexr)(regular expression)]s? *: *(.*)/i,
  alphabet: /alphabets? *: *(\w*)/i,
  stack: /stacks? *: *(\w*)/i,
  states: /states? *: *((.*)*)/i,
  final: /final *: *((.*)*)/i,
  transitions: /transitions? *: *([^]+?) *end\.?/i,
  transition: /^ *([^\n,\->[\]]+) *,? *(\w?) *(\[ *(\w?) *,? *(\w?) *\]?)? *-*>? *([^\n,\->[\]]*)?/gm,
  dfa: /dfa *: *(\w*)/i,
  finite: /finite *: *(\w*)/i,
  words: /words? *: *([^]+?) *end\.?/i,
  word: /^ *(\w*)[^\w\n]+(\w+)/gm,
};

const afirmative = ['y', 'ye', 'yes', 'true', '1', 'ok'];

export default class RawGraph {
  constructor(str) {
    const commentMatches = str.matchAll(regxParser.comments);
    const regexMatch = str.match(regxParser.regex);
    const alphabetMatch = str.match(regxParser.alphabet);
    const stackMatch = str.match(regxParser.stack);
    const statesMatch = str.match(regxParser.states);
    const finalMatch = str.match(regxParser.final);
    const transitionsMatches = (str.match(regxParser.transitions) || ['', ''])[1].matchAll(regxParser.transition);
    const dfaMatch = str.match(regxParser.dfa);
    const finiteMatch = str.match(regxParser.finite);
    const wordsMatches = (str.match(regxParser.words) || ['', ''])[1].matchAll(regxParser.word);

    this.comments = Array.from(commentMatches, (match) => match[1]);
    this.regex = (regexMatch ? regexMatch[1] : '');
    this.alphabet = (alphabetMatch ? alphabetMatch[1] : '').split('').sort();
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

    if (this.states.length === 0) this.states = ['1'];
    // eslint-disable-next-line prefer-destructuring
    if (this.final.length === 0) this.final = this.states[0];

    // eslint-disable-next-line prefer-destructuring
    this.start = this.states[0];
  }

  toDotFormat() {
    return `digraph "${this.comments ? this.comments[0] : 'Graph'}" {
  rankdir=LR;
  node [shape="circle"];
  "_" [label= "", shape=point]
${this.states.reduce((total, state) => `${total}  "${state}"${this.final.includes(state) ? ' [shape=doublecircle]' : ''}\n`, '')}

  "_" -> "${this.start || '_'}"
${this.transitions.reduce((total, transition) => `${total}  "${transition.origin}" -> "${transition.destination}" [label="${transition.label || 'ε'}"]\n`, '')}
}`;
  }
}
