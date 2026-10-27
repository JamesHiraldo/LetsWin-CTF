/* Linked resources: user selections plus gregalletti/CTF_tools (reviewed 2026-10-26). */
(function (root) {
  "use strict";
  const requested = [
    ["osint", "what3words", "Search three-word map addresses", "https://what3words.com/", "Maps & locations"],
    ["crypto", "md5decrypt", "Hash lookup, encodings, ciphers, XOR, and network tools", "https://md5decrypt.net/en/Sha256/", "Top choice", { featured: true, note: "Some hash matches require payment; use only free features where game rules require it." }],
    ["crypto", "TunnelsUP Hash Analyzer", "Identify possible hash formats", "https://www.tunnelsup.com/hash-analyzer/", "Hash identification"],
    ["crypto", "binsec HashLookup", "Lookup unsalted SHA-1, MD5, and NTLM hashes", "https://binsec.tools/lookup/hash/", "Hash lookup"],
    ["crypto", "CrackStation", "LM, NTLM, MD2, MD4, MD5, MD5(MD5_hex), MD5-half, SHA1/224/256/384/512, RIPEMD160, Whirlpool, MySQL 4.1+, QubesV3.1BackupDefaults", "https://crackstation.net/", "Hash lookup"],
    ["crypto", "Cryptii", "A1Z26 and other cipher conversions", "https://cryptii.com/pipes/a1z26-cipher/", "Ciphers"],
    ["network", "Text to PCAP", "Convert packet hex text into a capture", "https://hex2pcap.voipanalyzertool.com/", "Traffic conversion", { note: "Gateway and certificate-validation errors occurred during checks; the requested link is retained." }],
    ["network", "QR Code Decoder", "Read content from QR images", "https://www.qr-codes.com/decoder", "QR & encoded data"]
  ];
  // Every tool/resource link in the source README is represented here, including training.
  const imported = [
    ["training", "picoCTF", "CTF practice", "https://picoctf.org/", "Training"],
    ["training", "capturetheflag", "Learning resources", "https://capturetheflag.it/risorse/come-imparo", "Training"],
    ["training", "OverTheWire", "Wargames", "https://overthewire.org/wargames/", "Training"],
    ["training", "pwnable.kr", "Binary challenges", "http://pwnable.kr/", "Training"],
    ["forensics", "CTF Katana", "CTF toolkit collection", "https://github.com/JohnHammond/ctf-katana", "CTF toolkits"],
    ["crypto", "CyberChef", "Data conversions", "https://gchq.github.io/CyberChef/", "Encoding"],
    ["forensics", "HexEd.it", "Hex editor", "https://hexed.it/", "Files & disk"],
    ["crypto", "RapidTables Converter", "ASCII and base conversion", "https://www.rapidtables.com/convert/number/ascii-hex-bin-dec-converter.html", "Encoding"],
    ["crypto", "XOR Calculator", "XOR operations", "http://xor.pw/", "Cryptanalysis"],
    ["web", "Save All Resources", "Browser resource saver", "https://chrome.google.com/webstore/detail/save-all-resources/abpdnfjocnmdomablahdcfnoggeeiedb?hl=en-US", "Browser utilities"],
    ["osint", "GitHub Secrets", "Repository history research", "https://github.com/neodyme-labs/github-secrets", "Repository research"],
    ["crypto", "ZIP Password Recovery", "ZIP recovery service", "https://passwordrecovery.io/zip-file-password-removal/", "Passwords"],
    ["forensics", "Debuggex", "RegEx diagrams", "https://www.debuggex.com/", "Logs & text"],
    ["crypto", "ASCII Table", "Character reference", "http://www.asciitable.com/", "Encoding"],
    ["crypto", "dCode", "Cipher utilities", "https://www.dcode.fr", "Ciphers"],
    ["crypto", "quipqiup", "Substitution solver", "https://quipqiup.com/", "Ciphers"],
    ["crypto", "Defuse Big Number Calculator", "Integer arithmetic", "https://defuse.ca/big-number-calculator.htm", "Mathematics"],
    ["crypto", "CrypTool RSA Calculator", "RSA parameters", "https://www.cryptool.org/en/cto/rsa-step-by-step/", "Cryptanalysis"],
    ["crypto", "Modular Inverse", "Modular arithmetic", "https://www.dcode.fr/modular-inverse", "Mathematics"],
    ["crypto", "RsaCtfTool", "RSA toolkit", "https://github.com/Ganapati/RsaCtfTool", "Cryptanalysis"],
    ["crypto", "FactorDB", "Integer factorization database", "http://factordb.com/", "Mathematics"],
    ["crypto", "CrackStation", "Hash lookup", "https://crackstation.net/", "Hash lookup"],
    ["crypto", "Guballa Vigenere Solver", "Vigenere analysis", "https://www.guballa.de/vigenere-solver", "Ciphers"],
    ["crypto", "Guballa Substitution Solver", "Substitution analysis", "https://www.guballa.de/substitution-solver", "Ciphers"],
    ["crypto", "SageCell", "Online Sage environment", "https://sagecell.sagemath.org/", "Mathematics"],
    ["crypto", "Crunch", "Wordlist generator", "https://tools.kali.org/password-attacks/crunch", "Passwords"],
    ["crypto", "Online Hash Crack", "Hash recovery service", "https://www.onlinehashcrack.com/", "Hash lookup"],
    ["crypto", "Hash Identifier", "Hash format tool", "https://tools.kali.org/password-attacks/hash-identifier", "Hash identification"],
    ["crypto", "Morse Code Translator", "Morse conversion", "https://morsecode.world/international/translator.html", "Encoding"],
    ["crypto", "gmpy2", "Precision arithmetic library", "https://gmpy2.readthedocs.io/en/stable/overview.html", "Mathematics"],
    ["crypto", "Quadibloc Ciphers", "Cipher reference", "http://www.quadibloc.com/crypto/intro.htm", "Ciphers"],
    ["crypto", "Symbolic Ciphers", "Symbol cipher reference", "https://www.dcode.fr/symbols-ciphers", "Ciphers"],
    ["forensics", "Aperi'Solve", "Image steganalysis", "https://aperisolve.fr/", "Steganography"],
    ["forensics", "StegOnline", "Image bit-plane analysis", "https://stegonline.georgeom.net", "Steganography"],
    ["forensics", "Stegsolve", "Image inspection", "https://github.com/eugenekolo/sec-tools/tree/master/stego/stegsolve/stegsolve", "Steganography"],
    ["forensics", "Steganography Online", "Image encoding", "https://stylesuxx.github.io/steganography/", "Steganography"],
    ["forensics", "Futureboy Steganography", "Hidden-data decoding", "https://futureboy.us/stegano/decinput.html", "Steganography"],
    ["forensics", "Image Color Picker", "Color inspection", "https://imagecolorpicker.com/", "Images"],
    ["forensics", "Stegseek", "Steghide recovery", "https://github.com/RickdeJager/stegseek", "Steganography"],
    ["forensics", "steghide Manual", "Steghide documentation", "http://steghide.sourceforge.net/documentation/manpage.php", "Steganography"],
    ["forensics", "zsteg", "PNG/BMP analysis", "https://github.com/zed-0xff/zsteg", "Steganography"],
    ["web", "CSP Evaluator", "CSP analysis", "https://csp-evaluator.withgoogle.com/", "Web analysis"],
    ["osint", "Subdomain Finder", "Subdomain research", "https://subdomainfinder.c99.nl/index.php", "Infrastructure"],
    ["osint", "Google Certificate Transparency", "Certificate research", "https://transparencyreport.google.com/https/certificates", "Infrastructure"],
    ["web", "Traversal Archives", "Archive test samples", "https://github.com/jwilk/traversal-archives", "Testing references"],
    ["web", "CSP Cheatsheet", "CSP reference", "https://six2dez.gitbook.io/pentest-book/enumeration/web/csp", "Testing references"],
    ["web", "JSONBee Endpoints", "JSONP reference", "https://github.com/zigoo0/JSONBee/blob/master/jsonp.txt", "Testing references"],
    ["web", "PayloadsAllTheThings", "Testing reference", "https://github.com/swisskyrepo/PayloadsAllTheThings", "Testing references"],
    ["forensics", "Syscall Reference", "System call tables", "https://syscalls.w3challs.com/", "Binary analysis & reversing"],
    ["forensics", "Online Assembler / Disassembler", "Assembly conversion", "https://defuse.ca/online-x86-assembler.htm#disassembly", "Binary analysis & reversing"],
    ["forensics", "Binary Ninja Cloud", "Binary decompiler", "https://cloud.binary.ninja/", "Binary analysis & reversing"],
    ["forensics", "Dogbolt", "Decompiler comparison", "https://dogbolt.org/", "Binary analysis & reversing"],
    ["forensics", "Forensically", "Image analysis", "https://29a.ch/photo-forensics/#forensic-magnifier", "Images"],
    ["forensics", "Autopsy", "Disk investigation", "https://www.sleuthkit.org/autopsy/", "Files & disk"],
    ["forensics", "Foremost", "File carving", "https://tools.kali.org/forensics/foremost", "Files & disk"],
    ["osint", "Skrapp LinkedIn Email Finder", "Email research", "https://skrapp.io/tutorials/linkedin-email-finder", "Identity"],
    ["osint", "Wayback Machine", "Web archives", "https://archive.org/web/", "Archives"],
    ["osint", "Sherlock", "Username research", "https://github.com/sherlock-project/sherlock", "Identity"],
    ["osint", "Epieos", "Email research", "https://epieos.com/", "Identity"],
    ["forensics", "Java Decompilers", "Java/APK decompilation", "http://www.javadecompilers.com/", "Android & Java"],
    ["forensics", "MobSF", "Mobile analysis framework", "https://github.com/MobSF/Mobile-Security-Framework-MobSF", "Android & Java"],
    ["forensics", "JADX", "Android decompilation", "https://github.com/skylot/jadx", "Android"]
  ];
  function apply(categories) {
    for (const entry of [...requested, ...imported]) {
      const [id, ...resource] = entry;
      if (id === "training") continue;
      const category = categories.find(item => item.id === id);
      if (!category) throw new Error(`Unknown catalog category: ${id}`);
      const key = resource[0].toLowerCase();
      if (category.resources.some(item => item[0].toLowerCase() === key || item[2] === resource[2])) continue;
      category.resources.push(resource);
    }
    const crypto = categories.find(item => item.id === "crypto");
    crypto.resources.sort((a, b) => Number(Boolean(b[4]?.featured)) - Number(Boolean(a[4]?.featured)));
    return categories;
  }
  const api = { apply, requested, imported, training: imported.filter(entry => entry[0] === "training").map(entry => entry.slice(1)), source: "https://github.com/gregalletti/CTF_tools" };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CTFResources = api;
})(typeof window !== "undefined" ? window : globalThis);
