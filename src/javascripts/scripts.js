/* eslint-disable no-console */
const Viz = require('viz.js/viz');
const { Module, render } = require('viz.js/full.render.js');
// const Graph = require('./graph');
const parse = require('./parser');

const graphElem = document.getElementById('graph');
const graphTitleElem = document.getElementById('graph-title');
const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');
const uploadElem = document.getElementById('upload');
const infoDfaElem = document.getElementById('infoDfa');
const infoFiniteElem = document.getElementById('infoFinite');

let data;
// let graph;

let viz = new Viz({ Module, render });

function toDotFormat(graphData) {
  return `digraph "${graphData.comments ? graphData.comments[0] : 'Graph'}" {
  rankdir=LR;
  node [shape="circle"];
  "_" [label= "", shape=point]
${graphData.states.reduce((total, state) => `${total}  "${state}"${graphData.final.includes(state) ? ' [shape=doublecircle]' : ''}\n`, '')}

  "_" -> "${graphData.states[0] || '_'}"
${graphData.transitions.reduce((total, transition) => `${total}  "${transition.origin}" -> "${transition.destination}" [label="${transition.label || 'ε'}"]\n`, '')}
}`;
}

function readData() {
  data = parse(inputElem.value);
  // console.log(data);

  // graph = new Graph(data);
  // console.log(graph);

  outputElem.textContent = JSON.stringify(data, null, 2);

  viz.renderSVGElement(toDotFormat(data)).then((element) => {
    graphElem.innerHTML = '';
    graphElem.appendChild(element);
    graphTitleElem.textContent = data.comments ? data.comments[0] : '';
  }).catch(() => {
    viz = new Viz({ Module, render });
  });

  infoDfaElem.classList.remove('graph-info--false','graph-info--true','graph-info--warning');
  infoDfaElem.classList.add(`graph-info--${data.dfa ? 'true' : 'false'}`);
  // if(data.dfa !== graph.isDfa()) infoDfaElem.classList.add('graph-info--warning');

  infoFiniteElem.classList.remove('graph-info--false','graph-info--true','graph-info--warning');
  infoFiniteElem.classList.add(`graph-info--${data.finite ? 'true' : 'false'}`);
  // if(data.finite !== graph.isFinite()) infoFiniteElem.classList.add('graph-info--warning');
}

function readFileAsString() {
  const { files } = this;
  if (files.length >= 0) {
    const reader = new FileReader();
    reader.onload = (event) => {
      inputElem.value = event.target.result;
      readData();
      uploadElem.value = null;
    };
    reader.readAsText(files[0]);
  }
}

readData();

inputElem.addEventListener('input', readData);
uploadElem.addEventListener('change', readFileAsString);
