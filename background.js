console.log("SyncDeleter: Background service worker started");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "delete_history" && request.url) {
    console.log(`Received request to delete history for: ${request.url}`);

    // Fuzzy matching logic:
    // The URL from the DOM might have query params that differ from the visited history.
    // We should search for the core video URL and delete matches.

    let searchUrl = request.url;

    // Clean Bilibili URL: remove query params to get base video URL
    if (searchUrl.includes("bilibili.com/video/")) {
      try {
        const urlObj = new URL(searchUrl);
        // Keep pathname (e.g. /video/BV...)
        // Search for the path without query params
        searchUrl = urlObj.origin + urlObj.pathname;
      } catch (e) {
        // fallback if invalid URL
      }
    }
    // Clean YouTube URL: keep video ID
    else if (searchUrl.includes("youtube.com/watch")) {
      try {
        const urlObj = new URL(searchUrl);
        const v = urlObj.searchParams.get("v");
        if (v) {
          // Search for the video ID specific content
          searchUrl = "youtube.com/watch?v=" + v;
        }
      } catch (e) { }
    }

    console.log(`Searching history for fuzzy match: ${searchUrl}`);

    chrome.history.search({ text: searchUrl }, (results) => {
      if (results.length === 0) {
        console.log("No history found for this item.");
        // Fallback: try to delete the exact URL passed just in case
        chrome.history.deleteUrl({ url: request.url });
        sendResponse({ success: true, count: 0 });
      } else {
        console.log(`Found ${results.length} history items to delete.`);
        let pending = results.length;
        results.forEach((item) => {
          console.log(`Deleting found history item: ${item.url}`);
          chrome.history.deleteUrl({ url: item.url }, () => {
            pending--;
            if (pending === 0) {
              sendResponse({ success: true, count: results.length });
            }
          });
        });
      }
    });

    return true; // Keep channel open
  }
});
