// List of most used websites
let visitedWebsites = {};

// List of blocked websites
let blockedWebsites = {};

// Tncrement seconds condition
let condition = true;

// Websocket
let websocket = null;


// Load the previously stored visited websites data from storage
function loadVisitedWebsites() {
    chrome.storage.local.get('visitedWebsites', (result) => {
        if (result.visitedWebsites) {
            visitedWebsites = result.visitedWebsites;
        }
    });
}

// Load the previously stored blocked websites data from storage
function loadBlockedWebsites() {
    chrome.storage.local.get('blockedWebsites', (result) => {
        if (result.blockedWebsites) {
            blockedWebsites = result.blockedWebsites;
        }
    });
}

// Update the storage with the latest visited websites data
function UpdateStorage() {
    chrome.storage.local.set({ 'visitedWebsites': visitedWebsites });
    chrome.storage.local.set({ 'blockedWebsites': blockedWebsites });
}

// Update time spent for a given website
function updateTimeSpent(websiteName, timeSpent) {
    if (visitedWebsites.hasOwnProperty(websiteName)) {

        visitedWebsites[websiteName] += timeSpent;
    } else {
        visitedWebsites[websiteName] = timeSpent;
    }

    // Update storage
    UpdateStorage();
}


// Listener for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        tabHandler(tab);
    });
});

// Listener for tab Update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
        tabHandler(tab, tabId);
    }
});

// Determines the current website you are on and passes that to the timer
async function tabHandler(tabName, tabId) {
    // Reset timer condition
    condition = false;

    // Sleep for two seconds to let the timer stop
    await new Promise(resolve => setTimeout(resolve, 2000)); // Sleep 2 sec

    if (chrome.runtime.lastError) {
        // Handle potential errors when accessing tab information
        console.error(chrome.runtime.lastError.message);
        return;
    }
    if (!tabName.url.startsWith("http")) return; // Ignore non-web pages

    const url = new URL(tabName.url);
    const websiteName = url.hostname;

    if (websiteName === "www.time-shield.com") return; // White list the time-shield page

    Object.keys(blockedWebsites).forEach((value) => {
        console.log(value); // Log the key
        if (websiteName === value){
            chrome.tabs.update(tabId, {url: "https://www.time-shield.com/blocked.html"});
            return;
        }
    });

    // Update local storage
    UpdateStorage();


    condition = true;
    timer(websiteName);

}

// Timer for how long you've spent on a website
async function timer(websiteName) {
    while (condition) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep 1 sec
        updateTimeSpent(websiteName, 1);
    }
}

// Messaging system for extension
async function startMessager() {
    while (true) {
        if (websocket === null || websocket.readyState === WebSocket.CLOSED) {
            websocket = new WebSocket('ws://localhost:8080');
        }

        if (websocket) {
            websocket.onmessage = function(event) {
                blockedWebsites = {};
                let parts = event.data.split(',');
                parts.forEach((part) => {
                    blockedWebsites[part] = true;
                });
            };
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep 5 sec

        if (websocket.readyState === WebSocket.OPEN) {
            
            let entries = Object.entries(visitedWebsites);
            entries.sort((a, b) => b[1] - a[1]);
            let topFiveEntries = entries.slice(0, 5);
            let topFiveWebsites = Object.fromEntries(topFiveEntries);

            // Convert the visitedWebsites object into a JSON string
            let visitedWebsitesString = JSON.stringify(topFiveWebsites);
            websocket.send(visitedWebsitesString);
        }
        else{
            // Init web socket
            websocket = new WebSocket('ws://localhost:8080');
        }
    }
}

// Reset storage on extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ 'visitedWebsites': {} });
    loadVisitedWebsites();

    chrome.storage.local.set({ 'blockedWebsites': {} });
    loadBlockedWebsites();
});

// Initial load of stored data
loadVisitedWebsites();
loadBlockedWebsites();

// Respond to messages from popup.js or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getVisitedWebsites') {
        sendResponse(visitedWebsites);
    }
    if (message === 'getBlockedWebsites') {
        sendResponse(blockedWebsites);
    }
});

// Start messaging the client
startMessager();

console.log("STARTED");
