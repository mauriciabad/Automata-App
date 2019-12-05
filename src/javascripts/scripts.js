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
const saveElem = document.getElementById('save');
const simplifyElem = document.getElementById('simplify');
const dfaElem = document.getElementById('dfa');
const wordsElem = document.getElementById('wordList');
const allWordsElem = document.getElementById('wordListAll');
const selectTemplateElem = document.getElementById('selectTemplate');
const infoDfaElem = document.getElementById('infoDfa');
const infoFiniteElem = document.getElementById('infoFinite');
const inputTestElem = document.getElementById('inputTest');
const inputTestIconElem = document.getElementById('inputTestIcon');
const toggleGroupElem = document.getElementById('toggleGroup');
const testsElem = document.getElementById('tests');

inputTestElem.value = localStorage.getItem('word');
simplifyElem.checked = localStorage.getItem('simplify') === 'true';
dfaElem.checked = localStorage.getItem('dfa') === 'true';
const storedRawGraph = localStorage.getItem('rawGraph');
if (storedRawGraph) inputElem.value = storedRawGraph;
if (!inputElem.value) inputElem.value = templates.Wooow;
// templates = { ...localStorage.getItem('customTemplates'), templates };
selectTemplateElem.innerHTML = Object.keys(templates).reduce((total, templateName, i) => `${total} <input type="radio" name="template" id="template-${i}" value="${templateName}"><label for="template-${i}">${templateName}</label>`, '');

let data;
let graph = { simplified: undefined, original: undefined, dfa: undefined };
let graphSvg = { simplified: undefined, original: undefined, dfa: undefined };

let viz = new Viz({ workerURL });

let testStringRemovePattern = /\W+/g;

function getGraphType() {
  if (dfaElem.checked) return 'dfa';
  if (simplifyElem.checked) return 'simplified';
  return 'original';
}

