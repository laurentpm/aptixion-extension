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
      const scrapeLikes = async (cap = 10) => {  // Default cap is 10
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
            log("Liker list found, waiting for initial load");
            await randomDelay(3000, 5000);  // Wait for initial likers to load

            const getLikers = () => Array.from(likerList.querySelectorAll('.social-details-reactors-tab-body-list-item'))
              .map(element => {
                const nameElement = element.querySelector('.text-view-model');
                const captionElement = element.querySelector('.artdeco-entity-lockup__caption');
                const linkElement = element.querySelector('a.link-without-hover-state');
                return {
                  name: nameElement ? nameElement.textContent.trim() : 'Name not found',
                  info: captionElement ? captionElement.textContent.trim() : 'Info not found',
                  type: 'like',
                  url: linkElement ? linkElement.href : 'URL not found'
                };
              });

            let likers = getLikers();
            log(`Initial likers found: ${likers.length}`);

            let loadMoreAttempts = 0;
            const maxLoadMoreAttempts = 20;  // Adjust as needed

            while (loadMoreAttempts < maxLoadMoreAttempts && likers.length < cap) {
              const loadMoreButton = document.querySelector('.scaffold-finite-scroll__load-button');
              
              if (!loadMoreButton) {
                log("No more 'Show more results' button found. All likers loaded.");
                break;
              }

              log("Clicking 'Show more results' button");
              loadMoreButton.click();
              
              await randomDelay(2000, 4000);  // Wait for new likers to load

              const newLikers = getLikers();
              if (newLikers.length > likers.length) {
                likers = newLikers;
                log(`New likers loaded, total: ${likers.length}`);
                loadMoreAttempts = 0;  // Reset attempts if we successfully loaded more
              } else {
                loadMoreAttempts++;
                log(`No new likers loaded, attempt ${loadMoreAttempts}`);
              }
            }

            // Ensure we only return the capped number of likers
            likers = likers.slice(0, cap);

            log(`Scraped likers (capped at ${cap}): ${JSON.stringify(likers)}`);
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

      // Perform scraping with the provided cap or default
      scrapeLikes(request.cap).then(likers => {
        sendResponse(likers);
      }).catch(error => {
        log(`Scraping error: ${error}`);
        sendResponse([]);
      });

      return true;  // Will respond asynchronously
    }
  }
);
