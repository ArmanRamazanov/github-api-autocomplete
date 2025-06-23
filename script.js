import { Octokit } from "https://esm.sh/octokit"


const octokit = new Octokit({})

const inputBox = document.getElementById('input-box');
const repositoryTemplate = document.querySelector('.repo-template').content.querySelector('div');
const reposList = document.querySelector('.main__card-repository-list > ul')
const searchSuggestionsResult = document.querySelector('.main__card-repository-search-results > ul');

function debounce(fn, debounceTime) {
  let setTimeoutId;
  return function(...args) {
    if(setTimeout) clearTimeout(setTimeoutId);
    setTimeoutId = setTimeout(() => fn.apply(this, args), debounceTime);
  }
}

async function getResponse() {
  if(inputBox.value) {
    const inputBoxValue = inputBox.value;
    const q = encodeURIComponent(inputBoxValue) + ' in:name';
    const result = await octokit.request('GET /search/repositories', {
      headers: {
        'Accept' : 'application/vnd.github.json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      q
    })
    return result;
  }
}

function renderResults() {
  getResponse().then(
    result => {
      if(searchSuggestionsResult.children.length) {
        Array.from(searchSuggestionsResult.children).forEach(suggestion => suggestion.remove());
      }
      if(inputBox.value) {
        let filteredResult = result.data.items.slice(0, 5);

        const listItems = filteredResult.map(repo => createSuggestion(repo));
        listItems.forEach(listItem => searchSuggestionsResult.append(listItem));
      }
  })
}

const createRepoFunction = createRepo();

function createSuggestion(repository) {
  const suggestion = document.createElement('li');
  const suggestionText = document.createElement('p');
  suggestionText.textContent = repository.name;
  suggestion.addEventListener('click', () => {
    createRepoFunction.call(null, repository);
    inputBox.value = "";
    Array.from(searchSuggestionsResult.children).forEach(suggestion => suggestion.remove());
  });
  suggestion.append(suggestionText);
  suggestion.style.backgroundColor = 'white';
  suggestion.style.listStyle = 'none';
  suggestion.style.border = '1px solid black';
  suggestionText.style.overflow = 'hidden';
  suggestion.onmouseover = () => {
    suggestion.style.backgroundColor = '#65CDF9';
    suggestion.style.cursor = 'pointer';
  }
  suggestion.onmouseout = () => {
    suggestion.style.backgroundColor = 'white'
  }
  return suggestion;
}

function createRepo() {
  let obj = {};
  return function(repository) {
    console.log(repository)
    console.log(obj);
    if(obj.hasOwnProperty(repository.id)) {
      alert('it was already added')
    } else {
      obj[repository.id] = repository.name;
      console.log(obj);
      const repoTemplate = repositoryTemplate.cloneNode(true);
      repoTemplate.dataset.id = repository.id;
      const repoTemplateInfo = repoTemplate.querySelector('.repository__info');
      const repoTemplateDeleteButton = repoTemplate.querySelector('.repository__delete-btn')
      const repoTemplateInfoParagraphs = repoTemplateInfo.querySelectorAll('p');
      const repoItem = document.createElement('li');
      
      repoTemplateInfoParagraphs.forEach((paragraph) => {
        if(paragraph.dataset.name === 'name') {
          paragraph.textContent = repository.name;
        }
    
        if(paragraph.dataset.name === 'owner') {
          paragraph.textContent = repository.owner['login'];
        }
    
        if(paragraph.dataset.name === 'stars') {
          paragraph.textContent = repository.stargazers_count;
        }
      })
    
      repoItem.append(repoTemplate);
      repoItem.style.listStyle = 'none'
      reposList.append(repoItem);
      repoTemplateDeleteButton.addEventListener('click', (e) => {
        e.currentTarget.parentNode.remove();
        let id = e.currentTarget.parentNode.dataset.id;
        delete obj[id];
      })
    }
}
}

const renderDebounce = debounce(renderResults, 200);
inputBox.addEventListener('keyup', renderDebounce);
