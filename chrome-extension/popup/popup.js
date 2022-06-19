document.addEventListener("DOMContentLoaded", () => {
  createToggles();
  console.log(new Date().toLocaleTimeString());
});

window.addEventListener("load", () => {
  bindToggles();
  console.log(new Date().toLocaleTimeString());
});

/**
 * Activate/Deactivate theme based value
 * 
 * @param {*} theme 
 * @param {*} activate 
 */
function toggleTheme(theme, activate = true) {
  console.log('toggleTheme', theme, activate);
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

/**
 * Create toggle buttons from themes in storage
 */
function createToggles() {
  chrome.storage.sync.get(["themes"], (result) => {
    if (result.themes) {
      try {
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
          document.querySelector(".themes").appendChild(wrapper);
        });
      } catch (error) {
        console.error(error);
      }

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


  themeToggles.forEach((toggle) => {
    // bind toggle to theme
    toggle.addEventListener("change", () => {
      toggleTheme(toggle.value, toggle.checked);
    });

    // check if theme is in active themes
    chrome.storage.sync.get(["activeThemes"], (result) => {
      console.log('activeThemes', result, toggle.checked, result.activeThemes.includes(toggle.value));
      if (result.activeThemes.includes(toggle.value)) {
        toggle.checked = true;
      }
    });
  });
}