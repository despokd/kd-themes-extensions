document.addEventListener("DOMContentLoaded", () => {

  // add event listeners
  const themeToggles = document.querySelectorAll(".toggle-theme");

  themeToggles.forEach((toggle) => {
    // check if theme is active
    chrome.storage.sync.get(["theme"], (result) => {
      console.log("result", result);
      if (result.theme === toggle.value) {
        toggle.checked = true;
        toggleTheme(toggle.value, true);
      }
    });

    // add event listeners
    toggle.addEventListener("click", (event) => {
      if (event.target.checked) {
        toggleTheme(event.target.value, true);
      } else {
        toggleTheme(event.target.value, false);
      }
    });
  });
});

function toggleTheme(theme, activate = true) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      chrome.tabs.sendMessage(tabs[0].id, {
        cmd: activate ? "activateTheme" : "deactivateTheme",
        theme
      });
    } catch (error) {
      console.error('toggl', error);
    }
  });
}

function checkThemes() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      chrome.tabs.sendMessage(tabs[0].id, { cmd: "checkThemes" }, () => { });
    } catch (error) {
      console.error('check', error);
    }
  });
}
