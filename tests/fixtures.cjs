const dns=Buffer.from('123481800001000100000000076578616d706c6503636f6d0000010001c00c000100010000003c0004c0000201','hex');
function packet(payload,{protocol=6,seq=100,sport=80,dport=45000,reverse=false,fragment=0,ipv6=false}={}){
  payload=Buffer.from(payload);const ipSize=ipv6?40:20,transport=protocol===6?20:8,b=Buffer.alloc(14+ipSize+transport+payload.length),p=14+ipSize;
  b.writeUInt16BE(ipv6?0x86dd:0x0800,12);
  if(ipv6){b[14]=0x60;b.writeUInt16BE(transport+payload.length,18);b[20]=protocol;b[21]=64;b[37]=reverse?2:1;b[53]=reverse?1:2;}
  else {b[14]=0x45;b.writeUInt16BE(ipSize+transport+payload.length,16);b.writeUInt16BE(fragment,20);b[22]=64;b[23]=protocol;Buffer.from(reverse?[192,0,2,2,192,0,2,1]:[192,0,2,1,192,0,2,2]).copy(b,26);}
  b.writeUInt16BE(sport,p);b.writeUInt16BE(dport,p+2);if(protocol===6){b.writeUInt32BE(seq>>>0,p+4);b[p+12]=0x50;b[p+13]=0x18;}else b.writeUInt16BE(8+payload.length,p+4);payload.copy(b,p+transport);return b;
}
function pcap(packets){const head=Buffer.alloc(24);head.writeUInt32LE(0xa1b2c3d4,0);head.writeUInt16LE(2,4);head.writeUInt16LE(4,6);head.writeUInt32LE(65535,16);head.writeUInt32LE(1,20);return Buffer.concat([head,...packets.flatMap((p,i)=>{const h=Buffer.alloc(16);h.writeUInt32LE(1793012400+i,0);h.writeUInt32LE(p.length,8);h.writeUInt32LE(p.length,12);return [h,p];})]);}
const response=Buffer.from('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 17\r\n\r\nflag{stream_demo}');
function practiceCapture(){return pcap([packet('GET /flag.txt HTTP/1.1\r\nHost: example.test\r\n\r\n',{reverse:true,sport:45000,dport:80,seq:1000}),packet(response.subarray(30),{seq:130}),packet(response.subarray(0,30),{seq:100}),packet(response.subarray(0,30),{seq:100}),packet(dns,{protocol:17,sport:53,dport:50000})]);}
function exifJpeg(le=true){const t=Buffer.alloc(158),u16=(v,p)=>le?t.writeUInt16LE(v,p):t.writeUInt16BE(v,p),u32=(v,p)=>le?t.writeUInt32LE(v,p):t.writeUInt32BE(v,p);
  t.write(le?'II':'MM');u16(42,2);u32(8,4);u16(3,8);
  function entry(p,tag,type,n,value){u16(tag,p);u16(type,p+2);u32(n,p+4);u32(value,p+8);}
  entry(10,0x010f,2,6,50);entry(22,0x0112,3,1,0);u16(6,30);entry(34,0x8825,4,1,56);t.write('Canon\0',50);u16(4,56);
  entry(58,1,2,2,0);t.write('N\0',66);entry(70,2,5,3,110);entry(82,3,2,2,0);t.write('W\0',90);entry(94,4,5,3,134);
  [40,30,0,74,15,0].forEach((n,i)=>{u32(n,110+i*8);u32(1,114+i*8);});
  const app=Buffer.alloc(4);app[0]=255;app[1]=225;app.writeUInt16BE(t.length+8,2);
  const sof=Buffer.from('ffc00011080258032003011100021100031100','hex');
  return Buffer.concat([Buffer.from([255,216]),app,Buffer.from('Exif\0\0'),t,sof,Buffer.from([255,217]),Buffer.from('flag{appended}')]);
}
module.exports={dns,packet,pcap,practiceCapture,exifJpeg};
