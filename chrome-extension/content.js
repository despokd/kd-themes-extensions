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
        default:
            console.log(`Unknown command: ${request.cmd}`);
    }
});

/**
 * Inject stylesheet
 */
function activateTheme(theme) {
    console.log(`Injecting stylesheet for ${theme}`);
    // search theme in storage
    chrome.storage.sync.get(["themes"], (result) => {
        if (result.themes) {
            try {
                result.themes.forEach((savedTheme) => {
                    console.log(`Saved theme: ${savedTheme.key}`);

                    if (savedTheme.key === theme) {
                        // check if theme is for current page
                        savedTheme.urls.forEach((url) => {

                            if (window.location.href.match(url).length > 0) {
                                // add stylesheets
                                savedTheme.files.forEach((file) => {
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
                        chrome.storage.get(["activeThemes"], (result) => {
                            if (result.activeThemes) {
                                result.activeThemes.push(theme);
                            } else {
                                result.activeThemes = [theme];
                            }
                            chrome.storage.set({ activeThemes: result.activeThemes }, () => { });
                        }).catch(error => {
                            console.error(error);
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
    chrome.storage.get(["activeThemes"], (result) => {
        if (result.activeThemes) {
            const index = result.activeThemes.indexOf(theme);
            if (index > -1) {
                result.activeThemes.splice(index, 1);
            }
            chrome.storage.set({ activeThemes: result.activeThemes }, () => { });
        }
    }).catch(error => {
        console.error(error);
    });
}