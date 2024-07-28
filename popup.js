document.getElementById('downloadLogs').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "downloadLogs"});
  });