export function missingParentheses(arr) {
  let level = 0;
  for (const p of arr) {
    if (p === "(") level += 1;
    else if (p === ")") level -= 1;
    if (level < 0) return false;
  }
  return level;
}

export function checkParentheses(arr) {
  return missingParentheses(arr) === 0;
}
