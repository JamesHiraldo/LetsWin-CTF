const assert = require("node:assert/strict");
const C = require("../core.js");

assert.equal(C.transformText("flag{ok}", "base64", "encode"), "ZmxhZ3tva30=");
assert.equal(C.transformText("ZmxhZ3tva30=", "base64", "decode"), "flag{ok}");
assert.equal(C.transformText("6869", "hex", "decode"), "hi");
assert.equal(C.transformText("uryyb", "rot13", "decode"), "hello");
assert.throws(() => C.transformText("zz", "hex", "decode"));

const url = C.inspectUrl("https://example.org/a?x=1&x=2");
assert.equal(url.host, "example.org");
assert.deepEqual(url.parameters.map(item => item.value), ["1", "2"]);
assert.throws(() => C.inspectUrl("javascript:alert(1)"));

assert.equal(C.identifyHash("a".repeat(64))[0], "SHA-256");
assert.equal(C.fileSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])).type, "PNG image");
assert.deepEqual(C.extractStrings(Uint8Array.from([65, 66, 67, 68, 69, 0, 70, 71, 72, 73, 74])), ["ABCDE", "FGHIJ"]);
assert.equal(C.entropy(Uint8Array.from([0, 0, 1, 1])), 1);
assert.deepEqual(C.extractIndicators("See https://example.org/a and alice@example.org at 192.0.2.1").ipv4, ["192.0.2.1"]);
assert.equal(C.searchLogs("one\ntwo", "two").matches[0].line, 2);
assert.deepEqual(C.cidrInfo("192.168.1.5/24"), {
  network: "192.168.1.0", mask: "255.255.255.0", last: "192.168.1.255", addresses: 256, prefix: 24
});
assert.equal(C.sha256Bytes(new TextEncoder().encode("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
assert.equal(C.sha256Bytes(new Uint8Array()), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
assert.equal(C.matchSha256Wordlist(C.sha256Bytes(new TextEncoder().encode("flag")), "test\nflag\nother").match, "flag");

// One Ethernet/IPv4/TCP packet in a classic little-endian PCAP.
const packet = new Uint8Array(54);
packet.set([0x08, 0x00], 12);
packet[14] = 0x45;
packet[23] = 6;
packet.set([192, 0, 2, 1], 26);
packet.set([198, 51, 100, 2], 30);
const pcap = new ArrayBuffer(24 + 16 + packet.length);
const view = new DataView(pcap);
view.setUint32(0, 0xa1b2c3d4, true);
view.setUint32(20, 1, true);
view.setUint32(24 + 8, packet.length, true);
view.setUint32(24 + 12, packet.length, true);
new Uint8Array(pcap, 40).set(packet);
const summary = C.parsePcap(pcap);
assert.equal(summary.packets, 1);
assert.equal(summary.protocols.TCP, 1);
assert.equal(summary.conversations[0].pair, "192.0.2.1 → 198.51.100.2");
assert.throws(() => C.parsePcap(new ArrayBuffer(8)));

console.log("Core tests passed.");
