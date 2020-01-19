# Report

## Things to explain

- List af all 'wrong' inputs accepted
- Regex are autofixed
- SVGs and graphs are saved
- Explain all simplifications
- svg spinner and web worker
- Webpack
- eslint
- isDfa and isFinite can be undefined
- uploading an image crashes but the app can be closed and opened again
- all accessibility inputs are focusable
- save functionality
- loading dots
- save file fixes errors

### Wrong inputs accepted

- Can skip states line
- Can skip aphabet line
- Can skip almost any character in between and add spaces anywhere

### Regex

- add regex: to use it
- auto closes parenthesis
- auto adds commas
- auto removes consecutive commas
- accepts .(a,b,c,d,e,...) and |(a,b,c,d,e,...)

### Details

- I use `export default` to define ES6 modules. Splitting the code in smaller chunks.
- The comment `eslint-disable-next-line no-console` disables the linter for the next line because
