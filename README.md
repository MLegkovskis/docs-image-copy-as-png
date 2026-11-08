# Docs Image Copy as PNG

Docs Image Copy as PNG converts a single image copied by Google Docs from
HTML clipboard data into a normal PNG clipboard item. That PNG can be pasted
directly into Claude, ChatGPT, email, design tools, and other applications that
accept PNG clipboard images.

Images are processed locally in Chrome. The extension has no analytics,
advertising, accounts, tracking, remote code, or extension-owned servers.

## Use

1. Open a Google Doc and click one image.
2. Press **Ctrl+C**.
3. Wait for the green confirmation message.
4. In the destination application, press **Ctrl+V**.

Google Docs places keyboard events in a hidden editor frame, so this extension
is deliberately injected into document subframes as well as the visible page.

If the automatic conversion does not run, press **Ctrl+Shift+Y** or click the
extension's toolbar icon while the Google Doc is active.

## Install from source

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**,
and select this folder. Reload any Google Docs tabs that were already open.

The extension only runs on Google Docs document pages. Clipboard images are
processed locally in the browser and are not collected, stored, or transmitted
by the extension.

## Privacy

See [PRIVACY.md](PRIVACY.md). The extension has no analytics, advertising,
accounts, remote code, or extension-owned servers.

## Support

Report problems or request improvements through
[GitHub Issues](https://github.com/MLegkovskis/docs-image-copy-as-png/issues).

## License

Licensed under the [MIT License](LICENSE).
