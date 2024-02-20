// background.js

// Initialize an object to store the visited websites and their visit counts
let visitedWebsites = {};

// Load the previously stored visited websites data from storage
chrome.storage.local.get('visitedWebsites', (result) => {
    if (result.visitedWebsites) {
        visitedWebsites = result.visitedWebsites;
    }
});

//init web socket
websocket = new WebSocket('ws://localhost:8080');

// Listen for the onUpdated event which is fired when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab is fully loaded
    if (changeInfo.status === 'complete') {
        // Get the URL of the tab
        let url = new URL(tab.url);
        if (url.hostname != "newtab") {

            websocket.send(url.hostname);

            // Increment the visit count for the visited website
            if (url.hostname in visitedWebsites) {
                visitedWebsites[url.hostname]++;
            } else {
                visitedWebsites[url.hostname] = 1;
            }  

            // Store the updated visited websites data
            chrome.storage.local.set({ 'visitedWebsites': visitedWebsites });
        }
    }
});

// Listen for the onInstalled event which is fired when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
    // Clear the visited websites data when the extension is installed
    chrome.storage.local.set({ 'visitedWebsites': {} });
});

// Listen for messages from the popup.js script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Send the visited websites data to the popup.js script when requested
    if (message === 'getVisitedWebsites') {
        sendResponse(visitedWebsites);
    }
});