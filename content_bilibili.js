console.log("SyncDeleter: Bilibili content script loaded");

// Function to handle the deletion event
function handleDelete(event) {
    // We need to identify if the click was on a delete button
    // Bilibili history page structure varies, but generally there's a delete button per item.
    // The structure is usually a list of `.history-record-item` or similar.
    // The delete button might have different classes like `.bili-history-doc__delete` or equivalent.

    // Since the DOM might change, and we want to catch the click on the delete action.
    // A robust way often involves event delegation.

    const target = event.target;
    console.log("--------------------------------------------------");
    console.log("SyncDeleter Click Debug:");
    console.log("Element:", target.tagName);
    console.log("Classes:", target.className);
    console.log("Text:", target.innerText);
    console.log("Inner HTML (trimmed):", target.innerHTML.substring(0, 100));

    // Log parents to see structure
    let parent = target.parentElement;
    if (parent) {
        console.log("Parent:", parent.tagName, parent.className);
        if (parent.parentElement) {
            console.log("Grandparent:", parent.parentElement.tagName, parent.parentElement.className);
        }
    }
    console.log("--------------------------------------------------");

    // Aggressive search for the deletion action
    let isDelete = false;
    let current = target;
    // Check current and parents for delete class
    for (let i = 0; i < 5; i++) {
        if (!current) break;
        if (current.classList && (current.classList.contains("sic-BDC-trash_delete_line") || current.classList.contains("delete-btn") || current.innerText === "删除")) {
            isDelete = true;
            console.log("SyncDeleter: Delete detected on element level", i);
            break;
        }
        current = current.parentElement;
    }

    if (isDelete) {
        console.log("SyncDeleter: proceeding to find link...");

        // Traverse up to find a video link
        let linkFound = null;
        let searchNode = target;

        // Search up to 10 levels
        for (let i = 0; i < 10; i++) {
            if (!searchNode) break;

            // Check if this node is a container that holds a link
            // Search down from this node
            const link = searchNode.querySelector && searchNode.querySelector("a[href*='bilibili.com/video/'], a[href*='//www.bilibili.com/video/']");
            if (link) {
                linkFound = link.href;
                console.log("SyncDeleter: Found link via querySelector in ancestor level " + i, linkFound);
                break;
            }

            // Also check if the node itself is the link (unlikely for delete button but possible for parents)
            if (searchNode.tagName === "A" && searchNode.href && searchNode.href.includes("/video/")) {
                linkFound = searchNode.href;
                console.log("SyncDeleter: Ancestor level " + i + " is the link", linkFound);
                break;
            }

            searchNode = searchNode.parentElement;
        }

        if (linkFound) {
            console.log("SyncDeleter: Sending delete request for", linkFound);
            chrome.runtime.sendMessage({ action: "delete_history", url: linkFound }, (response) => {
                if (response && response.success) {
                    console.log("SyncDeleter: History deletion request successful");
                } else {
                    console.error("SyncDeleter: History deletion request failed", response?.error);
                }
            });
        } else {
            console.warn("SyncDeleter: Failed to find a video link nearby.");
        }
    }
}

// Bilibili might be a SPA, so we should attach listener to a static parent or document body.
document.body.addEventListener("click", handleDelete);

// Also handle the "Clear History" (Clean) button if possible, but that's risky as it clears everything.
// The prompt asked for "deleting video history", implying individual items.
