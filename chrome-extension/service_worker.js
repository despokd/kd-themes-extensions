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
    response.themes.forEach((theme) => {
      theme.files.forEach((file) => {
        fetch(file)
          .then((response) => response.text())
          .then((css) => {
            theme.css = css;
          })
          .catch((error) => {
            console.error('Can`t get theme styles', error);
          });
      });
    });

    // save themes to storage
    chrome.storage.sync.set({ themes: response.themes });
  });

  injectStyles();
}


/**
 * Fetch themes from external source
 */
async function getThemes() {
  console.log('getThemes');
  // fetch themes JSON file from hosted repo:
  const [themes] = await Promise.all([
    fetch('https://raw.githubusercontent.com/despokd/kd-themes-extensions/main/themes/themes.json')
  ]);

  const themesJson = await themes.json();

  return [themesJson];
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

    chrome.storage.sync.get(["themes"], (resultT) => {
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