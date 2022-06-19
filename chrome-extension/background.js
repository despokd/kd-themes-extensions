// fetch themes JSON file from hosted repo:
fetch('https://raw.githubusercontent.com/despokd/kd-themes-extensions/main/themes/themes.json')
  .then(res => res.json())
  .then(out => {
    // clear old themes
    chrome.storage.sync.set({ themes: null }, () => { });

    // save themes in storage
    chrome.storage.sync.set({ themes: out.themes }, () => { });
  }).catch(err => {
    console.error(err);
  });

// apply content script to all themes sites
chrome.storage.sync.get(["themes"], (result) => {
  if (result.themes) {
    try {
      result.themes.forEach((theme) => {
        theme.urls.forEach((url) => {
          chrome.tabs.query({ url }, (tabs) => {
            console.log(`Injecting content script to ${url}`);
            if (tabs.length > 0) {
              console.log(`Injecting content script to ${url}`);
              chrome.tabs.executeScript(tabs[0].id, {
                file: "content.js"
              });
            }
          });
        });
      });
    } catch (error) {
      console.error(error);
    }
  }
});

chrome.webNavigation.onCompleted.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { cmd: "checkThemes" }, () => { });
  });
});