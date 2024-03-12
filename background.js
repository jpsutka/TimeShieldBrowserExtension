// List of most used websites
let visitedWebsites = {};

// Tncrement seconds condition
let condition = true;

let websocket = null;


// Load the previously stored visited websites data from storage
function loadVisitedWebsites() {
    chrome.storage.local.get('visitedWebsites', (result) => {
        if (result.visitedWebsites) {
            visitedWebsites = result.visitedWebsites;
        }
    });
}

// Update the storage with the latest visited websites data
function updateStorage() {
    chrome.storage.local.set({ 'visitedWebsites': visitedWebsites });
}

// Update time spent for a given website
function updateTimeSpent(websiteName, timeSpent) {
    if (visitedWebsites.hasOwnProperty(websiteName)) {

        visitedWebsites[websiteName] += timeSpent;
    } else {
        visitedWebsites[websiteName] = timeSpent;
    }
    updateStorage();
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
        tabHandler(tab);
    }
});

// Determines the current website you are on and passes that to the timer
async function tabHandler(tabName) {
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

    // I want to updateTimeSpent() every second a tab is open

    //updateTimeSpent(websiteName, 1);
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
        if (websocket === null){
            // Init web socket
            websocket = new WebSocket('ws://localhost:8080');
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
});

// Respond to messages from popup.js or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getVisitedWebsites') {
        sendResponse(visitedWebsites);
    }
});

// Initial load of stored data
loadVisitedWebsites();

// Start messaging the client
startMessager();
