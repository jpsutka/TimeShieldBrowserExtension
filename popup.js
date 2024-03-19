// popup.js

document.addEventListener('DOMContentLoaded', () => {

    // Send a message to the background script to get the visited websites data
    chrome.runtime.sendMessage('getVisitedWebsites', (response) => {
        // Sort the visited websites by visit count in descending order
        const sortedWebsites = Object.entries(response).sort((a, b) => b[1] - a[1]);
        
        // Display the top 5 visited websites in the popup
        const list = document.getElementById('visited-websites');
        sortedWebsites.slice(0, 5).forEach(([website, count]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${website} (${(count / 60).toFixed(1)} Minutes)`;
            list.appendChild(listItem);
        });
    });

    // Send a message to the background script to get the visited websites data
    chrome.runtime.sendMessage('getBlockedWebsites', (response) => {
        // Sort the visited websites by visit count in descending order
        const sortedWebsites = Object.entries(response).sort((a, b) => b[1] - a[1]);
        
        // Display the top 5 visited websites in the popup
        const list = document.getElementById('blocked-websites');
        sortedWebsites.forEach(([website, count]) => {
            const listItem = document.createElement('li');
            listItem.textContent = website;
            list.appendChild(listItem);
        });
    });
});