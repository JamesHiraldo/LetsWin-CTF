(function(root) {
  "use strict";
  function decodePacket(bytes,linkType) {
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let p=0,type;
    if(linkType===1&&bytes.length>=14){type=v.getUint16(12);p=14;for(let i=0;i<2&&[0x8100,0x88a8].includes(type)&&p+4<=bytes.length;i++){type=v.getUint16(p+2);p+=4;}}
    else if(linkType===113&&bytes.length>=16){type=v.getUint16(14);p=16;}
    else if(linkType===276&&bytes.length>=20){type=v.getUint16(0);p=20;}
    else if([101,228,229].includes(linkType)){type=bytes[0]>>4===6?0x86dd:0x0800;}
    else return null;
    let source,destination,protocol,end;
    if(type===0x0800&&p+20<=bytes.length){const n=(bytes[p]&15)*4,total=v.getUint16(p+2);if(bytes[p]>>4!==4||n<20||total<n||p+n>bytes.length)return null;if(v.getUint16(p+6)&0x3fff)return {unsupported:"Fragmented IPv4 datagram (not reassembled)"};source=Array.from(bytes.slice(p+12,p+16)).join(".");destination=Array.from(bytes.slice(p+16,p+20)).join(".");protocol=bytes[p+9];end=Math.min(bytes.length,p+total);p+=n;}
    else if(type===0x86dd&&p+40<=bytes.length){const addr=o=>"["+Array.from({length:8},(_,i)=>v.getUint16(o+i*2).toString(16)).join(":")+"]";source=addr(p+8);destination=addr(p+24);protocol=bytes[p+6];end=Math.min(bytes.length,p+40+v.getUint16(p+4));p+=40;let loops=0;while([0,43,60,51,44].includes(protocol)&&loops++<8){if(p+2>end)return null;if(protocol===44)return {unsupported:"Fragmented IPv6 datagram (not reassembled)"};const n=protocol===51?(bytes[p+1]+2)*4:(bytes[p+1]+1)*8;protocol=bytes[p];p+=n;if(p>end)return null;}}
    else return null;
    if(![6,17].includes(protocol)||p+(protocol===6?20:8)>end)return null;
    const sport=v.getUint16(p),dport=v.getUint16(p+2),header=protocol===6?(bytes[p+12]>>4)*4:8;
    if(header<(protocol===6?20:8)||p+header>end)return null;
    if(protocol===17){const length=v.getUint16(p+4);if(length<8)return null;end=Math.min(end,p+length);}
    return {source:`${source}:${sport}`,destination:`${destination}:${dport}`,sport,dport,protocol:protocol===6?"TCP":"UDP",seq:protocol===6?v.getUint32(p+4):0,flags:protocol===6?bytes[p+13]:0,payload:bytes.slice(p+header,end)};
  }
  function reassemble(packets) {
    const payloads=packets.filter(p=>p.payload.length);if(!payloads.length)return {runs:[],gaps:0,retransmissions:0,conflicts:0};
    const origin=(payloads[0].seq+((payloads[0].flags&2)?1:0))>>>0;
    const segments=payloads.map(p=>({offset:(((p.seq+((p.flags&2)?1:0))>>>0)-origin)|0,data:p.payload})).sort((a,b)=>a.offset-b.offset);
    const runs=[];let gaps=0,retransmissions=0,conflicts=0,current=null;
    for(const s of segments){if(!current||s.offset>current.end){if(current)gaps++;current={start:s.offset,end:s.offset,parts:[],bytes:[]};runs.push(current);}const overlap=Math.min(s.data.length,Math.max(0,current.end-s.offset));if(overlap){retransmissions++;for(let i=0;i<overlap;i++)if(current.bytes[s.offset-current.start+i]!==s.data[i])conflicts++;}
      for(let i=overlap;i<s.data.length;i++)current.bytes.push(s.data[i]);current.end=Math.max(current.end,s.offset+s.data.length);
    }
    return {runs:runs.map(r=>({offset:r.start,bytes:Uint8Array.from(r.bytes)})),gaps,retransmissions,conflicts};
  }
  function http(bytes,allowCloseDelimited=false) {
    // Latin-1 keeps one character per byte, so header offsets remain byte offsets.
    const text=new TextDecoder("latin1").decode(bytes),messages=[];let pos=0;
    while(pos<bytes.length&&messages.length<100){const headerEnd=text.indexOf("\r\n\r\n",pos);if(headerEnd<0||headerEnd-pos>65536)break;const lines=text.slice(pos,headerEnd).split("\r\n"),first=lines.shift();if(!/^(?:HTTP\/1\.[01] \d{3}|(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|CONNECT|TRACE) \S+ HTTP\/1\.[01])/.test(first))break;
      const headers=Object.create(null);for(const line of lines){const colon=line.indexOf(":");if(colon>0){const key=line.slice(0,colon).toLowerCase();headers[key]=headers[key]===undefined?line.slice(colon+1).trim():headers[key]+", "+line.slice(colon+1).trim();}}
      let start=headerEnd+4,next=start,body=new Uint8Array(),complete=true,note="";
      if(headers["transfer-encoding"]&&headers["transfer-encoding"].toLowerCase()!=="chunked"){complete=false;note="Unsupported transfer encoding.";}
      else if(headers["transfer-encoding"]){const parts=[];let total=0,cursor=start,done=false;
        while(cursor<bytes.length){const lineEnd=text.indexOf("\r\n",cursor);if(lineEnd<0)break;const sizeText=text.slice(cursor,lineEnd).split(";")[0];if(!/^[0-9a-f]+$/i.test(sizeText))break;const n=parseInt(sizeText,16);cursor=lineEnd+2;if(n===0){if(text.slice(cursor,cursor+2)==="\r\n"){next=cursor+2;done=true;}else {const trailerEnd=text.indexOf("\r\n\r\n",cursor);if(trailerEnd>=0){next=trailerEnd+4;done=true;}}break;}if(!Number.isSafeInteger(n)||cursor+n+2>bytes.length||text.slice(cursor+n,cursor+n+2)!=="\r\n")break;parts.push(bytes.slice(cursor,cursor+n));total+=n;cursor+=n+2;}
        complete=done;body=new Uint8Array(total);let off=0;for(const part of parts){body.set(part,off);off+=part.length;}if(!done)note="Incomplete or malformed chunked body.";
      }else if(headers["content-length"]!==undefined){if(!/^\d+$/.test(headers["content-length"])) {complete=false;note="Invalid or duplicate Content-Length.";}else {const n=Number(headers["content-length"]);complete=Number.isSafeInteger(n)&&n<=bytes.length-start;next=complete?start+n:bytes.length;body=bytes.slice(start,next);if(!complete)note="Capture does not contain the full Content-Length body.";}}
      else if(/^HTTP\//.test(first)&&!/^HTTP\/1\.[01] (?:1\d\d|204|304)\b/.test(first)){body=bytes.slice(start);next=bytes.length;complete=allowCloseDelimited;note="Body length depends on connection close; HEAD responses cannot be inferred from one direction.";}
      if(headers["content-encoding"])note+=(note?" ":"")+`Export preserves ${headers["content-encoding"]} content encoding.`;
      messages.push({first,headers,body,complete,note});if(!complete||next<=pos)break;pos=next;
    }
    return messages;
  }
  function dns(bytes) {
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.length<12)throw new Error("Truncated DNS header.");
    function name(offset){const labels=[],seen=new Set();let p=offset,next=null;for(let i=0;i<128;i++){if(p>=bytes.length||seen.has(p))throw new Error("Invalid DNS name pointer.");seen.add(p);const n=bytes[p++];if(n===0)return {text:labels.join("."),next:next??p};if((n&192)===192){if(p>=bytes.length)throw new Error("Truncated DNS pointer.");next??=p+1;p=((n&63)<<8)|bytes[p];continue;}if(n>63||p+n>bytes.length)throw new Error("Invalid DNS label.");labels.push(new TextDecoder().decode(bytes.slice(p,p+n)));p+=n;}throw new Error("DNS name too deep.");}
    const names={1:"A",2:"NS",5:"CNAME",6:"SOA",12:"PTR",15:"MX",16:"TXT",28:"AAAA"},questions=[],answers=[];let p=12;
    const qd=v.getUint16(4),an=v.getUint16(6);if(qd+an>512)throw new Error("DNS record count exceeds 512.");
    for(let i=0;i<qd;i++){const n=name(p);p=n.next;if(p+4>bytes.length)throw new Error("Truncated DNS question.");questions.push({name:n.text,type:names[v.getUint16(p)]||v.getUint16(p)});p+=4;}
    for(let i=0;i<an;i++){const n=name(p);p=n.next;if(p+10>bytes.length)throw new Error("Truncated DNS answer.");const type=v.getUint16(p),ttl=v.getUint32(p+4),length=v.getUint16(p+8);p+=10;if(p+length>bytes.length)throw new Error("Truncated DNS answer data.");let value;
      if(type===1&&length===4)value=Array.from(bytes.slice(p,p+4)).join(".");else if(type===28&&length===16)value=Array.from({length:8},(_,j)=>v.getUint16(p+j*2).toString(16)).join(":");else if([2,5,12].includes(type))value=name(p).text;else if(type===15&&length>=3)value=`${v.getUint16(p)} ${name(p+2).text}`;else if(type===16){const parts=[];let j=p;while(j<p+length){const size=bytes[j++];if(j+size>p+length)throw new Error("Truncated DNS TXT field.");parts.push(new TextDecoder().decode(bytes.slice(j,j+size)));j+=size;}value=parts.join(" ");}else value=Array.from(bytes.slice(p,p+length),b=>b.toString(16).padStart(2,"0")).join("");answers.push({name:n.text,type:names[type]||type,ttl,value});p+=length;
    }
    return {id:v.getUint16(0),response:!!(v.getUint16(2)&0x8000),rcode:v.getUint16(2)&15,questions,answers};
  }
  function analyze(rows) {
    const flows=new Map(),dnsRecords=[],warnings=new Set();
    for(const row of rows){const p=row._packet;if(!p)continue;if(p.unsupported){warnings.add(p.unsupported);continue;}
      if(p.protocol==="UDP"&&(p.sport===53||p.dport===53)){try{dnsRecords.push({timestamp:row.timestamp,...dns(p.payload)});}catch(e){warnings.add(e.message);}}
      if(p.protocol!=="TCP")continue;const endpoints=[p.source,p.destination].sort(),key=endpoints.join(" ↔ ");if(!flows.has(key))flows.set(key,{key,endpoints,directions:[[],[]]});flows.get(key).directions[endpoints[0]===p.source?0:1].push(p);
    }
    const result=[...flows.values()].map(f=>({...f,directions:f.directions.map(packets=>{const stream=reassemble(packets);return {...stream,packets:packets.length,messages:stream.runs.flatMap(r=>http(r.bytes,false)),dns:packets.some(p=>p.sport===53||p.dport===53)?stream.runs.flatMap(r=>{const values=[];const v=new DataView(r.bytes.buffer);for(let p=0;p+2<=r.bytes.length;){const n=v.getUint16(p);p+=2;if(p+n>r.bytes.length)break;try{values.push(dns(r.bytes.slice(p,p+n)));}catch(e){warnings.add(e.message);}p+=n;}return values;}):[]};})}));
    warnings.add("TCP directions are grouped by endpoint pair; reused connections may overlap. Sequence spans over 2 GiB, IP fragments, TLS decryption, HTTP/2, and HTTP/3 are not supported. Gaps are never filled with invented bytes. Overlaps retain the segment with the earliest start sequence (capture order for equal starts); conflicts disable HTTP body export.");
    return {flows:result,dns:dnsRecords,warnings:[...warnings]};
  }
  const api={decodePacket,reassemble,http,dns,analyze};root.CTFTraffic=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
