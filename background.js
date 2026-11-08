chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "convert-copied-docs-image" });
  } catch {
    // The page may predate extension installation. Reloading the Doc injects the script.
  }
});
