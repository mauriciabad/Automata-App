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

function toDotFormat(graphData) {
  return `digraph ${graphData.comments ? graphData.comments[0] : ''} {
  rankdir=LR;
  node [shape="circle"];
  "_" [label= "", shape=point]
${graphData.states.reduce((total, state) => `${total}  "${state}"${graphData.final.includes(state) ? ' [shape=doublecircle]' : ''}\n`, '')}

  "_" -> "${graphData.states[0]}"
${graphData.transitions.reduce((total, transition) => `${total}  "${transition.origin}" -> "${transition.destination}" [label="${transition.label || 'ε'}"]\n`, '')}
}`;
}

function readData() {
  data = parse(inputElem.value);
  // console.log(data);

  outputElem.textContent = JSON.stringify(data, null, 2);


  viz.renderSVGElement(toDotFormat(data)).then((element) => {
    graphElem.innerHTML = '';
    graphElem.appendChild(element);
  });

  graph = new Graph(data);
  // console.log(graph);
}

readData();

inputElem.addEventListener('input', readData);