async function testCustomWord() {
  const word = inputTestElem.value.replace(testStringRemovePattern, '');

  inputTestElem.value = word;

  localStorage.setItem('word', word);

  if (inputTestElem.checkValidity()) {
    inputTestIconElem.dataset.icon = graph[getGraphType()].isAcceptedString(word) ? 'true' : 'false';
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
  infoDfaElem.classList.add(`info__icon-container--${graph[getGraphType()].isDfa ? 'true' : 'false'}`);
  if (getGraphType() !== 'dfa' && data.dfa !== graph[getGraphType()].isDfa) infoDfaElem.classList.add('info__icon-container--warning');
}

async function testFinite() {
  infoFiniteElem.classList.remove(
    'info__icon-container--false',
    'info__icon-container--true',
    'info__icon-container--wrong',
    'info__icon-container--unknown',
    'info__icon-container--warning',
  );

  let result = graph[getGraphType()].isFinite ? 'true' : 'false';
  if (graph[getGraphType()].isPda) result = 'unknown';

  infoFiniteElem.classList.add(`info__icon-container--${result}`);
  if (data.finite !== graph[getGraphType()].isFinite && !graph[getGraphType()].isPda) infoFiniteElem.classList.add('info__icon-container--warning');
}

async function testWords() {
  wordsElem.innerHTML = data.words.reduce((total, word) => `${total}<li class="word-list__item" data-icon="${graph[getGraphType()].isAcceptedString(word.word)}" data-original="${word.accepted}"><span class="word-list__word">${word.word !== '' ? word.word : '&nbsp;'}</span></li>`, '');
}

async function displayAllAcceptedStrings() {
  allWordsElem.innerHTML = graph[getGraphType()].acceptedStrings.reduce((total, word) => `${total}<li class="word-list__item" data-icon="true"><span class="word-list__word">${word !== '' ? word : '&nbsp;'}</span></li>`, '');
  allWordsElem.dataset.infinite = !graph[getGraphType()].isFinite;
}

async function displayGraph() {
  const type = getGraphType();

  saveElem.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(graph[type].toRawText())}`);
  saveElem.setAttribute('download', `${graph[type].title}-${type}.txt`);

  if (graphSvg[type]) {
    graphElem.innerHTML = '';
    graphElem.appendChild(graphSvg[type]);
  } else {
    graphElem.innerHTML = '<div class="hexdots-loader"> </div>';

    viz.renderSVGElement(graph[type].toDotFormat()).then((element) => {
      graphElem.innerHTML = '';
      graphElem.appendChild(element);
      graphSvg[type] = element;
    }).catch(() => {
      viz = new Viz({ workerURL });

      viz.renderSVGElement('digraph "Graph" { "Graph too big,\nskiping drawing" [shape="plaintext" width=3];}').then((element) => {
        graphElem.innerHTML = '';
        graphElem.appendChild(element);
        graphSvg[type] = element;
      }).catch(() => { viz = new Viz({ workerURL }); });
    });
  }
}

async function readData() {
  localStorage.setItem('rawGraph', inputElem.value);

  const newData = new RawGraph(inputElem.value);
  if (JSON.stringify(data) !== JSON.stringify(newData)) {
    data = newData;

    if (data.stack) {
      dfaElem.checked = false;
      simplifyElem.checked = false;

      localStorage.setItem('dfa', dfaElem.checked);
      localStorage.setItem('simplify', simplifyElem.checked);

      dfaElem.disabled = true;
      simplifyElem.disabled = true;

      toggleGroupElem.classList.add('toggle-group__faded');
      testsElem.classList.add('noAllWords');
    } else {
      dfaElem.disabled = false;
      simplifyElem.disabled = false;

      toggleGroupElem.classList.remove('toggle-group__faded');
      testsElem.classList.remove('noAllWords');
    }

    graph = {
      simplified: (!data.stack) ? new Graph(data, 'simplified') : undefined,
      original: new Graph(data, 'original'),
      dfa: (dfaElem.checked && !data.stack) ? new Graph(data, 'dfa') : undefined,
    };
    graphSvg = { simplified: undefined, original: undefined, dfa: undefined };

    inputTestElem.pattern = `^[${[...graph[getGraphType()].alphabet].join('')}]*$`;
    testStringRemovePattern = new RegExp(`[^${[...graph[getGraphType()].alphabet].join('')}]+`, 'g');

    outputElem.textContent = JSON.stringify(data, null, 2);

    displayGraph();

    testDfa();
    testFinite();

    testWords();
    testCustomWord();

    displayAllAcceptedStrings();
  }
}

async function updateDfa() {
  if (dfaElem.checked) graph.dfa = new Graph(data, 'dfa');

  displayGraph();

  testDfa();
  testFinite();

  testWords();
  testCustomWord();

  displayAllAcceptedStrings();
}

async function readFileAsString() {
  const { files } = this;
  if (files.length >= 0) {
    const reader = new FileReader();
    reader.onload = (event) => {
      inputElem.value = event.target.result;
      readData();
      uploadElem.value = null;
      localStorage.setItem('customTemplates', { ...localStorage.getItem('customTemplates'), [files[0].name]: event.target.result });
      document.querySelector(`input[name="template"][value="${files[0].name}"]`).checked = true;
    };
    reader.readAsText(files[0]);
  }
}

async function openTemplate() {
  inputElem.value = templates[document.querySelector('input[name="template"]:checked').value];
  readData();
}

readData();

inputElem.addEventListener('input', readData);
uploadElem.addEventListener('change', readFileAsString);
selectTemplateElem.addEventListener('change', openTemplate);
inputTestElem.addEventListener('input', testCustomWord);
simplifyElem.addEventListener('input', () => {
  localStorage.setItem('simplify', simplifyElem.checked);
  if (!simplifyElem.checked) dfaElem.checked = false;
  localStorage.setItem('dfa', dfaElem.checked);

  displayGraph();
});
dfaElem.addEventListener('input', () => {
  localStorage.setItem('dfa', dfaElem.checked);
  if (dfaElem.checked) simplifyElem.checked = true;
  localStorage.setItem('simplify', simplifyElem.checked);

  updateDfa();
});
