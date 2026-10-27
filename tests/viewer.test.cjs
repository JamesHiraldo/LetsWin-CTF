const assert = require("node:assert/strict");
const V = require("../viewer.js");
const arrayBuffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

assert.deepEqual(V.what3words("///clip.apples.leap"), { address: "///clip.apples.leap", url: "https://what3words.com/clip.apples.leap" });
assert.equal(V.what3words("https://what3words.com/clip.apples.leap").address, "///clip.apples.leap");
assert.throws(() => V.what3words("https://what3words.com.evil.test/clip.apples.leap"));
assert.throws(() => V.what3words("javascript:alert(1)"));
assert.throws(() => V.what3words("one.two"));

const csv = V.organizeText('time,message\r\n10,"hello, ""world""\nnext"\r\n11,done', "input.csv");
assert.equal(csv.format, "CSV");
assert.equal(csv.rows.length, 2);
assert.equal(csv.rows[0].c1, 'hello, "world"\nnext');
assert.equal(V.organizeText("name,value\na,1").format, "CSV");
assert.equal(V.organizeText("a\tb\n1\t2", "file.tsv").format, "TSV");
assert.throws(() => V.organizeText('a,b\n1,"oops', "bad.csv"));
const json = V.organizeText('[{"message":"<script>alert(1)</script>","status":200}]');
assert.equal(json.rows[0].c0, "<script>alert(1)</script>");
assert.equal(V.organizeText('{"status":200}\n{"status":404}').format, "JSON lines");
const log = V.organizeText("2026-10-26T13:00:00Z ERROR 192.0.2.5 failed\nINFO ready");
assert.equal(log.rows[0].level, "ERROR");
assert.equal(log.rows[0].source, "192.0.2.5");
assert.equal(log.rows[1].line, 2);
assert.equal(V.organizeText("x\n".repeat(10010)).rows.length, 10000);
assert.ok(V.organizeText("x\n".repeat(10010)).warnings.length);
assert.match(V.csv(V.organizeText("name\tvalue\na\t=1"), [{ number: 1, c0: "a", c1: "=1" }]), /'=1/);
const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("INFO hello", "utf16le")]);
assert.equal(V.organizeFile(arrayBuffer(utf16), "utf16.log").rows[0].level, "INFO");
assert.equal(V.organizeFile(arrayBuffer(Buffer.from([0, 1, 2, 3])), "unknown.bin").format, "Binary hex/text");

assert.deepEqual(V.regexTask({ pattern: "error|flag\\{", flags: "i", rows: ["ready", "ERROR", "flag{yes}"] }), [1, 2]);
assert.equal(V.regexTask({ pattern: "flag\\{([^}]+)\\}", flags: "", input: "flag{ok}" }).matches[0].groups[0], "ok");
assert.equal(V.regexTask({ pattern: "(?:)", flags: "u", input: "😀" }).matches.length, 2);
assert.throws(() => V.regexTask({ pattern: "[", flags: "", input: "x" }));
assert.throws(() => V.regexTask({ pattern: "x", flags: "ii", input: "x" }));

const packet = new Uint8Array(60), p = new DataView(packet.buffer);
p.setUint16(12, 0x0800); packet[14] = 0x45; packet[23] = 17;
packet.set([192, 0, 2, 1], 26); packet.set([198, 51, 100, 2], 30);
p.setUint16(34, 1234); p.setUint16(36, 53);
packet.set(new TextEncoder().encode("flag{capture}"), 42);
function classic(little) {
  const buffer = new ArrayBuffer(40 + packet.length), view = new DataView(buffer);
  view.setUint32(0, 0xa1b2c3d4, little); view.setUint16(4, 2, little); view.setUint16(6, 4, little);
  view.setUint32(20, 1, little); view.setUint32(24, 1700000000, little);
  view.setUint32(32, packet.length, little); view.setUint32(36, packet.length, little);
  new Uint8Array(buffer, 40).set(packet); return buffer;
}
for (const little of [true, false]) {
  const data = V.parseCapture(classic(little));
  assert.equal(data.rows[0].protocol, "UDP");
  assert.equal(data.rows[0].source, "192.0.2.1:1234");
  assert.equal(data.rows[0].destination, "198.51.100.2:53");
  assert.match(data.rows[0].message, /flag\{capture\}/);
  assert.throws(() => V.parseCapture(classic(little).slice(0, 45)));
}
function block(type, body, little) {
  const length = 12 + Math.ceil(body.length / 4) * 4, bytes = new Uint8Array(length), view = new DataView(bytes.buffer);
  view.setUint32(0, type, little); view.setUint32(4, length, little); view.setUint32(length - 4, length, little); bytes.set(body, 8); return bytes;
}
function pcapng(little) {
  const section = new Uint8Array(16), s = new DataView(section.buffer);
  s.setUint32(0, 0x1a2b3c4d, little); s.setUint16(4, 1, little);
  const iface = new Uint8Array(20), i = new DataView(iface.buffer);
  i.setUint16(0, 1, little); i.setUint32(4, 65535, little); i.setUint16(8, 9, little); i.setUint16(10, 1, little); iface[12] = 9;
  const body = new Uint8Array(20 + packet.length), e = new DataView(body.buffer);
  e.setUint32(8, 2000000000, little); e.setUint32(12, packet.length, little); e.setUint32(16, packet.length, little); body.set(packet, 20);
  return arrayBuffer(Buffer.concat([block(0x0a0d0d0a, section, little), block(1, iface, little), block(6, body, little)]));
}
for (const little of [true, false]) {
  const buffer = pcapng(little), data = V.parseCapture(buffer);
  assert.equal(data.format, "PCAPNG");
  assert.equal(data.rows[0].timestamp, "1970-01-01T00:00:02.000Z");
  assert.equal(data.rows[0].protocol, "UDP");
  assert.throws(() => V.parseCapture(buffer.slice(0, buffer.byteLength - 1)));
}
console.log("Viewer and capture tests passed.");
