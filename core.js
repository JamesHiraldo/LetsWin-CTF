/* LetsWin CTF local analysis helpers. No function here makes a network request. */
(function (root) {
  "use strict";

  function bytesToText(bytes) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  function textToBytes(value) {
    return new TextEncoder().encode(value);
  }

  function toBase64(value) {
    const bytes = textToBytes(value);
    if (typeof btoa === "function") {
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }
    return Buffer.from(bytes).toString("base64");
  }

  function fromBase64(value) {
    const clean = value.trim().replace(/\s/g, "");
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean)) {
      throw new Error("Invalid Base64 input.");
    }
    const binary = typeof atob === "function" ? atob(clean) : Buffer.from(clean, "base64").toString("binary");
    return bytesToText(Uint8Array.from(binary, char => char.charCodeAt(0)));
  }

  function toHex(value) {
    return Array.from(textToBytes(value), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function fromHex(value) {
    const clean = value.replace(/\s/g, "");
    if (clean.length % 2 || !/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Enter an even number of hexadecimal digits.");
    return bytesToText(Uint8Array.from(clean.match(/../g) || [], pair => parseInt(pair, 16)));
  }

  function rot13(value) {
    return value.replace(/[A-Za-z]/g, letter => String.fromCharCode(letter.charCodeAt(0) + (letter.toLowerCase() <= "m" ? 13 : -13)));
  }

  function transformText(value, format, direction) {
    if (format === "base64") return direction === "encode" ? toBase64(value) : fromBase64(value);
    if (format === "hex") return direction === "encode" ? toHex(value) : fromHex(value);
    if (format === "url") return direction === "encode" ? encodeURIComponent(value) : decodeURIComponent(value);
    if (format === "rot13") return rot13(value);
    throw new Error("Unsupported transform.");
  }

  function inspectUrl(input) {
    let url;
    try { url = new URL(input.trim()); } catch { throw new Error("Enter a complete http:// or https:// URL."); }
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs can be inspected.");
    return {
      scheme: url.protocol.slice(0, -1), host: url.hostname, port: url.port || "default",
      path: url.pathname, fragment: url.hash ? url.hash.slice(1) : "none",
      usernamePresent: Boolean(url.username), passwordPresent: Boolean(url.password),
      parameters: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value }))
    };
  }

  function inspectJwt(input) {
    const parts = input.trim().split(".");
    if (parts.length !== 3) throw new Error("A JWT must have three dot-separated sections.");
    const decode = part => {
      const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
      return JSON.parse(fromBase64(padded));
    };
    return { header: decode(parts[0]), payload: decode(parts[1]), warning: "Decoded only. Signature and claims are NOT verified." };
  }

  function identifyHash(value) {
    const hash = value.trim();
    if (!/^[0-9a-fA-F]+$/.test(hash)) return ["Not a plain hexadecimal digest. It may be salted or encoded."];
    const matches = {
      32: ["MD5", "NTLM", "MD4"], 40: ["SHA-1", "RIPEMD-160"],
      56: ["SHA-224"], 64: ["SHA-256", "SHA3-256"],
      96: ["SHA-384"], 128: ["SHA-512", "SHA3-512"]
    };
    return matches[hash.length] || ["Unknown hexadecimal digest length"];
  }

  function fileSignature(bytes) {
    const hex = Array.from(bytes.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join(" ");
    const starts = values => values.every((value, index) => bytes[index] === value);
    let type = "Unknown";
    if (starts([0x89, 0x50, 0x4e, 0x47])) type = "PNG image";
    else if (starts([0xff, 0xd8, 0xff])) type = "JPEG image";
    else if (starts([0x47, 0x49, 0x46, 0x38])) type = "GIF image";
    else if (starts([0x25, 0x50, 0x44, 0x46])) type = "PDF document";
    else if (starts([0x50, 0x4b, 0x03, 0x04])) type = "ZIP-based archive or document";
    else if (starts([0x7f, 0x45, 0x4c, 0x46])) type = "ELF executable";
    else if (starts([0x4d, 0x5a])) type = "Windows PE executable candidate";
    else if (starts([0x1f, 0x8b])) type = "GZIP archive";
    else if (starts([0xd4, 0xc3, 0xb2, 0xa1]) || starts([0xa1, 0xb2, 0xc3, 0xd4])) type = "Classic PCAP capture";
    else if (starts([0x52, 0x61, 0x72, 0x21])) type = "RAR archive";
    else if (starts([0x37, 0x7a, 0xbc, 0xaf])) type = "7-Zip archive";
    return { type, hex: hex || "empty file" };
  }

  function extractStrings(bytes, minimum = 5, limit = 100) {
    const results = [];
    let current = "";
    for (const byte of bytes) {
      if (byte >= 32 && byte <= 126) current += String.fromCharCode(byte);
      else {
        if (current.length >= minimum) results.push(current.slice(0, 300));
        current = "";
        if (results.length >= limit) break;
      }
    }
    if (current.length >= minimum && results.length < limit) results.push(current.slice(0, 300));
    return results;
  }

  function entropy(bytes) {
    if (!bytes.length) return 0;
    const counts = new Uint32Array(256);
    for (const byte of bytes) counts[byte]++;
    let value = 0;
    for (const count of counts) {
      if (count) {
        const probability = count / bytes.length;
        value -= probability * Math.log2(probability);
      }
    }
    return Math.round(value * 1000) / 1000;
  }

  function extractIndicators(input) {
    const unique = values => [...new Set(values)].slice(0, 100);
    const urls = unique(input.match(/https?:\/\/[^\s<>"']+/gi) || []);
    const emails = unique(input.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) || []);
    const ips = unique((input.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).filter(candidate => candidate.split(".").every(octet => Number(octet) <= 255)));
    const domains = unique((input.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).filter(candidate => !/^\d+(?:\.\d+){3}$/.test(candidate)));
    return { urls, emails, ipv4: ips, domains };
  }

  function matchSha256Wordlist(target, wordlist, maxWords = 10000) {
    const digest = target.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(digest)) throw new Error("Enter a 64-character SHA-256 hex digest.");
    if (wordlist.length > 2_000_000) throw new Error("Limit the pasted wordlist to 2 million characters.");
    const words = wordlist.split(/\r?\n/);
    const count = Math.min(words.length, maxWords);
    for (let index = 0; index < count; index++) {
      if (sha256Bytes(textToBytes(words[index])) === digest) return { match: words[index], tested: index + 1, truncated: false };
    }
    return { match: null, tested: count, truncated: words.length > maxWords };
  }

  function searchLogs(value, query, limit = 200) {
    const needle = query.toLocaleLowerCase();
    const lines = value.split(/\r?\n/);
    const matches = [];
    for (let index = 0; index < lines.length; index++) {
      if (!needle || lines[index].toLocaleLowerCase().includes(needle)) {
        matches.push({ line: index + 1, text: lines[index] });
        if (matches.length === limit) break;
      }
    }
    return { totalLines: lines.length, shown: matches.length, truncated: matches.length === limit, matches };
  }

  function cidrInfo(input) {
    const match = input.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d|[12]\d|3[012])$/);
    if (!match) throw new Error("Enter an IPv4 CIDR such as 192.168.1.0/24.");
    const octets = match.slice(1, 5).map(Number);
    if (octets.some(value => value > 255)) throw new Error("IPv4 octets must be 0–255.");
    const prefix = Number(match[5]);
    const address = octets.reduce((number, octet) => ((number << 8) | octet) >>> 0, 0);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (address & mask) >>> 0;
    const last = (network | (~mask >>> 0)) >>> 0;
    const dotted = number => [24, 16, 8, 0].map(shift => (number >>> shift) & 255).join(".");
    return { network: dotted(network), mask: dotted(mask), last: dotted(last), addresses: 2 ** (32 - prefix), prefix };
  }

  function sha256Bytes(bytes) {
    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const rotate = (value, count) => (value >>> count) | (value << (32 - count));
    const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    const bitLength = BigInt(bytes.length) * 8n;
    view.setUint32(padded.length - 8, Number((bitLength >> 32n) & 0xffffffffn), false);
    view.setUint32(padded.length - 4, Number(bitLength & 0xffffffffn), false);
    const state = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const words = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const a = words[i - 15], b = words[i - 2];
        const s0 = rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3);
        const s1 = rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = state;
      for (let i = 0; i < 64; i++) {
        const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
        const choose = (e & f) ^ (~e & g);
        const t1 = (h + s1 + choose + constants[i] + words[i]) >>> 0;
        const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + majority) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0;
      state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0;
      state[4] = (state[4] + e) >>> 0; state[5] = (state[5] + f) >>> 0;
      state[6] = (state[6] + g) >>> 0; state[7] = (state[7] + h) >>> 0;
    }
    return state.map(word => word.toString(16).padStart(8, "0")).join("");
  }

  function parsePcap(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 24) throw new Error("PCAP header is incomplete.");
    const magic = view.getUint32(0, false);
    let little;
    if (magic === 0xa1b2c3d4 || magic === 0xa1b23c4d) little = false;
    else if (magic === 0xd4c3b2a1 || magic === 0x4d3cb2a1) little = true;
    else throw new Error("Classic PCAP format required. PCAPNG is not supported yet.");
    const linkType = view.getUint32(20, little);
    let offset = 24, packets = 0, bytes = 0;
    const protocols = { TCP: 0, UDP: 0, ICMP: 0, Other: 0 };
    const conversations = new Map();
    const add = (source, target) => {
      const key = `${source} → ${target}`;
      conversations.set(key, (conversations.get(key) || 0) + 1);
    };
    while (offset + 16 <= view.byteLength && packets < 100000) {
      const included = view.getUint32(offset + 8, little);
      const original = view.getUint32(offset + 12, little);
      offset += 16;
      if (included > view.byteLength - offset) throw new Error("PCAP packet data is truncated.");
      packets++; bytes += original;
      if (linkType === 1 && included >= 34 && view.getUint16(offset + 12, false) === 0x0800) {
        const ip = offset + 14;
        const ihl = (view.getUint8(ip) & 15) * 4;
        if (ihl >= 20 && ip + ihl <= offset + included) {
          const protocol = view.getUint8(ip + 9);
          const name = protocol === 6 ? "TCP" : protocol === 17 ? "UDP" : protocol === 1 ? "ICMP" : "Other";
          protocols[name]++;
          const address = start => [0, 1, 2, 3].map(i => view.getUint8(start + i)).join(".");
          add(address(ip + 12), address(ip + 16));
        }
      }
      offset += included;
    }
    return {
      packets, bytes, linkType, protocols,
      truncated: packets === 100000,
      conversations: [...conversations.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([pair, count]) => ({ pair, count }))
    };
  }

  const api = { transformText, inspectUrl, inspectJwt, identifyHash, fileSignature, extractStrings, entropy, extractIndicators, matchSha256Wordlist, searchLogs, cidrInfo, parsePcap, sha256Bytes };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CTFCore = api;
})(typeof window !== "undefined" ? window : globalThis);
