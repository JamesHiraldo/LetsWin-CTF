/* Local log/capture organization. No network access. */
(function (root) {
  "use strict";
  const MAX_ROWS = 10000;
  function what3words(input) {
    let words = input.trim();
    if (/^https?:/i.test(words)) {
      const url = new URL(words);
      if (url.protocol !== "https:" || !["what3words.com", "www.what3words.com"].includes(url.hostname) || url.username || url.password || url.port) throw new Error("Use an official https://what3words.com/ address.");
      words = decodeURIComponent(url.pathname);
    }
    words = words.replace(/^\/+/, "").replace(/\/+$/, "").normalize("NFC");
    const word = "[\\p{L}\\p{M}]+(?:-[\\p{L}\\p{M}]+)*";
    if (!new RegExp(`^${word}\\.${word}\\.${word}$`, "u").test(words)) throw new Error("Enter three words separated by dots, such as ///clip.apples.leap.");
    return { address: `///${words}`, url: `https://what3words.com/${encodeURIComponent(words)}` };
  }
  function cell(value) { return value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value); }
  function result(format, columns, rows, warnings = []) {
    if (rows.length > MAX_ROWS) warnings.push(`Showing the first ${MAX_ROWS.toLocaleString()} rows.`);
    return { format, columns: [{ key: "number", label: "Row" }, ...columns], rows: rows.slice(0, MAX_ROWS).map((row, index) => ({ ...row, number: index + 1 })), warnings };
  }
  function objectsToTable(objects, format, warnings = []) {
    const keys = [...new Set(objects.flatMap(item => Object.keys(item)))].slice(0, 30);
    return result(format, keys.map((key, index) => ({ key: `c${index}`, label: key })), objects.map(item => Object.fromEntries(keys.map((key, index) => [`c${index}`, cell(item[key])]))), warnings);
  }
  function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [], value = "", quoted = false;
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (char === '"' && (quoted || value === "")) {
        if (quoted && text[index + 1] === '"') { value += '"'; index++; }
        else quoted = !quoted;
      } else if (!quoted && (char === delimiter || char === "\n" || char === "\r")) {
        row.push(value); value = "";
        if (char !== delimiter) {
          rows.push(row); row = [];
          if (char === "\r" && text[index + 1] === "\n") index++;
          if (rows.length > MAX_ROWS + 1) break;
        }
      } else value += char;
    }
    if (quoted) throw new Error("Delimited text has an unclosed quoted field.");
    if (value || row.length) { row.push(value); rows.push(row); }
    return rows;
  }
  function organizeText(input, filename = "") {
    const warnings = [];
    let text = input.replace(/^\uFEFF/, "");
    if (text.length > 2_000_000) { text = text.slice(0, 2_000_000); warnings.push("Text was limited to its first 2 million characters."); }
    const trimmed = text.trim();
    if (!trimmed) return result("Text", [{ key: "message", label: "Message" }], [], warnings);
    if (/^[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        const values = Array.isArray(parsed) ? parsed : [parsed];
        return objectsToTable(values.slice(0, MAX_ROWS + 1).map(item => item && typeof item === "object" && !Array.isArray(item) ? item : { value: item }), "JSON", warnings);
      } catch { /* JSONL or a plain log can also begin with a bracket. */ }
    }
    const lines = text.split(/\r?\n/, MAX_ROWS + 2).filter(line => line.trim());
    if (lines.length && lines.every(line => /^\s*\{/.test(line))) {
      try { return objectsToTable(lines.slice(0, MAX_ROWS + 1).map(line => JSON.parse(line)), "JSON lines", warnings); }
      catch { /* Keep malformed lines visible in the plain-text view. */ }
    }
    const first = text.split(/\r?\n/, 1)[0];
    const delimiter = /\.tsv$/i.test(filename) || first.includes("\t") ? "\t" : first.includes(",") ? "," : first.includes(";") ? ";" : null;
    if (delimiter && (/\.(csv|tsv)$/i.test(filename) || first.split(delimiter).length > 2 || (lines[1] && lines[1].includes(delimiter)))) {
      const data = parseDelimited(text, delimiter);
      const headings = data.shift() || [];
      const width = Math.max(headings.length, ...data.map(row => row.length), 0);
      const columns = Array.from({ length: Math.min(width, 30) }, (_, index) => ({ key: `c${index}`, label: headings[index] || `Column ${index + 1}` }));
      if (width > 30) warnings.push("Only the first 30 columns are shown.");
      return result(delimiter === "\t" ? "TSV" : "CSV", columns, data.map(row => Object.fromEntries(columns.map((column, index) => [column.key, row[index] || ""]))), warnings);
    }
    const rows = text.split(/\r?\n/, MAX_ROWS + 1).map((message, index) => {
      const timestamp = message.match(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?|\b[A-Z][a-z]{2} +\d{1,2} \d{2}:\d{2}:\d{2}/)?.[0] || "";
      const level = message.match(/\b(TRACE|DEBUG|INFO|NOTICE|WARN(?:ING)?|ERROR|CRITICAL|FATAL|ALERT|EMERG)\b/i)?.[0].toUpperCase() || "";
      const source = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] || "";
      return { line: index + 1, timestamp, level, source, message };
    });
    return result("Text / log", [{ key: "line", label: "Line" }, { key: "timestamp", label: "Timestamp" }, { key: "level", label: "Level" }, { key: "source", label: "Source" }, { key: "message", label: "Message" }], rows, warnings);
  }
  function hex(bytes) { return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join(" "); }
  function printable(bytes) { return Array.from(bytes, byte => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : byte === 10 || byte === 13 || byte === 9 ? " " : ".").join(""); }
  function packetRow(bytes, linkType, timestamp, originalLength) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0, etherType = null;
    const row = { timestamp, protocol: `Link ${linkType}`, source: "", destination: "", length: originalLength, message: "", hex: hex(bytes.slice(0, 512)) };
    if (linkType === 1 && bytes.length >= 14) {
      etherType = view.getUint16(12); offset = 14;
      for (let count = 0; count < 2 && [0x8100, 0x88a8].includes(etherType) && offset + 4 <= bytes.length; count++) { etherType = view.getUint16(offset + 2); offset += 4; }
    } else if (linkType === 113 && bytes.length >= 16) { etherType = view.getUint16(14); offset = 16; }
    else if (linkType === 276 && bytes.length >= 20) { etherType = view.getUint16(0); offset = 20; }
    else if ([101, 228, 229].includes(linkType) && bytes.length) etherType = bytes[0] >> 4 === 6 ? 0x86dd : 0x0800;
    let transport = null, protocol = null, fragmented = false;
    if (etherType === 0x0800 && offset + 20 <= bytes.length && bytes[offset] >> 4 === 4) {
      const ihl = (bytes[offset] & 15) * 4;
      if (ihl >= 20 && offset + ihl <= bytes.length) {
        row.source = Array.from(bytes.slice(offset + 12, offset + 16)).join(".");
        row.destination = Array.from(bytes.slice(offset + 16, offset + 20)).join(".");
        protocol = bytes[offset + 9]; transport = offset + ihl;
        fragmented = (view.getUint16(offset + 6) & 0x1fff) !== 0;
      }
    } else if (etherType === 0x86dd && offset + 40 <= bytes.length) {
      const address = start => Array.from({ length: 8 }, (_, index) => view.getUint16(start + index * 2).toString(16)).join(":");
      row.source = address(offset + 8); row.destination = address(offset + 24);
      protocol = bytes[offset + 6]; transport = offset + 40;
    }
    if (protocol != null) {
      row.protocol = ({ 6: "TCP", 17: "UDP", 1: "ICMP", 58: "ICMPv6", 2: "IGMP" })[protocol] || `IP ${protocol}`;
      if (!fragmented && [6, 17].includes(protocol) && transport + 4 <= bytes.length) {
        const sourcePort = view.getUint16(transport), destinationPort = view.getUint16(transport + 2);
        row.source = (row.source.includes(":") ? `[${row.source}]` : row.source) + `:${sourcePort}`;
        row.destination = (row.destination.includes(":") ? `[${row.destination}]` : row.destination) + `:${destinationPort}`;
      }
    } else if (etherType === 0x0806) row.protocol = "ARP";
    row.message = printable(bytes.slice(0, 2048));
    if (root.CTFTraffic) row._packet = root.CTFTraffic.decodePacket(bytes, linkType);
    return row;
  }
  function timestamp(seconds) {
    const date = new Date(seconds * 1000);
    return Number.isFinite(date.getTime()) ? date.toISOString() : String(seconds);
  }
  function parseCapture(buffer) {
    const view = new DataView(buffer), rows = [], warnings = [];
    if (view.byteLength < 4) throw new Error("Capture header is incomplete.");
    const magic = view.getUint32(0, false);
    let format = "PCAP";
    if (magic === 0x0a0d0d0a) {
      format = "PCAPNG";
      let offset = 0, little = true, interfaces = [];
      while (offset < view.byteLength && rows.length < MAX_ROWS) {
        if (offset + 12 > view.byteLength) throw new Error("Truncated PCAPNG block header.");
        const isSection = view.getUint32(offset, false) === 0x0a0d0d0a;
        if (isSection) {
          const order = view.getUint32(offset + 8, false);
          if (![0x1a2b3c4d, 0x4d3c2b1a].includes(order)) throw new Error("Invalid PCAPNG byte order.");
          little = order === 0x4d3c2b1a; interfaces = [];
        }
        const type = view.getUint32(offset, little), length = view.getUint32(offset + 4, little);
        if (length < 12 || length % 4 || offset + length > view.byteLength || view.getUint32(offset + length - 4, little) !== length) throw new Error("Invalid or truncated PCAPNG block.");
        if (isSection && length < 28) throw new Error("Invalid PCAPNG section.");
        if (type === 1) {
          if (length < 20) throw new Error("Invalid PCAPNG interface.");
          const info = { type: view.getUint16(offset + 8, little), snap: view.getUint32(offset + 12, little), resolution: 1e6, timeOffset: 0 };
          let option = offset + 16;
          while (option + 4 <= offset + length - 4) {
            const code = view.getUint16(option, little), size = view.getUint16(option + 2, little); option += 4;
            if (option + size > offset + length - 4) throw new Error("Invalid PCAPNG interface option.");
            if (code === 0) break;
            if (code === 9 && size === 1) { const value = view.getUint8(option); info.resolution = value & 128 ? 2 ** (value & 127) : 10 ** value; }
            if (code === 14 && size === 8) info.timeOffset = Number(view.getBigInt64(option, little));
            option += Math.ceil(size / 4) * 4;
          }
          interfaces.push(info);
        } else if (type === 6) {
          if (length < 32) throw new Error("Invalid PCAPNG packet block.");
          const info = interfaces[view.getUint32(offset + 8, little)];
          if (!info) throw new Error("PCAPNG packet references an unknown interface.");
          const captured = view.getUint32(offset + 20, little);
          if (captured > length - 32) throw new Error("Truncated PCAPNG packet.");
          const ticks = view.getUint32(offset + 12, little) * 4294967296 + view.getUint32(offset + 16, little);
          rows.push(packetRow(new Uint8Array(buffer, offset + 28, captured), info.type, timestamp(ticks / info.resolution + info.timeOffset), view.getUint32(offset + 24, little)));
        } else if (type === 3) {
          if (length < 16 || !interfaces[0]) throw new Error("Invalid PCAPNG simple packet.");
          const original = view.getUint32(offset + 8, little), info = interfaces[0];
          const captured = Math.min(original, info.snap || original);
          if (captured > length - 16) throw new Error("Truncated PCAPNG simple packet.");
          rows.push(packetRow(new Uint8Array(buffer, offset + 12, captured), info.type, "", original));
        }
        offset += length;
      }
      if (offset < view.byteLength) warnings.push("Capture display limited to the first 10,000 packets.");
    } else {
      if (view.byteLength < 24) throw new Error("PCAP header is incomplete.");
      const little = [0xd4c3b2a1, 0x4d3cb2a1].includes(magic);
      if (![0xd4c3b2a1, 0x4d3cb2a1, 0xa1b2c3d4, 0xa1b23c4d].includes(magic)) throw new Error("Unsupported capture header.");
      const nano = [0x4d3cb2a1, 0xa1b23c4d].includes(magic), linkType = view.getUint32(20, little) & 0xffff;
      let offset = 24;
      while (offset < view.byteLength && rows.length < MAX_ROWS) {
        if (offset + 16 > view.byteLength) throw new Error("Truncated PCAP packet header.");
        const captured = view.getUint32(offset + 8, little), original = view.getUint32(offset + 12, little);
        const seconds = view.getUint32(offset, little) + view.getUint32(offset + 4, little) / (nano ? 1e9 : 1e6);
        offset += 16;
        if (captured > view.byteLength - offset) throw new Error("Truncated PCAP packet data.");
        rows.push(packetRow(new Uint8Array(buffer, offset, captured), linkType, timestamp(seconds), original)); offset += captured;
      }
      if (offset < view.byteLength) warnings.push("Capture display limited to the first 10,000 packets.");
    }
    warnings.push("Payload text shows up to 2,048 bytes per packet; hex shows up to 512. Encrypted payloads are not decrypted. IPv6 extension headers are not decoded.");
    return result(format, [ { key: "timestamp", label: "Timestamp (UTC)" }, { key: "protocol", label: "Protocol" }, { key: "source", label: "Source" }, { key: "destination", label: "Destination" }, { key: "length", label: "Bytes" }, { key: "message", label: "Packet text" }, { key: "hex", label: "Hex" } ], rows, warnings);
  }
  function organizeFile(buffer, filename) {
    const bytes = new Uint8Array(buffer), magic = bytes.length >= 4 ? new DataView(buffer).getUint32(0, false) : 0;
    if ([0x0a0d0d0a, 0xd4c3b2a1, 0x4d3cb2a1, 0xa1b2c3d4, 0xa1b23c4d].includes(magic) || /\.(pcap|pcapng|cap)$/i.test(filename)) return parseCapture(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return organizeText(new TextDecoder("utf-16le").decode(bytes), filename);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return organizeText(new TextDecoder("utf-16be").decode(bytes), filename);
    const sample = bytes.slice(0, 4096);
    const controls = sample.filter(byte => byte === 0 || (byte < 32 && ![9, 10, 13].includes(byte))).length;
    if (controls > sample.length * 0.05) {
      const rows = [];
      for (let offset = 0; offset < Math.min(bytes.length, 65536); offset += 16) rows.push({ offset: offset.toString(16).padStart(8, "0"), hex: hex(bytes.slice(offset, offset + 16)), message: printable(bytes.slice(offset, offset + 16)) });
      return result("Binary hex/text", [{ key: "offset", label: "Offset (hex)" }, { key: "hex", label: "Hex" }, { key: "message", label: "Text" }], rows, ["This binary format is shown as hex/text, not decoded as traffic. Display limited to 64 KB."]);
    }
    return organizeText(new TextDecoder().decode(bytes), filename);
  }
  function searchText(row) { return Object.entries(row).filter(([key]) => !key.startsWith("_")).map(([,value]) => value).join(" "); }
  function regexTask({ pattern, flags, input = "", rows = null }) {
    if (!pattern || pattern.length > 200) throw new Error("Enter a pattern up to 200 characters.");
    if (!/^[imsu]*$/.test(flags) || new Set(flags).size !== flags.length) throw new Error("Flags may contain i, m, s, and u once each.");
    const regex = new RegExp(pattern, flags + (Array.isArray(rows) ? "" : "g"));
    if (Array.isArray(rows)) {
      const indices = [];
      for (let index = 0; index < rows.length; index++) if (regex.test(rows[index])) indices.push(index);
      return indices;
    }
    const matches = [];
    let match;
    while ((match = regex.exec(input)) && matches.length < 100) {
      matches.push({ index: match.index, text: match[0], groups: match.slice(1) });
      if (match[0] === "") regex.lastIndex += flags.includes("u") && input.codePointAt(regex.lastIndex) > 65535 ? 2 : 1;
    }
    return { matches, limitReached: matches.length === 100 };
  }
  function csv(data, rows) {
    const quote = value => '"' + String(value ?? "").replace(/^\s*[=+@\-]/, "'$&").replace(/"/g, '""') + '"';
    return [data.columns.map(column => quote(column.label)).join(","), ...rows.map(row => data.columns.map(column => quote(row[column.key])).join(","))].join("\r\n");
  }
  const api = { what3words, organizeText, organizeFile, parseCapture, searchText, regexTask, csv };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CTFViewer = api;
})(typeof window !== "undefined" ? window : globalThis);
