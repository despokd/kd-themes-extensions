const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

checkThemes();

/**
 * React to commands from content/popup script
 */
chrome.runtime.onMessage.addListener((request) => {
    console.log('Theme request', request);

    if (request.cmd === 'activateTheme') activateTheme(request.theme);
    if (request.cmd === 'deactivateTheme') deactivateTheme(request.theme);
    if (request.cmd === 'checkThemes') checkThemes();
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
 * Fetch a URL or return from local cache if still valid (within CACHE_DURATION)
 */
function getCachedOrFetch(url) {
    return new Promise((resolve, reject) => {
        const cacheKey = 'cssCache_' + url;
        chrome.storage.local.get([cacheKey], (result) => {
            const cached = result[cacheKey];
            if (cached && cached.cachedAt && (Date.now() - cached.cachedAt) < CACHE_DURATION) {
                resolve(cached.css);
            } else {
                fetch(url)
                    .then((res) => res.text())
                    .then((css) => {
                        chrome.storage.local.set({ [cacheKey]: { css, cachedAt: Date.now() } });
                        resolve(css);
                    })
                    .catch(reject);
            }
        });
    });
}

/**
 * Inject stylesheet
 */
function activateTheme(theme) {
    // search theme in storage
    chrome.storage.local.get(["themes"], (result) => {
        if (result.themes) {
            result.themes.forEach((availableTheme) => {
                if (availableTheme.key === theme) {
                    // check if theme is for current page
                    availableTheme.urls.forEach((url) => {
                        const regex = new RegExp(url);
                        if (regex.test(window.location.href) && !document.getElementById(`KD${theme}`)) {
                            // add stylesheets
                            let style = document.createElement('style');
                            style.id = `KD${theme}`;
                            const cssPromises = availableTheme.files.map((file) => {
                                // get content of file from cache or network
                                return getCachedOrFetch(file)
                                    .catch(error => {
                                        console.error('Can`t get theme styles', error);
                                        return '';
                                    });
                            });
                            // append style only after all CSS files are fetched
                            Promise.all(cssPromises).then((cssParts) => {
                                style.innerHTML = cssParts.join('');
                                document.body.appendChild(style);
                            });
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
            chrome.storage.sync.set({ activeThemes }, () => { });
        }
    });
}