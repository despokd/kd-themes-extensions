const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

init();

chrome.runtime.onStartup.addListener(() => {
  init();
  console.debug('onStartup', chrome.runtime);
});

chrome.runtime.onInstalled.addListener(() => {
  init();
  console.debug('onInstalled', chrome.runtime);

  chrome.webNavigation.onCommitted.addListener(() => {
    init();
    console.debug('webNavigation', chrome.webNavigation);
  });
});

function init() {
  // get themes from external source
  getThemes().then(([response]) => {
    // get css out of urls
    console.debug('response', response);
    const fetchPromises = [];
    response.themes.forEach((theme) => {
      theme.css = '';
      theme.files.forEach((file) => {
        const promise = getCachedOrFetch(file)
          .then((css) => {
            theme.css += css;
          })
          .catch((error) => {
            console.error('Can`t get theme styles', error);
          });
        fetchPromises.push(promise);
      });
    });

    // save themes to local storage after all CSS is fetched
    Promise.all(fetchPromises).then(() => {
      chrome.storage.local.set({ themes: response.themes });
    });
  });

  injectStyles();
}

/**
 * Fetch a URL or return from local cache if still valid (within CACHE_DURATION)
 */
function getCachedOrFetch(url) {
  return new Promise((resolve, reject) => {
    const cacheKey = 'cssCache_' + url;
    chrome.storage.local.get([cacheKey], (result) => {
      const cached = result[cacheKey];
      if (cached && cached.cachedAt && (Date.now() - cached.cachedAt) < CACHE_DURATION) {
        resolve(cached.css);
      } else {
        fetch(url)
          .then((response) => response.text())
          .then((css) => {
            chrome.storage.local.set({ [cacheKey]: { css, cachedAt: Date.now() } });
            resolve(css);
          })
          .catch(reject);
      }
    });
  });
}

/**
 * Fetch themes from external source or return from local cache if still valid
 */
function getThemes() {
  console.log('getThemes');
  return new Promise((resolve) => {
    chrome.storage.local.get(['themesJson', 'themesJsonCachedAt'], (result) => {
      if (result.themesJson && result.themesJsonCachedAt &&
          (Date.now() - result.themesJsonCachedAt) < CACHE_DURATION) {
        resolve([result.themesJson]);
      } else {
        // fetch themes JSON file from hosted repo:
        fetch('https://raw.githubusercontent.com/despokd/kd-themes-extensions/main/themes/themes.json')
          .then((response) => response.json())
          .then((json) => {
            chrome.storage.local.set({ themesJson: json, themesJsonCachedAt: Date.now() });
            resolve([json]);
          });
      }
    });
  });
}

/**
 * Inject content script to all tabs
 */
function insertContentScript() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (!tab.url) return;
      if (!tab.url.match('http://') && !tab.url.match('https://')) return;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    });
  });
}

/**
 * Inject styles of active themes
 */
function injectStyles() {
  chrome.storage.sync.get(["activeThemes"], (resultAT) => {
    if (!resultAT.activeThemes) return;

    chrome.storage.local.get(["themes"], (resultT) => {
      if (!resultT.themes) return;

      resultAT.activeThemes.forEach((activeTheme) => {
        const theme = resultT.themes.find(theme => theme.key === activeTheme)
        if (!theme) return;

        theme.urls.forEach((url) => {
          chrome.tabs.query({ url }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                css: theme.css ?? 'body::after { content: "No CSS found"; }'
              });
            });
          });
        });
      });
    });
  });
}