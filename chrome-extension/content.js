//window.onloadstart = () => {
checkThemes();


/**
 * React to commands from content/popup script
 */
chrome.runtime.onMessage.addListener((request) => {
    switch (request.cmd) {
        case "activateTheme":
            activateTheme(request.theme);
            break;
        case "deactivateTheme":
            deactivateTheme(request.theme);
            break;
        case "checkThemes":
            checkThemes();
            break;
        default:
            console.log(`Unknown command: ${request.cmd}`);
    }
});

/**
 * Check active themes on page load and add stylesheet
 */
function checkThemes() {
    chrome.storage.sync.get(["activeThemes"], (result) => {
        if (result.activeThemes) {
            // remove duplicates
            result.activeThemes = result.activeThemes.filter((item, index) => result.activeThemes.indexOf(item) === index);

            // activate themes
            result.activeThemes.forEach((theme) => {
                activateTheme(theme);
            });
        }
    });
}

/**
 * Inject stylesheet
 */
function activateTheme(theme) {
    // search theme in storage
    chrome.storage.sync.get(["themes"], (result) => {
        if (result.themes) {
            try {
                result.themes.forEach((availableTheme) => {
                    if (availableTheme.key === theme) {
                        // check if theme is for current page
                        availableTheme.urls.forEach((url) => {
                            if (window.location.href.match(url).length > 0 && !document.getElementById(`KD${theme}`)) {
                                // add stylesheets
                                let style = document.createElement('style');
                                style.id = `KD${theme}`;
                                availableTheme.files.forEach((file) => {
                                    // get content of file
                                    fetch(file)
                                        .then(res => res.text())
                                        .then(out => {
                                            // add css
                                            style.innerHTML += out;
                                        });
                                });
                                document.body.appendChild(style);
                            }
                        });

                        // add theme to active themes in storage
                        chrome.storage.sync.get("activeThemes", (result) => {
                            if (result.activeThemes) {
                                if (result.activeThemes.indexOf(theme) === -1) {
                                    result.activeThemes.push(theme);
                                }
                            } else {
                                result.activeThemes = [theme];
                            }
                            chrome.storage.sync.set({ activeThemes: result.activeThemes }, () => { });
                        });
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    });
}

/**
 * Remove stylesheet
 */
function deactivateTheme(theme) {
    const link = document.getElementById(`KD${theme}`);
    if (link) {
        link.remove();
    }

    // remove theme from active themes in storage
    chrome.storage.sync.get(["activeThemes"], (result) => {
        if (result.activeThemes) {
            // delete all entries of theme
            let activeThemes = result.activeThemes.filter((item) => item !== theme);
            chrome.storage.sync.set({ activeThemes }, () => { });;
        }
    });
}