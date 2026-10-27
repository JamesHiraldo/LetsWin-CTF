(function () {
  "use strict";

  const C = window.CTFCore;
  const V = window.CTFViewer;
  const R = window.CTFResources;
  const D = window.CTFDesk;
  const categories = [
    { id: "osint", icon: "◎", title: "Open Source Intelligence", short: "Inspect URLs, search three-word addresses, and extract indicators.", tools: ["url", "iocs", "what3words"], resources: [
      ["Sherlock", "Username research", "https://github.com/sherlock-project/sherlock", "Identity"],
      ["theHarvester", "Public-source discovery", "https://github.com/laramies/theHarvester", "Identity"],
      ["OWASP Amass", "Infrastructure mapping", "https://github.com/owasp-amass/amass", "Infrastructure"],
      ["crt.sh", "Certificate transparency search", "https://crt.sh/", "Infrastructure"],
      ["Wayback Machine", "Archived public pages", "https://web.archive.org/", "Archives"]
    ] },
    { id: "crypto", icon: "⌘", title: "Cryptography & Passwords", short: "Decode text, inspect digests, and test local wordlists.", tools: ["codec", "hash", "hashid", "wordlist"], resources: [
      ["CyberChef", "Encoding and decoding", "https://gchq.github.io/CyberChef/", "Encoding"],
      ["Hashcat", "GPU password recovery", "https://hashcat.net/hashcat/", "Passwords"],
      ["John the Ripper", "Password recovery", "https://www.openwall.com/john/", "Passwords"],
      ["RsaCtfTool", "RSA CTF analysis", "https://github.com/RsaCtfTool/RsaCtfTool", "Cryptanalysis"],
      ["xortool", "XOR analysis", "https://github.com/hellman/xortool", "Cryptanalysis"],
      ["SageMath", "Mathematics for cryptography", "https://www.sagemath.org/", "Cryptanalysis"]
    ] },
    { id: "forensics", icon: "▧", title: "Digital Forensics & Logs", short: "Triage files, search logs, and test regular expressions.", tools: ["file", "logs", "regex"], resources: [
      ["ExifTool", "File metadata", "https://exiftool.org/", "Files & disk"],
      ["Autopsy", "Disk investigation", "https://www.autopsy.com/", "Files & disk"],
      ["Binwalk", "Embedded files and firmware", "https://github.com/ReFirmLabs/binwalk", "Files & disk"],
      ["Volatility 3", "Memory analysis", "https://github.com/volatilityfoundation/volatility3", "Memory"],
      ["YARA-X", "Pattern matching", "https://virustotal.github.io/yara-x/", "Signatures"],
      ["regex101", "Regular-expression testing", "https://regex101.com/", "Logs & text"],
      ["ripgrep", "Fast text and file search", "https://github.com/BurntSushi/ripgrep", "Logs & text"],
      ["JADX", "Android app decompilation", "https://github.com/skylot/jadx", "Android"]
    ] },
    { id: "web", icon: "◇", title: "Web Application Security", short: "Inspect URLs and decode JWTs locally.", tools: ["url", "jwt"], resources: [
      ["Burp Suite Community", "Intercepting proxy", "https://portswigger.net/burp/downloads", "Proxy & inspection", { note: "The official installer includes Community and Professional; select Community for the free edition." }],
      ["OWASP ZAP", "Web testing proxy", "https://www.zaproxy.org/", "Proxy & inspection"],
      ["mitmproxy", "Interactive HTTP proxy", "https://mitmproxy.org/", "Proxy & inspection"],
      ["ffuf", "Content discovery", "https://github.com/ffuf/ffuf", "Discovery"],
      ["dirsearch", "Web path discovery", "https://github.com/maurosoria/dirsearch", "Discovery"],
      ["sqlmap", "SQL injection testing", "https://sqlmap.org/", "Testing"]
    ] },
    { id: "network", icon: "◈", title: "Network Traffic & Scanning", short: "Organize traffic, search captures, and calculate ranges.", tools: ["logs", "pcap", "cidr"], resources: [
      ["Wireshark", "Packet analysis GUI", "https://www.wireshark.org/", "Traffic"],
      ["TShark", "Packet analysis CLI", "https://www.wireshark.org/docs/man-pages/tshark.html", "Traffic"],
      ["Nmap", "Authorized scanning", "https://nmap.org/", "Scanning"],
      ["Scapy", "Packet inspection and crafting", "https://scapy.net/", "Traffic"],
      ["Aircrack-ng", "Wireless assessment", "https://www.aircrack-ng.org/", "Wireless"],
      ["Kismet", "Wireless discovery", "https://www.kismetwireless.net/", "Wireless"]
    ] }
  ];

  R.apply(categories);
  categories.find(c => c.id === "crypto").tools.push("digests", "ciphers", "recipes");
  categories.find(c => c.id === "forensics").tools.push("image", "code");
  categories.find(c => c.id === "web").tools.push("code");
  categories.find(c => c.id === "osint").tools.push("image");
  categories.find(c => c.id === "network").tools.push("streams");

  const tools = {
    url: { name: "URL Inspector", sub: "Passive inspection", desc: "Break a URL into its parts without visiting it." },
    what3words: { name: "what3words Map Search", sub: "Maps & locations", desc: "Open a three-word address such as ///clip.apples.leap on the official map." },
    iocs: { name: "Indicator Extractor", sub: "Public-source text", desc: "Find URLs, domains, email addresses, and IPv4 addresses in supplied text." },
    codec: { name: "Encoding Workbench", sub: "Encode & decode", desc: "Convert Base64, hexadecimal, URL encoding, and ROT13." },
    hash: { name: "SHA-256 Hasher", sub: "File & text hashes", desc: "Hash local text or a file in your browser." },
    hashid: { name: "Hash Type Hints", sub: "Password cracking", desc: "See possible algorithms from a digest's shape." },
    wordlist: { name: "Local SHA-256 Wordlist", sub: "Password cracking", desc: "Test up to 10,000 supplied candidates against one SHA-256 digest." },
    file: { name: "File Triage", sub: "Local file analysis", desc: "Inspect magic bytes and printable strings." },
    logs: { name: "Traffic & Log Viewer", sub: "Logs, text & captures", desc: "Organize logs, CSV, JSON, PCAP, and PCAPNG into searchable tables." },
    regex: { name: "RegEx Workbench", sub: "Logs & text", desc: "Test a JavaScript regular expression against local text." },
    jwt: { name: "JWT Decoder", sub: "Token inspection", desc: "Read a token's header and payload locally." },
    pcap: { name: "PCAP Quick View", sub: "Traffic analysis", desc: "Summarize a classic PCAP without uploading it." },
    cidr: { name: "IPv4 CIDR Calculator", sub: "Network ranges", desc: "Calculate network, mask, and address count." }
  };
  Object.assign(tools, D.tools);

  let mode = null;
  let currentCategory = null;
  let currentTool = null;
  let teamNotes = "";
  let logState = null;
  let session = 0;
  let filterRun = 0;
  const content = document.getElementById("content");
  const modeGate = document.getElementById("modeGate");
  const shell = document.getElementById("shell");

  function ensureMode() {
    if (!mode) throw new Error("Choose a game mode before using a tool.");
  }

  function selectMode(next) {
    if (next !== "individual" && next !== "team") return;
    mode = next;
    session++;
    logState = null;
    teamNotes = "";
    currentCategory = null;
    currentTool = null;
    modeGate.hidden = true;
    shell.hidden = false;
    const badge = document.getElementById("modeBadge");
    badge.textContent = next === "individual" ? "INDIVIDUAL GAME" : "TEAM GAME";
    badge.className = `badge ${next}`;
    D.enter(next);
    showHome();
  }

  function resetMode() {
    D.leave();
    mode = null;
    session++;
    logState = null;
    teamNotes = "";
    currentCategory = null;
    currentTool = null;
    content.replaceChildren();
    shell.hidden = true;
    modeGate.hidden = false;
  }

  function setNav(id) {
    document.querySelectorAll(".nav").forEach(button => button.classList.toggle("active", button.dataset.nav === id));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function resourceCard(resource, categoryTitle = "") {
    return D.resourceCard(resource, categoryTitle);
  }

  function groupedResources(category) {
    const groups = [...new Set(category.resources.map(resource => resource[3]))];
    return groups.map(group => `<div class="subheading">${group}</div><div class="resource-grid">
      ${category.resources.filter(resource => resource[3] === group).map(resource => resourceCard(resource)).join("")}</div>`).join("");
  }

  function showHome() {
    ensureMode();
    D.clearPage();
    currentCategory = null;
    currentTool = null;
    setNav("home");
    const cards = categories.map(category => `
      <button class="category-card" data-category="${category.id}">
        <div class="card-top"><span class="category-icon">${category.icon}</span><span class="card-arrow">↗</span></div>
        <h3>${category.title}</h3><p>${category.short}</p><small>${category.tools.length} built-in tools · curated resources</small>
      </button>`).join("");
    content.innerHTML = `
      <div class="hero"><div class="page-kicker">READY FOR YOUR NEXT CHALLENGE</div>
        <h1>Everything in one place.<br>Every flag starts somewhere.</h1>
        <p>Open a category to work with challenge files, text, and captures locally. Resource links lead to the tool makers' pages.</p>
        <div class="hero-strip"><div class="stat"><strong>05</strong><small>Challenge categories</small></div>
          <div class="stat"><strong>${Object.keys(tools).length}</strong><small>Built-in workbenches</small></div>
          <div class="stat"><strong>${mode === "individual" ? "SOLO" : "TEAM"}</strong><small>Current game mode</small></div></div>
      </div><h2 class="section-title">Explore categories</h2><div class="category-grid">${cards}</div>
      <div class="notice"><strong>Looking for a specific program?</strong> Browse <button class="inline-link" data-open-catalog="true">all ${categories.reduce((sum, category) => sum + category.resources.length, 0) + R.training.length} linked tools</button> by name or subcategory.</div>
      <div class="subheading">TRAINING & REFERENCES</div><div class="resource-grid">${R.training.map(resource => resourceCard(resource)).join("")}</div>
      <div class="notice"><strong>Session rules:</strong> ${mode === "individual"
        ? "Individual mode keeps collaboration and AI assistance unavailable."
        : "Team notes are available. AI is allowed only within the limits in your supplied rules; this version has no AI connection."}
        &nbsp; The app never connects to or submits answers on the competition platform.</div>
      ${mode === "team" ? `<div class="team-note"><div class="subheading" style="margin-top:0">TEAM NOTES</div>
          <p class="hint">Notes stay in this browser tab until you switch modes or close it. Copy them if you need to share with roster teammates.</p>
          <textarea id="teamNotes" placeholder="Capture observations for your official team..."></textarea>
          <div class="actions" style="margin-top:10px"><button class="secondary" id="copyNotes">Copy notes</button></div>
          <p class="hint" style="margin:18px 0 0">AI assistance is allowed in Team mode under your supplied limits: consumer-available models, up to $50/month, and up to 32 GB VRAM for local models. <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" data-external="true">Open ChatGPT manually ↗</a>. This app never sends challenge content or interacts with the game platform for an AI service.</p></div>` : ""}`;
    if (mode === "team") document.getElementById("teamNotes").value = teamNotes;
  }

  function showCategory(id) {
    ensureMode();
    const category = categories.find(item => item.id === id);
    if (!category) return;
    D.clearPage();
    currentCategory = id;
    currentTool = null;
    setNav(id);
    const cards = category.tools.map(toolId => `<button class="tool-card" data-tool="${toolId}">
      <strong>${tools[toolId].name} ↗</strong><p>${tools[toolId].desc}</p><span class="tag">${tools[toolId].sub}</span></button>`).join("");
    content.innerHTML = `<div class="section-head"><button class="back" data-back="home" aria-label="Back to overview">←</button><div class="page-kicker">CHALLENGE CATEGORY</div></div>
      <h1 class="page-title">${category.title}</h1><p class="page-intro">${category.short}</p>
      <div class="subheading">BUILT-IN TOOLS · WORK LOCALLY</div><div class="tool-grid">${cards}</div>
      <div class="subheading">EXTERNAL TOOL RESOURCES</div>${groupedResources(category)}
      <div class="notice">External resources open their own pages. Some services have paid or account-only features. Use features allowed by your game's rules. Additional catalog source: <a href="${R.source}" target="_blank" rel="noopener noreferrer" data-external="true">gregalletti/CTF_tools ↗</a>.</div>`;
  }

  function showCatalog() {
    ensureMode();
    D.clearPage();
    currentCategory = null;
    currentTool = null;
    setNav("catalog");
    content.innerHTML = `<div class="page-kicker">TOOL DIRECTORY</div><h1 class="page-title">Find a tool</h1>
      <p class="page-intro">Search ${Object.keys(tools).length} built-in workbenches and ${categories.reduce((sum, category) => sum + category.resources.length, 0) + R.training.length} linked tools and references.</p>
      <div class="workbench"><label class="field"><span>Search by tool, purpose, category, or subcategory</span><input id="catalogSearch" autocomplete="off" placeholder="Try: wireless, memory, RegEx..."></label>
      <div id="catalogResults"></div></div>`;
    renderCatalogResults("");
  }

  function renderCatalogResults(query) {
    const target = document.getElementById("catalogResults");
    if (!target) return;
    const needle = query.trim().toLocaleLowerCase();
    const seen = new Set();
    const builtins = categories.flatMap(category => category.tools.map(id => ({ category, id })))
      .filter(({ id }) => { if (seen.has(id)) return false; seen.add(id); return true; })
      .filter(({ category, id }) => !needle || [category.title, tools[id].name, tools[id].sub, tools[id].desc].join(" ").toLocaleLowerCase().includes(needle));
    const matches = [...categories, { title: "Training & references", resources: R.training }].flatMap(category => category.resources
      .filter(resource => !needle || [category.title, ...resource].join(" ").toLocaleLowerCase().includes(needle))
      .map(resource => ({ category, resource })));
    target.innerHTML = `${builtins.length ? `<div class="subheading">BUILT-IN TOOLS</div><div class="tool-grid">${builtins.map(({ category, id }) =>
      `<button class="tool-card" data-catalog-tool="${id}" data-from-category="${category.id}"><strong>${tools[id].name} ↗</strong><p>${tools[id].desc}</p><span class="tag">${category.title}</span></button>`).join("")}</div>` : ""}
      ${matches.length ? `<div class="subheading">EXTERNAL PROJECTS</div><div class="resource-grid">${matches.map(({ category, resource }) => resourceCard(resource, category.title)).join("")}</div>` : ""}
      ${!builtins.length && !matches.length ? `<p class="hint">No tools match that search.</p>` : ""}`;
  }

  function toolMarkup(id) {
    if (D.tools[id]) return D.markup(id);
    if (id === "what3words") return `<p class="hint">Enter a three-word address or an official what3words link. Open the map to see the location and coordinates; no API key is needed for this shortcut.</p><label class="field"><span>Three-word address</span><input id="wordsInput" placeholder="///clip.apples.leap"></label><button class="primary" data-run="what3words">Find map link</button>`;
    if (id === "url") return `<p class="hint">This only parses the URL. It does not visit the site.</p><label class="field"><span>URL</span><input id="urlInput" placeholder="https://example.org/path?key=value"></label><button class="primary" data-run="url">Inspect URL</button>`;
    if (id === "iocs") return `<p class="hint">Paste public-source text or challenge output. No lookup or upload occurs.</p><label class="field"><span>Source text</span><textarea id="iocInput" placeholder="Paste text containing URLs, domains, email addresses, or IPv4 addresses..."></textarea></label><button class="primary" data-run="iocs">Extract indicators</button>`;
    if (id === "codec") return `<label class="field"><span>Input text</span><textarea id="codecInput" placeholder="Paste text or encoded data..."></textarea></label>
      <div class="row"><label class="field"><span>Format</span><select id="codecFormat"><option value="base64">Base64</option><option value="hex">Hexadecimal</option><option value="url">URL encoding</option><option value="rot13">ROT13</option></select></label>
      <label class="field"><span>Action</span><select id="codecDirection"><option value="decode">Decode</option><option value="encode">Encode</option></select></label></div><button class="primary" data-run="codec">Convert text</button>`;
    if (id === "hash") return `<p class="hint">SHA-256 runs in your browser. File contents are not uploaded. Files up to 100 MB are supported.</p><label class="field"><span>Text</span><textarea id="hashText" placeholder="Text to hash..."></textarea></label>
      <div class="actions"><button class="primary" data-run="hashText">Hash text</button><label class="secondary" for="hashFile" style="cursor:pointer">Hash a file</label><input id="hashFile" type="file" style="display:none"></div>`;
    if (id === "hashid") return `<p class="hint">Digest length gives hints, not a definitive identification.</p><label class="field"><span>Hex digest</span><input id="hashInput" placeholder="Paste a hash..."></label><button class="primary" data-run="hashid">Show possibilities</button>`;
    if (id === "wordlist") return `<p class="hint">Tests up to 10,000 newline-separated candidate passwords locally. SHA-256 only; no network logins.</p>
      <label class="field"><span>SHA-256 digest</span><input id="wordlistHash" placeholder="64 hexadecimal characters"></label>
      <label class="field"><span>Candidate wordlist</span><textarea id="wordlistInput" placeholder="password\nletmein\nflag..."></textarea></label><button class="primary" data-run="wordlist">Test candidates</button>`;
    if (id === "file") return `<p class="hint">Reads at most the first 1 MB for strings and signatures. Nothing is uploaded.</p><label class="field"><span>Challenge file</span><input id="triageFile" type="file"></label><button class="primary" data-run="file">Inspect file</button>`;
    if (id === "logs") return `<p class="hint">Load text, CSV, TSV, JSON, JSONL, PCAP, or PCAPNG up to 20 MB. Other binary files get a hex/text view. Files stay in this tab.</p>
      <label class="field"><span>Paste logs or text</span><textarea id="logText" placeholder="Paste logs, CSV, JSON, or network output..."></textarea></label>
      <div class="actions"><button class="primary" data-run="logs">Organize pasted text</button><label class="secondary file-button">Open a file<input id="logFile" type="file"></label></div>
      <div class="viewer-filters"><label class="field"><span>Search the organized rows</span><input id="logFilter" placeholder="IP, error, flag pattern..."></label>
      <label class="field"><span>Search type</span><select id="logFilterMode"><option value="text">Text (ignore case)</option><option value="regex">RegEx</option></select></label>
      <label class="field"><span>RegEx flags</span><input id="logFlags" value="i" placeholder="i, m, s, u"></label>
      <button class="primary" id="filterLogs">Search rows</button></div>
      <div class="actions"><button class="secondary" id="clearLogFilter">Clear filter</button><button class="secondary" id="exportLogs">Export filtered rows as CSV</button></div>
      <div id="logViewer" class="log-viewer" aria-live="polite">Open a file or organize pasted text to view rows.</div>`;
    if (id === "regex") return `<p class="hint">JavaScript regular expressions run in a worker with a one-second limit. Only the first 100 matches are shown.</p>
      <label class="field"><span>Pattern (without / delimiters)</span><input id="regexPattern" placeholder="flag\\{[^}]+\\}"></label>
      <label class="field"><span>Flags</span><input id="regexFlags" value="i" placeholder="i, m, s, u"></label>
      <label class="field"><span>Text to search</span><textarea id="regexInput" placeholder="Paste local text or logs..."></textarea></label><button class="primary" data-run="regex">Find matches</button>`;
    if (id === "jwt") return `<p class="hint">Decodes only. It does not verify the signature or token validity.</p><label class="field"><span>JWT</span><textarea id="jwtInput" placeholder="eyJ..."></textarea></label><button class="primary" data-run="jwt">Decode token</button>`;
    if (id === "pcap") return `<p class="hint">Classic PCAP, up to 20 MB. Ethernet/IPv4 protocol and conversation counts; no packets are transmitted.</p><label class="field"><span>PCAP file</span><input id="pcapFile" type="file" accept=".pcap,.cap"></label><button class="primary" data-run="pcap">Summarize capture</button>`;
    if (id === "cidr") return `<label class="field"><span>IPv4 network</span><input id="cidrInput" placeholder="192.168.1.0/24"></label><button class="primary" data-run="cidr">Calculate range</button>`;
    return "";
  }

  function showTool(id) {
    ensureMode();
    if (!tools[id] || !currentCategory || !categories.find(category => category.id === currentCategory).tools.includes(id)) return;
    currentTool = id;
    content.innerHTML = `<div class="section-head"><button class="back" data-back="category" aria-label="Back to category">←</button><div class="page-kicker">${tools[id].sub.toUpperCase()}</div></div>
      <h1 class="page-title">${tools[id].name}</h1><p class="page-intro">${tools[id].desc}</p>
      <div class="workbench">${toolMarkup(id)}<div class="output" id="output" role="status" aria-live="polite">Your result will appear here.</div>
      <div class="actions" style="margin-top:10px"><button class="secondary" id="copyResult">Copy result</button></div></div>`;
    D.mount(id);
    if (id === "logs" && logState) {
      document.getElementById("logFilter").value = logState.query;
      document.getElementById("logFilterMode").value = logState.filterMode;
      document.getElementById("logFlags").value = logState.flags;
      renderLogViewer();
    }
  }

  function setLogData(data, name) {
    filterRun++;
    logState = { data, name, filtered: [...data.rows], query: "", filterMode: "text", flags: "i", sortKey: "number", ascending: true, page: 0 };
    document.getElementById("logFilter").value = "";
    D.newLogData(logState);
    renderLogViewer();
  }

  function sortedLogRows() {
    if (!logState) return [];
    const { sortKey, ascending } = logState;
    return [...D.logStats(logState.filtered)].sort((a, b) => {
      const left = a[sortKey] ?? "", right = b[sortKey] ?? "";
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true });
      return (ascending ? 1 : -1) * order;
    });
  }

  function renderLogViewer() {
    const target = document.getElementById("logViewer");
    if (!target || !logState) return;
    const rows = sortedLogRows(), pageCount = Math.max(1, Math.ceil(rows.length / 100));
    logState.page = Math.min(logState.page, pageCount - 1);
    target.replaceChildren();
    const label = document.createElement("p"); label.className = "hint";
    label.textContent = `${logState.name} · ${logState.data.format} · ${rows.length.toLocaleString()} of ${logState.data.rows.length.toLocaleString()} rows · page ${logState.page + 1}/${pageCount}`;
    target.appendChild(label);
    const scroll = document.createElement("div"); scroll.className = "table-scroll";
    const table = document.createElement("table"); table.className = "log-table";
    const head = document.createElement("thead"), header = document.createElement("tr");
    for (const column of logState.data.columns) {
      const th = document.createElement("th"), button = document.createElement("button");
      button.dataset.logSort = column.key;
      button.textContent = column.label + (logState.sortKey === column.key ? logState.ascending ? " ↑" : " ↓" : "");
      th.appendChild(button); header.appendChild(th);
    }
    head.appendChild(header); table.appendChild(head);
    const body = document.createElement("tbody");
    for (const row of rows.slice(logState.page * 100, (logState.page + 1) * 100)) {
      const tr = document.createElement("tr");
      for (const column of logState.data.columns) { const td = document.createElement("td"); td.textContent = D.formatLogCell(column.key, row[column.key]); tr.appendChild(td); }
      body.appendChild(tr);
    }
    table.appendChild(body); scroll.appendChild(table); target.appendChild(scroll);
    if (!rows.length) { const empty = document.createElement("p"); empty.textContent = "No rows match this search."; target.appendChild(empty); }
    const pager = document.createElement("div"); pager.className = "actions";
    for (const [text, step, disabled] of [["Previous", -1, logState.page === 0], ["Next", 1, logState.page + 1 >= pageCount]]) {
      const button = document.createElement("button"); button.className = "secondary"; button.textContent = text; button.dataset.logPage = String(step); button.disabled = disabled; pager.appendChild(button);
    }
    target.appendChild(pager);
    showOutput([`${logState.data.format}: ${rows.length} matching rows`, ...logState.data.warnings].join("\n"));
  }

  async function filterLogs() {
    ensureMode();
    if (!logState) { showOutput("Open a file or organize text first.", true); return; }
    const active = logState, run = ++filterRun, activeSession = session;
    const query = document.getElementById("logFilter").value, filterMode = document.getElementById("logFilterMode").value, flags = document.getElementById("logFlags").value;
    try {
      let filtered;
      if (!query) filtered = [...active.data.rows];
      else if (filterMode === "regex") {
        const indices = await regexWorker(query, flags, "", active.data.rows.map(V.searchText));
        filtered = indices.map(index => active.data.rows[index]);
      } else { const needle = query.toLocaleLowerCase(); filtered = active.data.rows.filter(row => V.searchText(row).toLocaleLowerCase().includes(needle)); }
      if (session !== activeSession || run !== filterRun || logState !== active || currentTool !== "logs") return;
      Object.assign(active, { filtered, query, filterMode, flags, page: 0 }); renderLogViewer();
    } catch (error) { if (session === activeSession && currentTool === "logs" && run === filterRun) showOutput(error.message, true); }
  }

  function exportLogs() {
    if (!logState) { showOutput("Organize a file or text first.", true); return; }
    const url = URL.createObjectURL(new Blob([V.csv(logState.data, sortedLogRows())], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "LetsWin-CTF-results.csv"; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showOutput(value, error = false) {
    const output = document.getElementById("output");
    if (!output) return;
    output.classList.toggle("error", error);
    output.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  async function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(value); return true; } catch { /* Use the local fallback. */ }
    }
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { /* Manual copy remains possible. */ }
    field.remove();
    return copied;
  }

  async function sha256(bytes) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const digest = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      } catch { /* Use the local fallback when Web Crypto is unavailable for file pages. */ }
    }
    if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("This browser's local SHA-256 fallback supports up to 20 MB. Try a browser with Web Crypto for larger files.");
    return C.sha256Bytes(new Uint8Array(bytes));
  }

  function regexWorker(pattern, flags, input = "", rows = null) {
    if (!pattern || pattern.length > 200) throw new Error("Enter a pattern up to 200 characters.");
    if (!/^[imsu]*$/.test(flags) || new Set(flags).size !== flags.length) throw new Error("Flags may contain i, m, s, and u once each.");
    if (input.length > 500000) throw new Error("Limit the search text to 500,000 characters.");
    const source = `self.onmessage = event => {
      try { self.postMessage((${V.regexTask.toString()})(event.data)); }
      catch (error) { self.postMessage({ error: error.message }); }
    };`;
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    return new Promise((resolve, reject) => {
      let worker;
      try { worker = new Worker(url); }
      catch (error) { URL.revokeObjectURL(url); reject(new Error("This browser cannot start the local RegEx worker.")); return; }
      const finish = () => { worker.terminate(); URL.revokeObjectURL(url); clearTimeout(timer); };
      const timer = setTimeout(() => { finish(); reject(new Error("The pattern took too long. Try a simpler expression.")); }, 1000);
      worker.onmessage = event => { finish(); event.data.error ? reject(new Error(event.data.error)) : resolve(event.data); };
      worker.onerror = () => { finish(); reject(new Error("The local RegEx worker failed.")); };
      worker.postMessage({ pattern, flags, input, rows });
    });
  }

  async function runTool(action) {
    ensureMode();
    if (!currentTool || (action !== currentTool && !(currentTool === "hash" && action === "hashText"))) return;
    const activeSession = session, activeOutput = document.getElementById("output");
    const output = (...args) => { if (session === activeSession && document.getElementById("output") === activeOutput) showOutput(...args); };
    try {
      if (action === "what3words") {
        const location = V.what3words(document.getElementById("wordsInput").value);
        output(location.address + "\n");
        const link = document.createElement("a"); link.href = location.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.dataset.external = "true"; link.textContent = "Open official what3words map ↗";
        document.getElementById("output").appendChild(link);
      }
      if (action === "url") output(C.inspectUrl(document.getElementById("urlInput").value));
      if (action === "iocs") {
        const input = document.getElementById("iocInput").value;
        if (input.length > 2_000_000) throw new Error("Limit indicator text to 2 million characters.");
        output(C.extractIndicators(input));
      }
      if (action === "codec") output(C.transformText(document.getElementById("codecInput").value, document.getElementById("codecFormat").value, document.getElementById("codecDirection").value));
      if (action === "hashText") output(`SHA-256\n${await sha256(new TextEncoder().encode(document.getElementById("hashText").value))}`);
      if (action === "hashid") output(C.identifyHash(document.getElementById("hashInput").value).join("\n"));
      if (action === "wordlist") output(C.matchSha256Wordlist(document.getElementById("wordlistHash").value, document.getElementById("wordlistInput").value));
      if (action === "file") {
        const file = document.getElementById("triageFile").files[0];
        if (!file) throw new Error("Choose a file first.");
        const bytes = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer());
        output({ name: file.name, sizeBytes: file.size, lastModified: new Date(file.lastModified).toISOString(), signature: C.fileSignature(bytes), sampleEntropyBitsPerByte: C.entropy(bytes), printableStrings: C.extractStrings(bytes) });
      }
      if (action === "logs") {
        const input = document.getElementById("logText").value;
        setLogData(V.organizeText(input), "Pasted text");
      }
      if (action === "regex") output(await regexWorker(document.getElementById("regexPattern").value, document.getElementById("regexFlags").value, document.getElementById("regexInput").value));
      if (action === "jwt") output(C.inspectJwt(document.getElementById("jwtInput").value));
      if (action === "pcap") {
        const file = document.getElementById("pcapFile").files[0];
        if (!file) throw new Error("Choose a PCAP file first.");
        if (file.size > 20 * 1024 * 1024) throw new Error("This first version accepts PCAP files up to 20 MB.");
        output(C.parsePcap(await file.arrayBuffer()));
      }
      if (action === "cidr") output(C.cidrInfo(document.getElementById("cidrInput").value));
    } catch (error) { output(error.message || String(error), true); }
  }

  D.init({categories, tools, output: showOutput, logState: () => logState, refreshLogs: () => { if(logState) {logState.page=0; renderLogViewer();} }, toolName: () => tools[currentTool]?.name || "Workbench", clearPage: () => {D.clearPage();currentTool=null;currentCategory=null;setNav("");}, openTool: id => {const category=categories.find(c => c.tools.includes(id));if(category){showCategory(category.id);showTool(id);}}});
  document.querySelectorAll(".mode-choice").forEach(button => button.addEventListener("click", () => selectMode(button.dataset.mode)));
  document.getElementById("changeMode").addEventListener("click", resetMode);
  document.querySelectorAll(".nav").forEach(button => button.addEventListener("click", () => {
    if (!mode) return;
    if (button.dataset.nav === "home") showHome();
    else if (button.dataset.nav === "catalog") showCatalog();
    else showCategory(button.dataset.nav);
  }));
  content.addEventListener("click", event => {
    if (!mode) return;
    const category = event.target.closest("[data-category]");
    const tool = event.target.closest("[data-tool]");
    const catalogTool = event.target.closest("[data-catalog-tool]");
    const run = event.target.closest("[data-run]");
    const back = event.target.closest("[data-back]");
    const sort = event.target.closest("[data-log-sort]");
    const page = event.target.closest("[data-log-page]");
    if (category) showCategory(category.dataset.category);
    else if (tool) showTool(tool.dataset.tool);
    else if (catalogTool) { showCategory(catalogTool.dataset.fromCategory); showTool(catalogTool.dataset.catalogTool); }
    else if (run) runTool(run.dataset.run);
    else if (back) back.dataset.back === "home" ? showHome() : showCategory(currentCategory);
    else if (event.target.closest("[data-open-catalog]")) showCatalog();
    else if (currentTool === "logs" && event.target.id === "filterLogs") filterLogs();
    else if (currentTool === "logs" && event.target.id === "clearLogFilter") { document.getElementById("logFilter").value = ""; filterLogs(); }
    else if (currentTool === "logs" && event.target.id === "exportLogs") exportLogs();
    else if (currentTool === "logs" && sort && logState) { logState.ascending = logState.sortKey === sort.dataset.logSort ? !logState.ascending : true; logState.sortKey = sort.dataset.logSort; logState.page = 0; renderLogViewer(); }
    else if (currentTool === "logs" && page && logState) { logState.page = Math.max(0, logState.page + Number(page.dataset.logPage)); renderLogViewer(); }
    else if (event.target.id === "copyResult") {
      copyText(document.getElementById("output").textContent).then(copied => { event.target.textContent = copied ? "Copied" : "Select and copy the result"; });
    }
    else if (event.target.id === "copyNotes" && mode === "team") {
      copyText(teamNotes).then(copied => { event.target.textContent = copied ? "Copied" : "Select and copy the notes"; });
    }
  });
  content.addEventListener("input", event => {
    if (mode === "team" && event.target.id === "teamNotes") teamNotes = event.target.value;
    if (mode && event.target.id === "catalogSearch") renderCatalogResults(event.target.value);
  });
  content.addEventListener("change", async event => {
    if (!mode) return;
    if (event.target.id === "logFile" && currentTool === "logs") {
      const input = event.target, activeSession = session;
      const file = input.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { showOutput("Viewer files must be 20 MB or smaller.", true); return; }
      try {
        const buffer = await file.arrayBuffer();
        if (session !== activeSession || currentTool !== "logs" || document.getElementById("logFile") !== input || input.files[0] !== file) return;
        setLogData(V.organizeFile(buffer, file.name), file.name);
      } catch (error) { if (session === activeSession && currentTool === "logs" && document.getElementById("logFile") === input) showOutput(error.message, true); }
      return;
    }
    if (event.target.id !== "hashFile" || currentTool !== "hash") return;
    const activeSession = session, activeOutput = document.getElementById("output");
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { showOutput("Hash files up to 100 MB in this version.", true); return; }
    try {
      const digest = await sha256(await file.arrayBuffer());
      if (session === activeSession && document.getElementById("output") === activeOutput && event.target.files[0] === file) showOutput(`${file.name}\nSHA-256\n${digest}`);
    } catch (error) { if (session === activeSession && document.getElementById("output") === activeOutput) showOutput(error.message || String(error), true); }
  });
  content.addEventListener("click", event => {
    if (event.target.closest("[data-external]") && !mode) event.preventDefault();
  });
})();
