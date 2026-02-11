console.log("SyncDeleter: YouTube content script loaded");

function handleDeleteYouTube(event) {
    const target = event.target;
    console.log("--------------------------------------------------");
    console.log("SyncDeleter YouTube Click Debug:");
    console.log("Element:", target.tagName);
    console.log("Classes:", target.className);
    if (target.getAttribute) {
        console.log("Aria-label:", target.getAttribute("aria-label"));
        console.log("Title:", target.getAttribute("title"));
    }
    // Log SVG path if it's an icon
    if (target.tagName === "path") {
        console.log("SVG Path d:", target.getAttribute("d"));
    }

    // Log potential buttons nearby
    const button = target.closest("button");
    if (button) {
        console.log("Parent Button:", button.tagName, button.className);
        console.log("Button Aria:", button.getAttribute("aria-label"));
    }

    // Log parents
    let parent = target.parentElement;
    if (parent) {
        console.log("Parent:", parent.tagName, parent.className);
        if (parent.parentElement) {
            console.log("Grandparent:", parent.parentElement.tagName, parent.parentElement.className);
            if (parent.parentElement.parentElement) {
                console.log("Great-Grandparent:", parent.parentElement.parentElement.tagName, parent.parentElement.parentElement.className);
            }
        }
    }
    console.log("--------------------------------------------------");

    // YouTube uses various structures. The history page uses `ytd-video-renderer` or `ytd-history-video-renderer` usually.
    // The delete button is often an 'X' icon button.
    // Aria-label often says "Remove from watch history".

    if (button) {
        const ariaLabel = button.getAttribute("aria-label");
        // Check for standard YouTube "Remove" button labels
        if (ariaLabel && (ariaLabel.includes("Remove from watch history") || ariaLabel.includes("从观看记录中移除"))) {
            console.log("SyncDeleter: YouTube delete button clicked", button);

            // Find the video renderer container
            const renderer = button.closest("ytd-video-renderer, ytd-history-video-renderer");
            if (renderer) {
                // Find the main video link. Usually `id="thumbnail"` or `id="video-title"`
                const videoLink = renderer.querySelector("a#video-title");

                if (videoLink && videoLink.href) {
                    let url = videoLink.href;

                    // YouTube URLs in history often have &t=... parameters.
                    // We might want to clear the base URL or the specific one. 
                    // Chrome history usually stores the exact URL visited.

                    console.log("SyncDeleter: Identified YouTube video URL to delete:", url);

                    chrome.runtime.sendMessage({ action: "delete_history", url: url }, (response) => {
                        if (response && response.success) {
                            console.log("SyncDeleter: History deletion request successful");
                        } else {
                            console.error("SyncDeleter: History deletion request failed", response?.error);
                        }
                    });
                }
            }
        }
    }
}

document.body.addEventListener("click", handleDeleteYouTube);
