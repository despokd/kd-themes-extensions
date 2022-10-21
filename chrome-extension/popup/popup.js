document.addEventListener("DOMContentLoaded", () => {
  createToggles();
});

/**
 * Create toggle buttons from themes in storage
 */
function createToggles() {
  chrome.storage.sync.get(["themes"], (result) => {
    if (result.themes) {
      result.themes.forEach((theme) => {

        // create wrapper
        const wrapper = document.createElement("div");
        wrapper.classList.add("form-check");

        // create toggle button
        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.name = "theme";
        toggle.value = theme.key;
        toggle.id = theme.key;
        toggle.classList.add("form-check-input");
        toggle.classList.add("toggle-theme");

        // create label
        const label = document.createElement("label");
        label.innerText = theme.name;
        label.htmlFor = theme.key;
        label.classList.add("form-check-label");

        // append elements
        wrapper.appendChild(toggle);
        wrapper.appendChild(label);
        document.querySelector("[data-themes]").appendChild(wrapper);
      });

      // bind toggles
      bindToggles();
    }
  });
}

/**
 * Bind toggles to themes
 */
function bindToggles() {
  const themeToggles = document.querySelectorAll(".toggle-theme");

  // check if theme is in active themes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    Object.keys(tabs).forEach((key) => {
      chrome.tabs.sendMessage(tabs[key].id, { cmd: 'checkThemes' }, () => { });
    })
  });

  themeToggles.forEach((toggle) => {
    // bind toggle to theme
    toggle.addEventListener("change", () => {
      toggleTheme(toggle.value, toggle.checked);
    });

    chrome.storage.sync.get(["activeThemes"], (result) => {
      console.debug("activeThemes", result.activeThemes);
      if (result.activeThemes) {
        toggle.checked = result.activeThemes.includes(toggle.value);
      }
    });
  });
}

/**
 * Activate/Deactivate theme based value at content.js
 * 
 * @param {*} theme 
 * @param {*} activate 
 */
function toggleTheme(theme, activate = true) {
  console.log('toggleTheme', theme, activate);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    Object.keys(tabs).forEach((key) => {
      chrome.tabs.sendMessage(tabs[key].id, { cmd: activate ? "activateTheme" : "deactivateTheme", theme: theme });
    });
  });
}