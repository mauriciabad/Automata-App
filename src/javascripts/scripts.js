const Graph = require('./graph');
const parse = require('./parser');

const g = new Graph();
g.addVertex('A');

const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');

const data = parse(inputElem.textContent);

console.log(data);
outputElem.textContent = JSON.stringify(data, null, 2);
