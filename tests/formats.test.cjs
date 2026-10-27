const assert=require('node:assert/strict'),T=require('../traffic'),V=require('../viewer'),I=require('../image-tools'),A=require('../analytics');
const F=require('./fixtures.cjs');let count=0;const check=f=>{f();count++;};
const raw=F.practiceCapture(),buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),capture=V.parseCapture(buffer),report=T.analyze(capture.rows);
check(()=>assert.equal(capture.rows.length,5));check(()=>assert.equal(report.flows.length,1));check(()=>assert.equal(report.dns[0].answers[0].value,'192.0.2.1'));
const response=report.flows[0].directions.find(d=>d.messages.some(m=>m.first.startsWith('HTTP')));
check(()=>assert.equal(response.retransmissions,1));check(()=>assert.equal(response.gaps,0));check(()=>assert.equal(response.messages[0].complete,true));check(()=>assert.equal(new TextDecoder().decode(response.messages[0].body),'flag{stream_demo}'));
check(()=>assert.ok(!V.searchText(capture.rows[0]).includes('[object Object]')));
for(const ipv6 of [false,true]){const b=F.packet('abc',{ipv6}),p=T.decodePacket(b,1);check(()=>assert.equal(new TextDecoder().decode(p.payload),'abc'));check(()=>assert.equal(p.sport,80));check(()=>assert.equal(p.dport,45000));check(()=>assert.equal(p.protocol,'TCP'));for(let n=0;n<54;n++)check(()=>assert.doesNotThrow(()=>T.decodePacket(b.subarray(0,n),1)));}
check(()=>assert.match(T.decodePacket(F.packet('abc',{fragment:0x2000}),1).unsupported,/Fragmented/));
check(()=>assert.equal(T.decodePacket(Buffer.alloc(2),999),null));
const udp=T.decodePacket(F.packet(F.dns,{protocol:17,sport:53}),1);check(()=>assert.equal(T.dns(udp.payload).questions[0].name,'example.com'));
for(const le of [true,false]){const result=I.inspect(F.exifJpeg(le));check(()=>assert.equal(result.metadata.Make,'Canon'));check(()=>assert.equal(result.metadata.Orientation,6));check(()=>assert.equal(result.metadata.Width,800));check(()=>assert.equal(result.metadata.Height,600));check(()=>assert.equal(result.metadata.GPS.latitude,40.5));check(()=>assert.equal(result.metadata.GPS.longitude,-74.25));check(()=>assert.equal(result.appendedBytes,14));check(()=>assert.deepEqual(result.warnings,[]));}
const bad=F.exifJpeg();bad.writeUInt32LE(0xffffff00,16);check(()=>assert.ok(I.inspect(bad).warnings.length));
check(()=>assert.ok(Number.isNaN(A.time('2026-02-30'))));check(()=>assert.ok(Number.isNaN(A.time(1e20))));
console.log(`Binary format integration passed: ${count} assertions, including captures, stream export content, EXIF/GPS and malformed records.`);
