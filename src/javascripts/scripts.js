/* eslint-disable no-console */
const Viz = require('viz.js/viz');
const { Module, render } = require('viz.js/full.render.js');
const Graph = require('./graph');
const parse = require('./parser');

const graphElem = document.getElementById('graph');
const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');

let data;
let graph;

const viz = new Viz({ Module, render });

function readData() {
  data = parse(inputElem.value);
  console.log(data);

  outputElem.textContent = JSON.stringify(data, null, 2);

  graph = new Graph(data);
  console.log(graph);
}

readData();

inputElem.addEventListener('input', readData);

let dotFile = `digraph myAutomaton { rankdir=LR; "" [shape=none] "A" [shape=doublecircle] "B" [shape=doublecircle] "C" [shape=circle] "SINK" [shape=circle] "" -> "C" "A" -> "A" [label="a"] "B" -> "SINK" [label="a [x/ε]"] "C" -> "B" [label="b [y/z]"] "C" -> "A" [label="ε"] "C" -> "A" [label="d"] "C" -> "C" [label="a"] }`;

viz.renderSVGElement(dotFile).then((element) => {
  graphElem.appendChild(element);
});
