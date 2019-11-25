/* eslint-disable no-console */
import Viz from 'viz.js/viz';
import { Module, render } from 'viz.js/full.render';
import Graph from './graph';
import RawGraph from './rawGraph';

const graphElem = document.getElementById('graph');
const graphTitleElem = document.getElementById('graph-title');
const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');
const uploadElem = document.getElementById('upload');
const infoDfaElem = document.getElementById('infoDfa');
const infoFiniteElem = document.getElementById('infoFinite');

const storedRawGraph = localStorage.getItem('rawGraph');
if (storedRawGraph) inputElem.value = storedRawGraph;

let data;
let graph;

let viz = new Viz({ Module, render });

function readData() {
  localStorage.setItem('rawGraph', inputElem.value);
  data = new RawGraph(inputElem.value);
  // console.log(data);

  graph = new Graph(data);
  // console.log(graph);

  outputElem.textContent = JSON.stringify(data, null, 2);

  viz.renderSVGElement(data.toDotFormat()).then((element) => {
    graphElem.innerHTML = '';
    graphElem.appendChild(element);
    graphTitleElem.textContent = data.comments ? data.comments[0] : '';
  }).catch(() => {
    viz = new Viz({ Module, render });
  });

  const isDfa = graph.isDfa();
  infoDfaElem.classList.remove('graph-info--false', 'graph-info--true', 'graph-info--warning');
  infoDfaElem.classList.add(`graph-info--${isDfa ? 'true' : 'false'}`);
  if (data.dfa !== isDfa) infoDfaElem.classList.add('graph-info--warning');

  const isFinite = graph.isTree();
  infoFiniteElem.classList.remove('graph-info--false', 'graph-info--true', 'graph-info--warning');
  infoFiniteElem.classList.add(`graph-info--${isFinite ? 'true' : 'false'}`);
  if (data.finite !== isFinite) infoFiniteElem.classList.add('graph-info--warning');
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
