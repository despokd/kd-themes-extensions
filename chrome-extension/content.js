/**
 * React to commands from content/popup script
 */
chrome.runtime.onMessage.addListener((request) => {
    switch (request.cmd) {
        case "activateTheme":
            injectStylesheet('test');
            break;
        case "deactivateTheme":
            removeStylesheet('test');
            break;
        case "checkThemes":
            chrome.storage.sync.get(["theme"], (result) => {
                if (result.theme) {
                    injectStylesheet(result.theme);
                }
            });
            break;
        default:
            console.debug(`Unknown command: ${request.cmd}`);
    }
});

/**
 * Inject stylesheet
 */
function injectStylesheet(theme) {
    // check if stylesheet already exists
    let link = document.getElementById(`KD${theme}`);
    if (link) {
        return;
    }

    // create stylesheet tag
    const url = `https://pm.webneo.de/themes/${theme}.css`;
    link = document.createElement("link");
    link.id = `KD${theme}`;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;

    // inject stylesheet
    document.getElementsByTagName("head")[0].appendChild(link);

    // save theme in storage
    chrome.storage.sync.set({ theme }, () => { });
}

/**
 * Remove stylesheet
 */
function removeStylesheet(theme) {
    const link = document.getElementById(`KD${theme}`);
    if (link) {
        link.remove();
    }

    // remove theme from storage
    chrome.storage.sync.set({ theme: '' }, () => { });
}