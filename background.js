/*chrome.runtime.onMessageExternal.addListener(
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
*/

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'isInstalled') {
        sendResponse({installed: true});
      } 
    }
  );

chrome.runtime.onConnectExternal.addListener(function(port) {
  console.log('External connection established');
  let keepAliveInterval;
  port.onDisconnect.addListener(() => {
    console.log('External port disconnected');
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    // Optionally clean up tabs if needed
  });
  port.onMessage.addListener(function(request) {
    if (request.message === 'scrapeLinkedIn') {
      console.log('Received scrapeLinkedIn request:', request);
      const cap = request.cap && !isNaN(request.cap) ? parseInt(request.cap) : 10;
      console.log(`Using cap value: ${cap}`);

      keepAliveInterval = setInterval(() => {
        port.postMessage({status: 'scraping'});
        console.log('Sent keep-alive message');
      }, 10000); // Every 10 seconds

      chrome.tabs.create({ url: request.url, active: false }, function(tab) {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.sendMessage(tab.id, {action: "scrape", cap: cap}, function(response) {
              clearInterval(keepAliveInterval);
              console.log('Received response from content script:', response);
              port.postMessage({data: response});
              // chrome.tabs.remove(tab.id);  // Comment out or remove this line to keep the tab open
            });
          }
        });
        port.onDisconnect.addListener(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.remove(tabId);
        });
      });
    }
  });
});