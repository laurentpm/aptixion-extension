chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'isInstalled') {
        sendResponse({installed: true});
      } else if (request.message === 'scrapeLinkedIn') {
        console.log('Received scrapeLinkedIn request:', request);
        const cap = request.cap && !isNaN(request.cap) ? parseInt(request.cap) : 10;
        console.log(`Using cap value: ${cap}`);

        chrome.tabs.create({ url: request.url, active: false }, function(tab) {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tab.id, {action: "scrape", cap: cap}, function(response) {
                console.log('Received response from content script:', response);
                // chrome.tabs.remove(tab.id);  // Comment out or remove this line to keep the tab open
                sendResponse({data: response});
              });
            }
          });
        });
        return true;  // Will respond asynchronously
      }
    }
  );
