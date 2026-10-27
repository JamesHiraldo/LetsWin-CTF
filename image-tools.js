(function(root) {
  "use strict";
  function inspect(bytes) {
    if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),metadata={},warnings=[];let end=null,format="Unknown";
    const check=(p,n)=>{if(p<0||n<0||p+n>bytes.length)throw new Error("Truncated image metadata.");};
    function exif(start,length) {
      const limit=start+length;check(start,length);if(length<8)throw new Error("Truncated TIFF header.");
      const le=v.getUint16(start)===0x4949;if(!le&&v.getUint16(start)!==0x4d4d)throw new Error("Invalid TIFF byte order.");
      const read=(p,n)=>{if(p<start||p+n>limit)throw new Error("EXIF offset outside its segment.");};
      if(v.getUint16(start+2,le)!==42)throw new Error("Invalid TIFF marker.");
      const visited=new Set();let gps={};
      function ifd(relative,kind,depth=0) {
        if(depth>4||visited.has(relative))return;visited.add(relative);const pos=start+relative;read(pos,2);const count=v.getUint16(pos,le);if(count>256)throw new Error("EXIF directory too large.");read(pos+2,count*12);
        for(let i=0;i<count;i++){const p=pos+2+i*12,tag=v.getUint16(p,le),type=v.getUint16(p+2,le),n=v.getUint32(p+4,le),size=({1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8})[type];if(!size||n>4096)continue;const at=n*size<=4?p+8:start+v.getUint32(p+8,le);read(at,n*size);let value;
          if(type===2)value=new TextDecoder().decode(bytes.slice(at,at+n)).replace(/\0+$/,"");
          else if([3,4,5].includes(type)){value=Array.from({length:n},(_,j)=>type===3?v.getUint16(at+j*2,le):type===4?v.getUint32(at+j*4,le):(v.getUint32(at+j*8+4,le)?v.getUint32(at+j*8,le)/v.getUint32(at+j*8+4,le):null));if(n===1)value=value[0];}
          else continue;
          if(tag===0x8769||tag===0x8825){if(typeof value==="number")ifd(value,tag===0x8825?"gps":"exif",depth+1);continue;}
          if(kind==="gps")gps[tag]=value;
          else {const name=({0x010f:"Make",0x0110:"Model",0x0112:"Orientation",0x0131:"Software",0x0132:"Modified",0x9003:"Date taken",0x8298:"Copyright",0xa002:"Width",0xa003:"Height"})[tag];if(name)metadata[name]=value;}
        }
      }
      ifd(v.getUint32(start+4,le),"main");
      const coordinate=(parts,ref)=>Array.isArray(parts)&&parts.length===3&&parts.every(Number.isFinite)?(parts[0]+parts[1]/60+parts[2]/3600)*(["S","W"].includes(ref)?-1:1):null;
      const lat=["N","S"].includes(gps[1])?coordinate(gps[2],gps[1]):null,lon=["E","W"].includes(gps[3])?coordinate(gps[4],gps[3]):null;if(lat!==null&&lon!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180)metadata.GPS={latitude:lat,longitude:lon};
    }
    if(bytes[0]===0xff&&bytes[1]===0xd8){format="JPEG";let p=2;
      while(p<bytes.length){if(bytes[p++]!==0xff)continue;while(bytes[p]===0xff)p++;const marker=bytes[p++];if(marker===0xd9){end=p;break;}if(marker===0||marker===0x01||marker>=0xd0&&marker<=0xd8)continue;check(p,2);const len=v.getUint16(p);if(len<2)throw new Error("Invalid JPEG segment.");check(p,len);
        if(marker===0xe1&&len>=8&&String.fromCharCode(...bytes.slice(p+2,p+8))==="Exif\0\0"){try{exif(p+8,len-8);}catch(e){warnings.push(e.message);}}
        if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&len>=8){metadata.Height=v.getUint16(p+3);metadata.Width=v.getUint16(p+5);}
        p+=len;
      }
    }else if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)){format="PNG";let p=8;while(p<bytes.length){check(p,12);const n=v.getUint32(p);check(p+8,n+4);const type=String.fromCharCode(...bytes.slice(p+4,p+8));if(type==="IHDR"&&n>=8){metadata.Width=v.getUint32(p+8);metadata.Height=v.getUint32(p+12);}if(type==="tEXt"&&n<65536){const text=new TextDecoder("latin1").decode(bytes.slice(p+8,p+8+n));const split=text.indexOf("\0");if(split>0)metadata[`PNG ${text.slice(0,split)}`]=text.slice(split+1);}if(type==="eXIf"){try{exif(p+8,n);}catch(e){warnings.push(e.message);}}p+=n+12;if(type==="IEND"){end=p;break;}}}
    else warnings.push("Metadata and appended-byte inspection support JPEG and PNG only.");
    if(end===null&&format!=="Unknown")warnings.push("Image end marker was not found.");
    return {format,metadata,warnings,appendedOffset:end,appendedBytes:end===null?0:bytes.length-end};
  }
  function pixels(data,channel="original",plane=-1) {
    if(!["original","red","green","blue","alpha"].includes(channel)||!Number.isInteger(plane)||plane< -1||plane>7)throw new Error("Invalid channel or bit plane.");
    const out=new Uint8ClampedArray(data);const index={red:0,green:1,blue:2,alpha:3}[channel];
    for(let i=0;i<out.length;i+=4){if(channel!=="original"){let b=data[i+index];if(plane>=0)b=((b>>plane)&1)*255;out[i]=out[i+1]=out[i+2]=b;out[i+3]=255;}else if(plane>=0){for(let c=0;c<3;c++)out[i+c]=((data[i+c]>>plane)&1)*255;out[i+3]=255;}}
    return out;
  }
  const api={inspect,pixels};root.CTFImage=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
