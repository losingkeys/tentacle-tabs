(function() {

  NodeList.prototype.map = Array.prototype.map;

  function backupInputOnKeyUp() {
    localStorage.setItem(this.id, this.value);
  }

  // 'this' should be the "Remove" button
  function removeUrlTokenPair() {
    var container = this.parentElement
        id        = parseInt(container.querySelector('.github-url').getAttribute('id').substr(1));

    localStorage.removeItem('t' + id);
    localStorage.removeItem('u' + id);

    this.parentElement.remove();
  }

  function addUrlAndTokenInputsToDom(containerOrId) {
    var container,
        urlsAndTokensList = document.getElementById('urls-and-access-tokens');

    // generate inputs if none are given
    if (typeof containerOrId === 'number') {
      container = generateUrlAndTokenInputs(containerOrId);
    }
    else if (!(containerOrId instanceof Element)) {
      console.log('not an element');
      container = generateUrlAndTokenInputs();
    }

    urlsAndTokensList.appendChild(container);

    container.querySelector('.github-url').addEventListener('keyup', backupInputOnKeyUp);
    container.querySelector('.access-token').addEventListener('keyup', backupInputOnKeyUp);
    container.querySelector('.remove').addEventListener('click', removeUrlTokenPair);
  }

  document.getElementById('add').addEventListener('click', addUrlAndTokenInputsToDom);

  for (var id in localStorage) {
    if (localStorage.hasOwnProperty(id)) {
      var firstCharacter = id.substr(0, 1);

      if (firstCharacter === 'u' || firstCharacter === 't') {
        // don't add the url/token inputs twice
        if (document.getElementById(id) === null) {
          addUrlAndTokenInputsToDom(parseInt(id.substr(1)));
        } else {
          document.getElementById(id).setAttribute('value', localStorage.getItem(id));
        }
      }
    }
  }

  document.querySelectorAll('.access-token, .github-url').map(function(input) {
    input.addEventListener('keyup', backupInputOnKeyUp);
  });

  document.querySelectorAll('.remove').map(function(button) {
    button.addEventListener('click', removeUrlTokenPair);
  });

  function generateUrlAndTokenInputs(id) {
    var accessToken  = document.createElement('input'),
        container    = document.createElement('li'),
        githubUrl    = document.createElement('input'),
        removeButton = document.createElement('button'),
        values       = { token: null, url: null };

    removeButton.appendChild(document.createTextNode('Remove'));
    removeButton.setAttribute('class', 'remove');

    if (typeof id === 'undefined') {
      id = 0;

      // get a new ID
      document.querySelectorAll('.github-url').map(function(input) {
        var someId = parseInt(input.getAttribute('id').substr(1));

        if (typeof someId !== 'undefined' && someId > id) {
          id = someId;
        }
      });

      // the new id is 1 larger than the largest existing ID
      ++id;
    } else { // it's an existing id. get the values from localStorage
      values.token = localStorage.getItem('t' + id);
      values.url = localStorage.getItem('u' + id);
    }

    accessToken.setAttribute('class', 'access-token');
    accessToken.setAttribute('spellcheck', false);
    accessToken.setAttribute('size', 41);
    accessToken.setAttribute('placeholder', 'aaabbbcccdddeeefff1122334455667788990000');
    accessToken.setAttribute('id', 't' + id);
    if (values.token !== null) {
      accessToken.setAttribute('value', values.token);
    }

    githubUrl.setAttribute('class', 'github-url');
    githubUrl.setAttribute('type', 'url');
    githubUrl.setAttribute('spellcheck', false);
    githubUrl.setAttribute('size', 41);
    githubUrl.setAttribute('placeholder', 'https://github.com/');
    githubUrl.setAttribute('id', 'u' + id);
    if (values.url !== null) {
      githubUrl.setAttribute('value', values.url);
    }

    container.appendChild(githubUrl);
    container.appendChild(document.createTextNode(': '));
    container.appendChild(accessToken);
    container.appendChild(document.createTextNode(' '));
    container.appendChild(removeButton);

    return container;
  }

})();
