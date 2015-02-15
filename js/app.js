(function() {

  var closeForm                = document.getElementById('close-form'),
      closeWhatTypeInput       = document.getElementById('close-what-type'),
      closeWhereInput          = document.getElementById('close-where'),
      closeWhichRepoNamesInput = document.getElementById('close-which-repo-names'),
      closeWhichReposInput     = document.getElementById('close-which-repos'),
      openForm                 = document.getElementById('open-form'),
      openHowManyInput         = document.getElementById('open-how-many'),
      openMaxInput             = document.getElementById('open-max'),
      openSortedHowInput       = document.getElementById('open-sorted-how'),
      openWhatOrderInput       = document.getElementById('open-what-order'),
      openWhatTypeInput        = document.getElementById('open-what-type'),
      openWhereInput           = document.getElementById('open-where'),
      openWhichRepoNamesInput  = document.getElementById('open-which-repo-names'),
      openWhichUsernamesInput  = document.getElementById('open-which-usernames'),
      openWhichUsersInput      = document.getElementById('open-which-users'),
      inputsToBeSaved          = [
        openHowManyInput,
        openMaxInput,
        openWhatTypeInput,
        openWhereInput,
        openWhichUsersInput,
        openSortedHowInput,
        openWhatOrderInput,
        openWhichUsernamesInput,
        openWhichRepoNamesInput,
        closeWhatTypeInput,
        closeWhichReposInput,
        closeWhichRepoNamesInput,
        closeWhereInput,
      ],
      INPUTS_NEEDING_CLARIFICATION = [
        openHowManyInput,
        openWhichUsersInput,
        closeWhichReposInput,
      ],
      SELECTIONS_THAT_ENABLE_INPUTS = [
        'at most',
        'specific',
      ];

  inputsToBeSaved.map(function(input) {
    var saveInputOnEvent = 'change';
    if (input.type === 'text') {
      saveInputOnEvent = 'keyup';
    }

    // back up important values when they change
    input.addEventListener(saveInputOnEvent, function() {
      localStorage.setItem(this.id, this.value);
    });
  });

  NodeList.prototype.map = Array.prototype.map;
  document.querySelectorAll('form').map(function(form) {
    form.addEventListener('reset', function() {
      // remove a form's saved inputs from localStorage
      this.querySelectorAll('input, select').map(function(input) {
        localStorage.removeItem(input.id);

        if (input.type === 'select-one') {
          input.selectedIndex = 0;
        }

        // hide all clarification inputs in this form
        // (they clarify the previous input when its choice is ambiguous)
        if (-1 !== INPUTS_NEEDING_CLARIFICATION.indexOf(input)) {
          if (-1 !== SELECTIONS_THAT_ENABLE_INPUTS.indexOf(input.value)) {
            showClarifyingInput(input.nextElementSibling);
          } else {
            hideClarifyingInput(input.nextElementSibling);
          }
        }
      });
    });
  });

  // restore previous form values when the plugin is reopened
  inputsToBeSaved.map(function(input) {
    var savedValue = localStorage.getItem(input.id);

    if (savedValue !== null) {
      input.value = localStorage.getItem(input.id);
    }
  });

  INPUTS_NEEDING_CLARIFICATION.map(function(input) {
    if (-1 !== SELECTIONS_THAT_ENABLE_INPUTS.indexOf(input.value)) {
      showClarifyingInput(input.nextElementSibling);
    } else {
      hideClarifyingInput(input.nextElementSibling);
    }

    input.addEventListener('change', function() {
      if (-1 !== SELECTIONS_THAT_ENABLE_INPUTS.indexOf(this.value)) {
        showClarifyingInput(this.nextElementSibling);
      } else {
        hideClarifyingInput(this.nextElementSibling);
      }
    });
  });

  openForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var usernames     = openWhichUsersInput.value !== 'any' &&
                          openWhichUsernamesInput.value.replace(/\s+/g, '').split(','),
        repos         = openWhichRepoNamesInput.value.replace(/\s+/g, '').split(','),
        type          = openWhatTypeInput.value.match(/pull requests|issues/)[0],
        possibleState = openWhatTypeInput.value.match(/open|closed/),
        state         = (possibleState && possibleState[0] || 'all'),
        sortBy        = openSortedHowInput.value,
        sortOrder     = openWhatOrderInput.value,
        githubLinks   = getLinksFor(usernames, repos, type, state, sortBy, sortOrder),
        openMax       = parseInt(openMaxInput.value);

    if (openHowManyInput.value === 'at most' && !isNaN(openMax)) {
      githubLinks = githubLinks.slice(0, openMax);
    }

    if (githubLinks.length > 0) {
      if (openWhereInput.value === 'in a new window') {
        openLinksInNewWindow(githubLinks);
      } else {
        openLinksInCurrentWindow(githubLinks);
      }
    }
  });

  function showClarifyingInput(input) {
    input.required = true;
    input.style.display = '';
  }

  function hideClarifyingInput(input) {
    input.style.display = 'none';
    input.required = false;
  }

  function getLinksFor(users, repos, type, state, sort, direction) {
    var issuesOrPulls = [],
        successHandler = function() {
          if (this.status === 200) {
            var response = JSON.parse(this.response);

            response.map(function(issueOrPull) {
              if (users instanceof Array && users.length > 0) {
                // only add this issue or pull request to the results list if it
                // matches one of the desired users)
                if (-1 !== users.indexOf(issueOrPull.user.login)) {
                  issuesOrPulls.push(issueOrPull.html_url);
                }
              } else {
                issuesOrPulls.push(issueOrPull.html_url);
              }
            });
          }
        };

    for (var index in repos) {
      if (repos.hasOwnProperty(index)) {
        var userSlashRepo = repos[index];

        ghListIssuesOrPulls(type === 'pull requests' ? 'pulls' : 'issues',
                            userSlashRepo,
                            state,
                            sort,
                            direction,
                            successHandler);
      }
    }

    return issuesOrPulls;
  }

  function closeTabsMatching(repos, currentWindowOrAll) {
    var urlPrefix = 'https://github.com/',
        urlType   = closeWhatTypeInput.value;

    switch (urlType) {
      // only GitHub pull request URLs
      case 'pull request':
        if (closeWhichReposInput.value === 'any') {
          repos = [/https:\/\/github.com\/([^\/]+\/){2}pull\/\d+/];
        } else {
          repos = repos.map(function(repo) {
            return new RegExp(urlPrefix + repo + '/pull/' + '\\d+');
          });
        }
        break;
      // only GitHub issue URLs
      case 'issue':
        if (closeWhichReposInput.value === 'any') {
          repos = [/https:\/\/github.com\/([^\/]+\/){2}issues\/\d+/];
        } else {
          repos = repos.map(function(repo) {
            return new RegExp(urlPrefix + repo + '/issues/' + '\\d+');
          });
        }
        break;
      // any GitHub URL
      case 'all':
        if (closeWhichReposInput.value === 'any') {
          repos = [/https?:\/\/github\.com/];
        } else {
          repos = repos.map(function(repo) {
            return new RegExp(urlPrefix + repo);
          });
        }
    }

    if (currentWindowOrAll === 'current window') {
      closeTabsInWindowMatching(repos);
    } else {
      chrome.windows.getAll(function(windows) {
        windows.map(function(w) {
          closeTabsInWindowMatching(repos, w.id);
        });
      });
    }
  }

  function closeTabsInWindowMatching(urlRegexes, windowId) {
    chrome.tabs.getAllInWindow(windowId, function(tabs) {
      tabs.map(function(tab) {
        urlRegexes.map(function(regexp) {
          if (this.url.match(regexp)) {
            chrome.tabs.remove(this.id);
          }
        }, tab);
      });
    });
  }

  closeForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var reposToClose =
          closeWhichRepoNamesInput.value.replace(/\s+/g, '').split(','),
        currentWindowOrAll = closeWhereInput.value;

    closeTabsMatching(reposToClose, currentWindowOrAll);
  });

  function openLinksInNewWindow(links) {
    chrome.windows.create({url: links});
  }

  function openLinksInCurrentWindow(links) {
    links.map(function(link) {
      chrome.tabs.create({url: link});
    });
  }

  // see https://developer.github.com/v3/pulls/#list-pull-requests
  // for more info about the parameters the issue/pulls endpoints take
  function ghListIssuesOrPulls(issuesOrPulls,
                               userSlashRepo,
                               state,
                               sort,
                               direction,
                               successHandler) {
    var path    = '/repos/' + userSlashRepo + '/' + issuesOrPulls +
                   '?state=' + state + '&sort=' + sort + '&direction=' + direction,
        headers = { Accept: 'application/vnd.github.v3+json' };

    for (var id in localStorage) {
      if (localStorage.hasOwnProperty(id)) {
        var firstCharacter = id.substr(0, 1),
            numericalID    = parseInt(id.substr(1));

        if (firstCharacter === 'u' || firstCharacter === 't') {
          var domain      = localStorage.getItem('u' + numericalID) || 'https://api.github.com',
              accessToken = localStorage.getItem('t' + numericalID);

          if (accessToken !== null && accessToken.length > 0) {
            headers.Authorization = 'token ' + accessToken;
          }

          httpGet(domain + path, successHandler, headers);
        }
      }
    }
  }

  function httpGet(url, successHandler, httpHeaders) {
    var r = new XMLHttpRequest();
    r.addEventListener('load', successHandler);

    r.open('get', url, false);

    if (httpHeaders) {
      for (var key in httpHeaders) {
        if (httpHeaders.hasOwnProperty(key)) {
          r.setRequestHeader(key, httpHeaders[key]);
        }
      }
    }

    try { r.send(null); } catch(e) {}
  }

})();
