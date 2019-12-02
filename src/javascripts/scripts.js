/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-console */
import 'babel-polyfill';
import Viz from 'viz.js';
// eslint-disable-next-line import/no-unresolved
import workerURL from 'file-loader!viz.js/full.render';
import Graph from './graph';
import RawGraph from './rawGraph';
import templates from '../data/templates';

const graphElem = document.getElementById('graph');
const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');
const uploadElem = document.getElementById('upload');
const simplifyElem = document.getElementById('simplify');
const dfaElem = document.getElementById('dfa');
const wordsElem = document.getElementById('wordList');
const selectTemplateElem = document.getElementById('selectTemplate');
const infoDfaElem = document.getElementById('infoDfa');
const infoFiniteElem = document.getElementById('infoFinite');
const inputTestElem = document.getElementById('inputTest');
const inputTestIconElem = document.getElementById('inputTestIcon');

inputTestElem.value = localStorage.getItem('word');
simplifyElem.checked = localStorage.getItem('simplify') === 'true';
dfaElem.checked = localStorage.getItem('dfa') === 'true';
const storedRawGraph = localStorage.getItem('rawGraph');
if (storedRawGraph) inputElem.value = storedRawGraph;
if (!inputElem.value) inputElem.value = templates.Default;
selectTemplateElem.innerHTML = Object.keys(templates).reduce((total, templateName) => `${total}<option value="${templateName}">${templateName}</option>`, '<option value="" selected disabled style="display: none;" id="selectTemplatePlaceholder">Template</option>');
const selectTemplatePlaceholderElem = document.getElementById('selectTemplatePlaceholder');

let data;
let graph;
let graphDfa;
let graphNoDfa;
let graphSvg = {};

let viz = new Viz({ workerURL });

async function testCustomWord() {
  const word = inputTestElem.value.trim();
  localStorage.setItem('word', word);

  if (inputTestElem.checkValidity()) {
    inputTestIconElem.dataset.icon = graph.isValidPath(word) ? 'true' : 'false';
  } else {
    inputTestIconElem.dataset.icon = 'wrong';
  }
}

async function testDfa() {
  infoDfaElem.classList.remove(
    'info__icon-container--false',
    'info__icon-container--true',
    'info__icon-container--wrong',
    'info__icon-container--unknown',
    'info__icon-container--warning',
  );
  infoDfaElem.classList.add(`info__icon-container--${graph.isDfa ? 'true' : 'false'}`);
  if (data.dfa !== graph.isDfa) infoDfaElem.classList.add('info__icon-container--warning');
}

async function testFinite() {
  infoFiniteElem.classList.remove(
    'info__icon-container--false',
    'info__icon-container--true',
    'info__icon-container--wrong',
    'info__icon-container--unknown',
    'info__icon-container--warning',
  );
  infoFiniteElem.classList.add(`info__icon-container--${graph.isFinite ? 'true' : 'false'}`);
  if (data.finite !== graph.isFinite) infoFiniteElem.classList.add('info__icon-container--warning');
}

async function testWords() {
  wordsElem.innerHTML = data.words.reduce((total, word) => `${total}<li class="word-list__item" data-icon="${graph.isValidPath(word.word)}" data-original="${word.accepted}"><span class="word-list__word">${word.word !== '' ? word.word : '&nbsp;'}</span></li>`, '');
}

async function displayGraph() {
  localStorage.setItem('simplify', simplifyElem.checked);

  if (graphSvg[simplifyElem.checked][dfaElem.checked]) {
    graphElem.innerHTML = '';
    graphElem.appendChild(graphSvg[simplifyElem.checked][dfaElem.checked]);
  } else {
    graphElem.innerHTML = '<div class="hexdots-loader"> </div>';

    viz.renderSVGElement(graph.toDotFormat(simplifyElem.checked)).then((element) => {
      graphElem.innerHTML = '';
      graphElem.appendChild(element);
      graphSvg[simplifyElem.checked][dfaElem.checked] = element;
    }).catch(() => {
      viz = new Viz({ workerURL });
    });
  }
}

async function readData() {
  localStorage.setItem('rawGraph', inputElem.value);
  localStorage.setItem('dfa', dfaElem.checked);
  localStorage.setItem('simplify', simplifyElem.checked);

  data = new RawGraph(inputElem.value);

  graphNoDfa = new Graph(data);
  if (dfaElem.checked) graphDfa = graphNoDfa.toDfa;
  graph = dfaElem.checked ? graphDfa : graphNoDfa;

  graphSvg = {
    true: { true: undefined, false: undefined },
    false: { true: undefined, false: undefined },
  };

  inputTestElem.pattern = `^ *[${[...graph.alphabet].join('')}]* *$`;

  outputElem.textContent = JSON.stringify(data, null, 2);

  displayGraph();

  testDfa();
  testFinite();

  testWords();
  testCustomWord();
}

async function updateDfa() {
  localStorage.setItem('dfa', dfaElem.checked);

  if (dfaElem.checked) graphDfa = graphNoDfa.toDfa;
  graph = dfaElem.checked ? graphDfa : graphNoDfa;

  displayGraph();

  testDfa();
  testFinite();

  testWords();
  testCustomWord();
}

async function readFileAsString() {
  const { files } = this;
  if (files.length >= 0) {
    const reader = new FileReader();
    reader.onload = (event) => {
      inputElem.value = event.target.result;
      readData();
      uploadElem.value = null;
    };
    reader.readAsText(files[0]);
    selectTemplatePlaceholderElem.textContent = files[0].name;
    selectTemplatePlaceholderElem.selected = true;
  }
}

async function openTemplate() {
  if (selectTemplateElem.value) {
    inputElem.value = templates[selectTemplateElem.value];
    readData();
  }
}

readData();

inputElem.addEventListener('input', readData);
simplifyElem.addEventListener('input', displayGraph);
dfaElem.addEventListener('input', updateDfa);
uploadElem.addEventListener('change', readFileAsString);
selectTemplateElem.addEventListener('change', openTemplate);
inputTestElem.addEventListener('input', testCustomWord);
