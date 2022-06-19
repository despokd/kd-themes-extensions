//window.onloadstart = () => {
checkThemes();


/**
 * React to commands from content/popup script
 */
chrome.runtime.onMessage.addListener((request) => {
    console.log(`Received command: ${request.cmd}`, request);
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
    console.log('checkThemes');
    chrome.storage.sync.get(["activeThemes"], (result) => {
        console.log('activeThemes', result);
        if (result.activeThemes) {
            result.activeThemes.forEach((theme) => {
                activateTheme(theme);
            });
        }
    }).catch(error => {
        console.error(error);
    });
}

/**
 * Inject stylesheet
 */
function activateTheme(theme) {
    console.log(`Injecting stylesheet for ${theme}`);
    // search theme in storage
    chrome.storage.sync.get(["themes"], (result) => {
        if (result.themes) {
            try {
                result.themes.forEach((availableTheme) => {
                    console.log(`Available theme: ${availableTheme.key}`);

                    if (availableTheme.key === theme) {
                        // check if theme is for current page
                        availableTheme.urls.forEach((url) => {
                            console.log(`Checking ${url}`, window.location.href.match(url));

                            if (window.location.href.match(url).length > 0 && !document.getElementById(`KD${theme}`)) {
                                // add stylesheets
                                availableTheme.files.forEach((file) => {
                                    console.log(`Injecting stylesheet for ${url}`);
                                    const link = document.createElement("link");
                                    link.id = `KD${theme}`;
                                    link.rel = 'stylesheet';
                                    link.type = 'text/css';
                                    link.media = 'all';
                                    link.href = file + '?v=' + Date.now();
                                    document.head.appendChild(link);
                                    console.log('link', link);
                                });
                            }
                        });

                        // add theme to active themes in storage
                        chrome.storage.sync.get("activeThemes", (result) => {
                            if (result.activeThemes) {
                                result.activeThemes.push(theme);
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
            const index = result.activeThemes.indexOf(theme);
            if (index > -1) {
                result.activeThemes.splice(index, 1);
            }
            console.log('activeThemes', result.activeThemes);
            chrome.storage.sync.set({ activeThemes: result.activeThemes }, () => { });
        }
    });
}