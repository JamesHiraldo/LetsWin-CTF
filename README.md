# LetsWin CTF

**Made by Maydayx2**

A local CTF investigation desk with **19 workbenches, five categories, and 94 linked resources**. Open `LetsWin CTF.html` or double-click `LetsWin CTF.cmd` on Windows. On macOS, open the HTML directly; an optional `.command` launcher is included.

![LetsWin CTF running in Firefox on Windows](docs/letswin-overview.png)

Actual screenshot taken before the catalog cleanup; the current app has 19 workbenches and 94 linked resources. Browser tabs and address bar have been cropped out.

## Start here

1. Choose **Individual Game** or **Team Game** before using tools.
2. Create a case under **Saved challenges** and record the challenge description.
3. Follow a **Challenge guide**, open a category, and analyze supplied files or text.
4. Save results to the active challenge and export a workspace JSON backup.

Individual mode has no AI link or team notes. Team mode offers temporary notes and a manually opened ChatGPT link under the supplied event rules. This app never sends material to AI, interacts with competition platforms, or submits answers.

## What's included

- Separate saved workspaces for Individual and Team modes, with notes, candidate flags, statuses, file metadata, saved results, and JSON backup/restore.
- Static guides for OSINT, crypto, forensics, web security, and network analysis.
- Result/selection handoffs and reusable encoding recipes.
- TCP reassembly, HTTP/1 inspection and complete-body export, DNS inspection, and PCAP/PCAPNG viewing.
- Log and text organization, RegEx search, UTC time filters, timezone display, grouping, duplicates, timelines, and CSV export.
- MD5, SHA-1, SHA-256, NTLM, salted-format hints, Caesar, Vigenere, XOR, Morse, binary, and encoding tools.
- Code Identifier with local language/file-type detection, confidence labels, syntax clues, file loading, and runtime hints.
- Image Lab with local QR decoding, selected EXIF/GPS metadata, channels, bit planes, and appended-byte export.
- Searchable linked resources with usage guidance, examples, platform/cost notes, and favorites. Includes what3words and the requested hash/crypto/network tools.

## Documentation and practice files

- [Complete user guide](docs/USER_GUIDE.md): instructions, examples, limits, and troubleshooting.
- [Verification report](docs/TEST_REPORT.md): automated checks, live screenshot evidence, and remaining verification limits.
- [Third-party notices](docs/THIRD_PARTY.md): pinned libraries, licenses, and references.
- [Practice network capture](docs/examples/practice-traffic.pcap), [QR image](docs/examples/practice-qr.png), and [image with appended bytes](docs/examples/practice-appended.png).

Saved data lives in this browser; local file storage behavior varies by browser and location. Export backups before clearing browser data or moving the app. Backups contain notes and candidate flags in plain text. File contents are not retained across reloads.

## Build and test

The standalone HTML includes all runtime code and works without a server or package installation. Linked websites need internet access.

For development, use Node.js 22+ and pnpm:

```text
pnpm install --frozen-lockfile --ignore-scripts
node build.cjs
node tests/run.cjs
```

Edit the source files and rebuild to refresh `LetsWin CTF.html`. `tests/make-examples.cjs` regenerates the practice fixtures. Do not distribute `node_modules`, `.pnpm-store`, or temporary test output.

The automated tests pass; they do not guarantee every browser, operating system, input format, or third-party service. See the verification report for the exact tested scope.
