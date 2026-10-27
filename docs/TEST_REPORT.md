# LetsWin CTF verification report

Date: October 26, 2026. Environment: Windows, Node.js 24.22.1. Application version: 2.0.0 with Code Identifier added.

## Result

All nine automated test suites passed after building the standalone HTML. The three new algorithm/format/UI suites contain **363 assertions** in addition to the original suites and distribution checks. The app was also observed running in the user's Firefox browser, and its overview screenshot was captured for the README.

This evidence supports the tested behavior below. It is **not a 100% operational guarantee** across arbitrary inputs, browsers, operating systems, and external websites.

## Automated coverage

| Suite | Verified |
| --- | --- |
| `code-identifier.test.cjs` | 25 language/format examples; supporting clues and line numbers; misleading filename/fence hints; ambiguous input; comment/string masking; mixed markup; input limits; no execution |
| `core.test.cjs` | Original encoding, hashes, URL/JWT inspection, file signatures, indicators, wordlist, CIDR and capture functions |
| `viewer.test.cjs` | what3words validation; CSV/TSV/JSON/JSONL/log parsing; Unicode RegEx; formula-safe CSV; PCAP and PCAPNG byte order/timestamps; malformed captures |
| `catalog.test.cjs` | All 62 retained repository entries represented; 94 total linked resources; valid HTTP(S) URLs; md5decrypt top placement; repeatable import merging |
| `improvements.test.cjs` | 128 assertions: hashes against Node crypto; MD4 known vectors; NTLM; cipher round trips and invalid inputs; recipes; persistence, isolation, malformed backups, storage failure; time/group/duplicate analysis; sequence wraparound, gaps and conflicts; HTTP framing; DNS truncation/pointer handling; image bytes; real jsQR decoding of an independently generated QR |
| `formats.test.cjs` | 146 assertions: PCAP-to-TCP/HTTP/DNS integration; exported body bytes; IPv4/IPv6 packet decoding; truncated packets; fragmented-packet handling; little- and big-endian EXIF; GPS, orientation, dimensions and appended bytes; malformed offsets and invalid dates |
| `ui.test.cjs` | 89 assertions: all 19 workbench screens; mode gate; safe text rendering; saved challenges; result handoff/save; digests/ciphers/recipes; log filters and CSV download content; RegEx with real worker execution/timeout; what3words/JWT/CIDR/URL/indicator actions; file/text hashing; wordlist and file triage; PCAP/stream analysis and exact HTTP export content; favorites; guides; JSON backup/restore; cross-mode rejection; Code Identifier paste/file/UTF-16 handling, invalid bytes, result handoff, and safe source rendering; stale asynchronous results |
| `bundle.test.cjs` | Every embedded script compiles; source bytes preserved; source scripts and CSS fully embedded; expected product strings present |
| `distribution.test.cjs` | Runtime vendor sources match pinned packages; licenses embedded; documentation links and screenshot present; launcher paths point to the generated app |

The DOM suite runs the actual bundled scripts in jsdom with a synthetic test origin, isolated storage, local file fixtures, captured download Blobs, and a worker_threads adapter for the app's RegEx worker source. It does not load or automate a browser file URL. It validates event logic and exported data, not CSS layout or browser-specific permission behavior.

## Live browser evidence and limitations

- The user manually opened the generated HTML in Firefox on Windows and chose Individual mode.
- A native screenshot confirmed the overview rendered with the five categories, 18 workbenches, the resource directory, and new navigation items. The screenshot predates the catalog cleanup.
- The screenshot in the README is that real capture, cropped to exclude browser chrome and unrelated tabs.
- Further computer-use interaction was stopped by the tool because browser URL-policy enforcement was unsupported for that Firefox session. No alternate browser or navigation workaround was used.
- Consequently, live browser interaction across every screen, actual browser download prompts, clipboard permissions, image/canvas behavior, local-file persistence across a real reload, and mobile viewport behavior were **not fully verified**. Image parsing, pixel transforms, and the QR decoder were tested independently.
- macOS launch behavior and Safari were not executed. The macOS launcher target was checked as text only. Opening the HTML directly is the documented portable path.

## External resources

The catalog tests verify coverage and URL syntax, not third-party functionality. A separate read-only HTTP availability check is recorded in [link-check.json](link-check.json), with each response or timeout and its timestamp. HTTP success does not test registration, billing, decoding accuracy, downloads, provider-side AI use, or uploads. Bot protection can reject automated checks. External services cannot be guaranteed by this app.

After correcting the CrypTool, gmpy2, and Burp download URLs, **87 of 94 retained resources returned a successful HTTP response**. The remaining checks were:

| Resource | Automated-check result |
| --- | --- |
| crt.sh | HTTP 502 |
| what3words | HTTP 403 |
| Epieos | HTTP 403 |
| quipqiup | Socket error |
| steghide Manual | HTTP 500 |
| Burp Suite Community | HTTP 404 to the HEAD check; the [official current download page](https://portswigger.net/burp/downloads) was independently found and read through web research |
| Text to PCAP | TLS certificate-chain validation failure |

These outcomes are unresolved external checks, not proof that every listed website is down. No certificate verification was disabled. Updated official links: [CrypTool RSA](https://www.cryptool.org/en/cto/rsa-step-by-step/), [gmpy2 overview](https://gmpy2.readthedocs.io/en/stable/overview.html), and [Burp downloads](https://portswigger.net/burp/downloads).

The requested text-to-PCAP site has also previously returned HTTP 502 and remains listed with a note. Linked provider failures do not prevent local workbenches from running.

## Known functional boundaries

See the [user guide](USER_GUIDE.md) for limits. In particular: TCP endpoint pairs are not split into connection epochs; fragments/TLS/HTTP2/HTTP3 are unsupported; ambiguous HTTP body completeness disables body export; metadata support is selected EXIF and PNG fields; filesystem data is reopened after reload; saved browser data is not encrypted. These are documented boundaries, not claims of successful decoding.

## Reproduce

```text
pnpm install --frozen-lockfile --ignore-scripts
node build.cjs
node tests/run.cjs
```

Optional fixture generation and external checks:

```text
node tests/make-examples.cjs
node tests/check-links.cjs
```

The external check requires internet access and is deliberately separate from the offline automated suite. Its result can change without a change to the app.
