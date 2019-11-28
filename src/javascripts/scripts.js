/* eslint-disable no-console */
import Viz from 'viz.js/viz';
import { Module, render } from 'viz.js/full.render';
import Graph from './graph';
import RawGraph from './rawGraph';
import templates from '../data/templates';

const graphElem = document.getElementById('graph');
const graphTitleElem = document.getElementById('graph-title');
const inputElem = document.getElementById('input');
const outputElem = document.getElementById('output');
const uploadElem = document.getElementById('upload');
const wordsElem = document.getElementById('wordList');
const selectTemplateElem = document.getElementById('selectTemplate');
const infoDfaElem = document.getElementById('infoDfa');
const infoFiniteElem = document.getElementById('infoFinite');
const inputTestElem = document.getElementById('inputTest');
const inputTestIconElem = document.getElementById('inputTestIcon');

inputTestElem.value = localStorage.getItem('word');
const storedRawGraph = localStorage.getItem('rawGraph');
if (storedRawGraph) inputElem.value = storedRawGraph;
if (!inputElem.value) inputElem.value = templates.Default;
selectTemplateElem.innerHTML = Object.keys(templates).reduce((total, templateName) => `${total}<option value="${templateName}">${templateName}</option>`, '<option value="" selected disabled style="display: none;" id="selectTemplatePlaceholder">Template</option>');
const selectTemplatePlaceholderElem = document.getElementById('selectTemplatePlaceholder');

let data;
let graph;

let viz = new Viz({ Module, render });

function testWord() {
  const word = inputTestElem.value.trim();
  localStorage.setItem('word', word);

  if (inputTestElem.checkValidity()) {
    inputTestIconElem.dataset.icon = graph.isValidPath(word) ? 'true' : 'false';
  } else {
    inputTestIconElem.dataset.icon = 'wrong';
  }
}

function readData() {
  // Read data
  localStorage.setItem('rawGraph', inputElem.value);
  data = new RawGraph(inputElem.value);
  graph = new Graph(data);
  // console.log(data);
  // console.log(graph);

  // Display ouput
  outputElem.textContent = JSON.stringify(data, null, 2);

  // Display graph
  viz.renderSVGElement(data.toDotFormat()).then((element) => {
    graphElem.innerHTML = '';
    graphElem.appendChild(element);
    graphTitleElem.textContent = data.comments ? data.comments[0] : '';
  }).catch(() => {
    viz = new Viz({ Module, render });
  });

  // Test Dfa
  const isDfa = graph.isDfa();
  infoDfaElem.classList.remove(
    'info__icon-container--false',
    'info__icon-container--true',
    'info__icon-container--wrong',
    'info__icon-container--unknown',
    'info__icon-container--warning',
  );
  infoDfaElem.classList.add(`info__icon-container--${isDfa ? 'true' : 'false'}`);
  if (data.dfa !== isDfa) infoDfaElem.classList.add('info__icon-container--warning');

  // Test finite
  const isFinite = graph.isTree();
  infoFiniteElem.classList.remove(
    'info__icon-container--false',
    'info__icon-container--true',
    'info__icon-container--wrong',
    'info__icon-container--unknown',
    'info__icon-container--warning',
  );
  infoFiniteElem.classList.add(`info__icon-container--${isFinite ? 'true' : 'false'}`);
  if (data.finite !== isFinite) infoFiniteElem.classList.add('info__icon-container--warning');

  // Test words
  wordsElem.innerHTML = data.words.reduce((total, word) => `${total}<li class="word-list__item" data-icon="${graph.isValidPath(word.word)}" data-original="${word.accepted}"><span class="word-list__word">${word.word !== '' ? word.word : '&nbsp;'}</span></li>`, '');

  // Test custon word
  inputTestElem.pattern = `^ *[${data.alphabet.join('')}]* *$`;
  testWord();
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
    selectTemplatePlaceholderElem.textContent = files[0].name;
    selectTemplatePlaceholderElem.selected = true;
  }
}

function openTemplate() {
  if (selectTemplateElem.value) {
    inputElem.value = templates[selectTemplateElem.value];
    readData();
  }
}

readData();

inputElem.addEventListener('input', readData);
uploadElem.addEventListener('change', readFileAsString);
selectTemplateElem.addEventListener('change', openTemplate);
inputTestElem.addEventListener('input', testWord);
