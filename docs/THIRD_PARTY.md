# Third-party code and references

| Component | Version | Runtime purpose | License |
| --- | --- | --- | --- |
| [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Local QR image decoding | [Apache-2.0](../vendor/jsQR-LICENSE.txt) |
| [CryptoJS](https://github.com/brix/crypto-js) | 4.2.0 | MD5, SHA-1, SHA-256 text hashing | [MIT](../vendor/crypto-js-LICENSE.txt) |

The exact npm versions are pinned in `package.json` and `pnpm-lock.yaml`. Their distributed JavaScript and licenses are copied into `vendor/`; the HTML build embeds both runtime sources and license text. No CDN is contacted when the application opens. CryptoJS is no longer actively maintained; its use here is confined to legacy CTF digest calculations, not password storage, key generation, or encryption. MD4 for NTLM is implemented locally and checked against the [RFC 1320 test vectors](https://www.rfc-editor.org/rfc/rfc1320).

Development-only packages: jsdom 26.1.0 for DOM integration tests and qrcode 1.5.4 for independently generated QR fixtures. They are not shipped as executable runtime code in the standalone HTML. The dependency installation disables package lifecycle scripts.

Catalog sources include [gregalletti/CTF_tools](https://github.com/gregalletti/CTF_tools), the originally requested tools, and official project sites. Importing a link does not embed, install, or verify that external tool. Usage notes are introductory guidance; provider documentation is authoritative for supported platforms, editions, and current prices.

Protocol reference: [Wireshark's Follow Stream documentation](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html). The app implements a limited local analysis subset; it is not a Wireshark replacement.
