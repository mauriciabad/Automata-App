/* eslint-disable no-console */
const Graph = require('./graph');
const parse = require('./parser');

const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');

let data;
let graph;

function readData() {
  data = parse(inputElem.value);
  console.log(data);

  outputElem.textContent = JSON.stringify(data, null, 2);

  graph = new Graph(data);
  console.log(graph);
}

readData();

inputElem.addEventListener('input', () => { readData(); });
