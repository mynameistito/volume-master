# Privacy Policy

**Volume Master** does not collect, transmit, or sell any personal data.

There are **no analytics, no telemetry, no tracking, no remote servers, and no third-party SDKs**. Nothing the extension does leaves your browser.

## What the extension stores

All storage stays on your local machine.

| Data | Where | Lifetime | Purpose |
| --- | --- | --- | --- |
| Per-tab volume level (0–600) | `chrome.storage.session` | Cleared when the browser restarts | Keep your volume choice while a tab is open |
| Theme preference (`light` / `dark`) | `localStorage` (`vm-theme` key) | Until you clear it | Remember your light/dark toggle |

That is the complete list. No URLs, no titles, no audio content, no identifiers, no usage statistics.

## What permissions the extension requests, and why

Manifest permissions (declared in `wxt.config.ts`):

- **`activeTab`** — read the currently focused tab so the popup can show its title/favicon and apply volume to it.
- **`tabs`** — list audible tabs in the popup and switch focus when you pick one from the list.
- **`storage`** — write the per-tab volume to `chrome.storage.session` (see table above).
- **`scripting`** — inject the volume-control content script into the current tab when you adjust volume.
- **`host_permissions: <all_urls>`** — required so the volume booster works on any site. The extension only injects on tabs you actively use; it does not read or transmit page content.

These permissions are used solely to provide the feature. They are **not** used to read browsing history, page content, form data, or anything else.

## Network requests

The extension makes **zero network requests** of its own. It does not contact any server operated by the author or any third party.

## Open source

The full source code is available at https://github.com/mynameistito/volume-master. You can audit exactly what the extension does and build it yourself.

## Changes to this policy

If this policy changes, the update will appear in the git history of `PRIVACY.md` and be called out in the [CHANGELOG](./CHANGELOG.md).

## Contact

Questions or concerns: open an issue at https://github.com/mynameistito/volume-master/issues.
