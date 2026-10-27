(function(root){
  "use strict";
  const guides={
    osint:{title:"OSINT: turn clues into evidence",steps:["Record the original clue and source URL in a saved challenge.","Inspect URLs and extract indicators before following links.","Check timestamps, context, and independent sources. A matching username alone does not establish identity.","For a three-word location, open the exact what3words address and compare visible landmarks.","Save the source, observation, and confidence with your candidate flag."],example:"Clue: ///clip.apples.leap → what3words Map Search → compare the map with the challenge image.",tools:["what3words","iocs","url","image"]},
    crypto:{title:"Crypto: identify, transform, verify",steps:["Preserve the original text and inspect alphabet, length, separators, and padding.","Try reversible encodings first; Base64 is encoding, not encryption.","Use hash-format hints to narrow candidates. A 32-digit hex string can be MD5, MD4, or NTLM.","Try classical ciphers only when the clue fits; record keys and each transformation.","Save a conversion recipe and verify its final output against the expected flag format."],example:"ZmxhZ3tkZW1vfQ== → Base64 decode → flag{demo}. Caesar: Khoor with shift 3 → Hello.",tools:["codec","recipes","ciphers","digests","hashid","wordlist"]},
    forensics:{title:"Forensics: preserve and inspect",steps:["Keep the original file and record its filename, size, and SHA-256.","Compare its extension with magic bytes; extract strings before making changes.","For images, inspect metadata, channels, bit planes, QR content, and appended bytes.","Organize logs; filter by UTC range, group by source, and inspect duplicate rows.","Save the exact offsets, transformations, and relevant results in the challenge workspace."],example:"An image with a .jpg extension may be PNG. File Triage checks its signature; Image Lab checks EXIF and bytes after the image end marker.",tools:["file","hash","image","logs","regex","code"]},
    web:{title:"Web: follow data and trust boundaries",steps:["Read the challenge scope and record the permitted host and endpoints.","Inspect the supplied URL, parameters, response headers, and cookies.","Decode JWT claims locally; decoding does not verify a signature.","Use the linked proxy tools to observe an authorized request and change one variable at a time.","Record a reproducible observation and candidate flag. Submit manually through the competition UI."],example:"A JWT payload may contain a role claim. Decoding shows its value but does not establish whether the server trusts it.",tools:["url","jwt","codec","regex","code"]},
    network:{title:"Network: reconstruct the conversation",steps:["Record the capture filename, size, and hash before inspection.","Organize the capture to locate endpoints, ports, and interesting times.","Open Stream & Protocol Analysis to inspect TCP directions and DNS records.","Check gap and conflict counts before trusting a reconstructed stream. Export complete HTTP bodies only.","For encrypted or unsupported traffic, open Wireshark and record the display filter used."],example:"Wireshark display filters: dns, http, tcp.stream eq 0. These are Wireshark filters, not the app's JavaScript RegEx syntax.",tools:["logs","streams","pcap","cidr"]}
  };
  const examples={
    "Wireshark":"Open a capture, apply dns or http, then select Follow → TCP Stream.",
    "TShark":"tshark -r challenge.pcap -Y dns",
    "ExifTool":"exiftool challenge.jpg",
    "Hashcat":"hashcat --help lists supported hash modes; choose the mode only after identifying the format.",
    "John the Ripper":"john --wordlist=words.txt hashes.txt",
    "CyberChef":"Add From Base64; input ZmxhZ3tkZW1vfQ==; output flag{demo}.",
    "regex101":"Choose the JavaScript flavor; try flag\\{[^}]+\\} against challenge text.",
    "ripgrep":"rg 'flag\\{[^}]+\\}' challenge.txt",
    "what3words":"Search ///clip.apples.leap on the official map.",
    "Nmap":"nmap -sV 127.0.0.1 (a local lab example; use only an authorized target)."
  };
  function resourceInfo(resource,category="") {
    const [name,detail,url,group,meta={}]=resource;const browser=!/github\.com|gitlab\.com/.test(url)&&/what3words|cryptii|md5decrypt|binsec\.tools|crackstation|tunnelsup|qr-codes|hex2pcap|regex101|crt\.sh|web\.archive|gchq\.github\.io/.test(url);
    const context=category.toLowerCase()+" "+group.toLowerCase();
    let example=examples[name];
    if(!example&&/hash|password|crack/i.test(name+detail))example="Try a known practice digest first, such as MD5('hello') = 5d41402abc4b2a76b9719d911017c592. Confirm the selected hash format.";
    if(!example&&/encoding|cipher|crypto/.test(context))example="Start with a known sample such as Base64 ZmxhZ3tkZW1vfQ==. Check the documented operation and expected output before using challenge data.";
    if(!example&&/traffic|network/.test(context))example="Start with a small local practice capture. Identify one endpoint and compare its packets with the decoded output.";
    if(!example&&/osint|intelligence|identity|archive/.test(context))example="Start from a supplied public clue; record the query, source URL, timestamp, and independent corroboration.";
    if(!example)example=`Read the linked documentation for ${detail.toLowerCase()}; start with a small practice file or local lab and save the exact steps used.`;
    const pricing=/md5decrypt/i.test(url)?"Free features and paid lookup options; check the provider before use.":/burp/i.test(name)?"Community edition is free; other editions are paid.":browser?"Provider terms and any usage limits apply; current pricing is not verified.":"Check the linked license and current edition; pricing is not verified.";
    return {usage:`Use for ${detail.toLowerCase()}.`,example,platform:browser?"Web browser":"See the official installation guide for supported operating systems.",pricing,note:meta.note||""};
  }
  const api={guides,resourceInfo};root.CTFGuides=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
