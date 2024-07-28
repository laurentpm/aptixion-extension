function log(message, obj = null) {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(`${timestamp}: ${message}`, obj);  // Log with object
  } else {
    console.log(`${timestamp}: ${message}`);  // Log without object
  }

  // Store in Chrome storage
  chrome.storage.local.get({ logs: [] }, function (result) {
    let logs = result.logs;
    logs.push(`${timestamp}: ${message}`);
    chrome.storage.local.set({ logs: logs }, function () {
      if (chrome.runtime.lastError) {
        console.error('Error saving log:', chrome.runtime.lastError);
      }
    });
  });
}

function randomDelay(min, max) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === "scrape") {
      const scrapeLikes = async () => {
        log("Starting scrape function");
        const likeButton = document.querySelector('button.social-details-social-counts__count-value');
        log(`Like button found: ${likeButton !== null}`);
        log("like button is:", likeButton);

        if (likeButton) {
          log("Simulating double click on like button");
          likeButton.dispatchEvent(new MouseEvent('dblclick', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          }));

          log("Double click event dispatched");

          await randomDelay(3000, 8000);  // Random delay between 3 and 8 seconds

          let modal = document.querySelector('.artdeco-modal--layer-default.social-details-reactors-modal');
          log(`Modal found after first delay: ${modal !== null}`);

          if (!modal) {
            likeButton.click(); // Single click to see if it makes any difference
            log("Single click dispatched as fallback");

            await randomDelay(3000, 8000);

            modal = document.querySelector('.artdeco-modal--layer-default.social-details-reactors-modal');
            log(`Modal found after fallback delay: ${modal !== null}`);

            if (!modal) {
              log("Modal still not found after fallback");
              return false;
            }
          }

          log("Modal successfully opened, proceeding to scrape likers");

          await randomDelay(3000, 8000);  // Wait for modal to fully load with random delay

          const likerList = modal.querySelector('.scaffold-finite-scroll__content');
          log(`Liker list found: ${likerList !== null}`);

          if (likerList) {
            const likers = Array.from(likerList.querySelectorAll('.artdeco-entity-lockup'))
              .slice(0, 10)  // Get the first 10 likers
              .map(element => {
                const nameElement = element.querySelector('.text-view-model');
                const captionElement = element.querySelector('.artdeco-entity-lockup__caption');
                return {
                  name: nameElement ? nameElement.textContent.trim() : 'Name not found',
                  info: captionElement ? captionElement.textContent.trim() : 'Info not found',
                  type: 'like'
                };
              });
            log(`Scraped likers: ${JSON.stringify(likers)}`);
            return likers;
          } else {
            log("Liker list not found");
            return [];
          }
        } else {
          log("Like button not found");
          return [];
        }
      };

      // Perform scraping
      scrapeLikes().then(likers => {
        sendResponse(likers);
      }).catch(error => {
        log(`Scraping error: ${error}`);
        sendResponse([]);
      });

      return true;  // Will respond asynchronously
    }
  }
);
