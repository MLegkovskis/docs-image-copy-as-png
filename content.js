(() => {
  const isDocumentFrame =
    (location.hostname === "docs.google.com" && location.pathname.startsWith("/document/")) ||
    document.referrer.startsWith("https://docs.google.com/document/");

  if (!isDocumentFrame) return;

  const TOAST_ID = "docs-image-copy-as-png-toast";
  let conversionInProgress = false;

  function showToast(message, kind = "success") {
    if (window.top !== window) {
      window.top.postMessage(
        { source: "docs-image-copy-as-png", type: "toast", message, kind },
        "*"
      );
      return;
    }

    document.getElementById(TOAST_ID)?.remove();

    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "2147483647",
      maxWidth: "380px",
      padding: "12px 16px",
      borderRadius: "8px",
      color: "white",
      background: kind === "error" ? "#b3261e" : "#137333",
      boxShadow: "0 4px 14px rgba(0,0,0,.3)",
      font: "500 14px/1.4 system-ui, sans-serif"
    });
    document.documentElement.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  if (window.top === window) {
    window.addEventListener("message", (event) => {
      if (
        event.origin === "https://docs.google.com" &&
        event.data?.source === "docs-image-copy-as-png" &&
        event.data?.type === "toast"
      ) {
        showToast(event.data.message, event.data.kind);
      }
    });
  }

  async function fetchImageBlob(src) {
    if (src.startsWith("data:image/")) {
      const response = await fetch(src);
      return response.blob();
    }

    // Google Docs normally embeds copied image bytes as a data URL. If it
    // supplies a public URL instead, rely on normal page CORS rather than
    // requesting broad extension access to Google-hosted image domains.
    const response = await fetch(new URL(src, location.href).href, {
      credentials: "omit",
      referrerPolicy: "no-referrer"
    });
    if (!response.ok) throw new Error(`Image request failed (${response.status}).`);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("The copied URL was not an image.");
    return blob;
  }

  async function toPng(sourceBlob) {
    const bitmap = await createImageBitmap(sourceBlob);
    try {
      if (typeof OffscreenCanvas !== "undefined") {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0);
        return await canvas.convertToBlob({ type: "image/png" });
      }

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      return await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("PNG conversion failed."))),
          "image/png"
        );
      });
    } finally {
      bitmap.close();
    }
  }

  async function findSingleHtmlImage(clipboardItems) {
    for (const item of clipboardItems) {
      if (!item.types.includes("text/html")) continue;

      const html = await (await item.getType("text/html")).text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const images = [...parsed.querySelectorAll("img[src]")];
      if (images.length === 1) return images[0].getAttribute("src");
    }
    return null;
  }

  async function convertClipboard({ manual = false } = {}) {
    if (conversionInProgress) return false;
    conversionInProgress = true;

    try {
      const items = await navigator.clipboard.read();
      if (items.some((item) => item.types.includes("image/png"))) {
        if (manual) showToast("The clipboard already contains a PNG image.");
        return true;
      }

      const imageSrc = await findSingleHtmlImage(items);
      if (!imageSrc) {
        if (manual) showToast("Copy one selected image in Google Docs first.", "error");
        return false;
      }

      const sourceBlob = await fetchImageBlob(imageSrc);
      const pngBlob = await toPng(sourceBlob);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob })
      ]);
      showToast("Image copied as PNG — paste it with Ctrl+V.");
      return true;
    } catch (error) {
      if (manual) {
        showToast(error.message || "Could not convert the copied image.", "error");
        console.info(
          "Docs Image Copy as PNG could not convert the clipboard:",
          error?.name || "Error",
          error?.message || String(error)
        );
      }
      return false;
    } finally {
      conversionInProgress = false;
    }
  }

  document.addEventListener(
    "copy",
    () => {
      // Let Google Docs populate its HTML clipboard first, then replace a single
      // copied HTML image with a normal PNG clipboard item.
      window.setTimeout(() => convertClipboard(), 100);
    },
    true
  );

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "convert-copied-docs-image") return false;
    convertClipboard({ manual: true }).then((ok) => sendResponse({ ok }));
    return true;
  });
})();
