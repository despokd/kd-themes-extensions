/**
 * Get themes when extension is installed and every 24 hours
 */
chrome.runtime.onInstalled.addListener(() => {
  getThemes();
  setInterval(getThemes, 86400000);
});

/**
 * Fetch themes from external source
 */
function getThemes() {
  // fetch themes JSON file from hosted repo:
  fetch('https://raw.githubusercontent.com/despokd/kd-themes-extensions/main/themes/themes.json')
    .then(res => res.json())
    .then(out => {
      // clear old themes
      chrome.storage.sync.set({ themes: null }, () => { });

      // save themes in storage
      chrome.storage.sync.set({ themes: out.themes }, () => { });

      // insert content script to all themes sites
      insertContentScript();
    }).catch(err => {
      console.error(err);
    });
}

function insertContentScript() {
  // apply content script to all tabs
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

function checkThemes() {
  // send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      chrome.tabs.sendMessage(tabs[0].id, {
        cmd: "checkThemes"
      });
    } catch (error) {
      console.error('toggl', error);
    }
  });
}
