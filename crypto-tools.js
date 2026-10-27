(function(root) {
  "use strict";
  const enc = new TextEncoder(), dec = new TextDecoder("utf-8", {fatal: true});
  function md4(bytes) {
    const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64); padded.set(bytes); padded[bytes.length] = 128;
    const view = new DataView(padded.buffer); view.setUint32(padded.length - 8, (bytes.length * 8) >>> 0, true); view.setUint32(padded.length - 4, Math.floor(bytes.length / 536870912), true);
    let state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    const rot = (n, s) => (n << s) | (n >>> (32 - s));
    for (let offset = 0; offset < padded.length; offset += 64) {
      const x = Array.from({length: 16}, (_, i) => view.getUint32(offset + i * 4, true)); let [a,b,c,d] = state;
      const step = (f,k,s,constant) => { const next = rot((a + f(b,c,d) + x[k] + constant) | 0,s); a=d; d=c; c=b; b=next; };
      for (let i=0;i<16;i++) step((b,c,d)=>(b&c)|(~b&d),i,[3,7,11,19][i%4],0);
      for (let i=0;i<16;i++) step((b,c,d)=>(b&c)|(b&d)|(c&d),(i%4)*4+Math.floor(i/4),[3,5,9,13][i%4],0x5a827999);
      const order=[0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15];
      for (let i=0;i<16;i++) step((b,c,d)=>b^c^d,order[i],[3,9,11,15][i%4],0x6ed9eba1);
      state=state.map((v,i)=>(v+[a,b,c,d][i])>>>0);
    }
    const out=new Uint8Array(16), outView=new DataView(out.buffer); state.forEach((v,i)=>outView.setUint32(i*4,v,true)); return hex(out);
  }
  function hex(bytes) {return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}
  function unhex(text) {const s=text.replace(/\s/g,""); if(!/^(?:[\da-f]{2})*$/i.test(s)) throw new Error("Enter complete hexadecimal byte pairs."); return Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));}
  function hash(text, algorithm) {
    if (text.length > 2000000) throw new Error("Text hashing is limited to 2 million characters.");
    if(algorithm === "NTLM") {const bytes=new Uint8Array(text.length*2); const v=new DataView(bytes.buffer); for(let i=0;i<text.length;i++)v.setUint16(i*2,text.charCodeAt(i),true); return md4(bytes);}
    const lib=root.CryptoJS || (typeof require!=="undefined" ? require("./vendor/crypto-js.js") : null);
    if(!["MD5","SHA1","SHA256"].includes(algorithm)) throw new Error("Unsupported hash algorithm.");
    return lib[algorithm](text).toString();
  }
  function hashHints(text) {
    const value=text.trim();
    const formats=[[/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/,"bcrypt"],[/^\$argon2(?:id|i|d)\$/,"Argon2"],[/^\$scrypt\$/,"scrypt"],[/^\$1\$/,"MD5-crypt"],[/^\$5\$/,"SHA-256-crypt"],[/^\$6\$/,"SHA-512-crypt"],[/^\$?pbkdf2[-_$]/i,"PBKDF2"]];
    const match=formats.find(([re])=>re.test(value));
    if(match)return {candidate:match[1],salted:true,note:"Format hint only; this does not verify or crack the hash."};
    if(/^[\da-f]+:[^:]+$/i.test(value))return {candidate:"Digest:salt pair",salted:true,note:"Algorithm and salt order cannot be inferred from this shape."};
    return {candidate:({32:"MD5 / NTLM / MD4",40:"SHA-1",56:"SHA-224",64:"SHA-256",96:"SHA-384",128:"SHA-512"})[/^[\da-f]+$/i.test(value)?value.length:0]||"Unknown format",note:"Length and syntax are hints, not a definitive identification."};
  }
  const morse={A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",6:"-....",7:"--...",8:"---..",9:"----.",".":".-.-.-",",":"--..--","?":"..--..","!":"-.-.--","/":"-..-.","-":"-....-","@":".--.-.",":":"---...","'":".----.","(":"-.--.",")":"-.--.-","=":"-...-","+":".-.-.","_":"..--.-","\"":".-..-.",";":"-.-.-.","&":".-...","$":"...-..-"};
  function cipher(input, kind, direction, key="") {
    if(input.length>2000000)throw new Error("Input is limited to 2 million characters.");
    const encode=direction==="encode", sign=encode?1:-1;
    if(kind==="binary") {if(encode)return Array.from(enc.encode(input),b=>b.toString(2).padStart(8,"0")).join(" "); const s=input.replace(/\s/g,""); if(!/^(?:[01]{8})*$/.test(s))throw new Error("Use 8-bit binary bytes."); return dec.decode(Uint8Array.from(s.match(/.{8}/g)||[],x=>parseInt(x,2)));}
    if(kind==="xor") {const k=enc.encode(key); if(!k.length)throw new Error("Enter a UTF-8 XOR key."); const bytes=encode?enc.encode(input):unhex(input); const out=bytes.map((b,i)=>b^k[i%k.length]); return encode?hex(out):dec.decode(out);}
    if(kind==="morse") {if(encode)return input.toUpperCase().split(/\s+/).map(w=>Array.from(w,c=>{if(!morse[c])throw new Error(`Unsupported Morse character: ${c}`);return morse[c];}).join(" ")).join(" / "); const reverse=Object.fromEntries(Object.entries(morse).map(([a,b])=>[b,a])); return input.trim().split(/\s*\/\s*/).map(w=>w.split(/\s+/).map(c=>{if(!reverse[c])throw new Error(`Unknown Morse token: ${c}`);return reverse[c];}).join("")).join(" ");}
    if(!["caesar","vigenere"].includes(kind))throw new Error("Unknown cipher.");
    if(kind==="caesar" && !/^-?\d{1,6}$/.test(key))throw new Error("Caesar shift must be an integer (up to 6 digits).");
    if(kind==="vigenere" && !/^[a-z]+$/i.test(key))throw new Error("Vigenère key must contain A–Z letters only.");
    let n=0; return input.replace(/[a-z]/gi,c=>{const base=c<="Z"?65:97; const shift=kind==="caesar"?Number(key):key.toUpperCase().charCodeAt(n++%key.length)-65;return String.fromCharCode(base+((c.charCodeAt(0)-base+sign*shift)%26+26)%26);});
  }
  function recipe(input,steps) {if(!Array.isArray(steps)||!steps.length||steps.length>12)throw new Error("A recipe needs 1–12 steps."); const C=root.CTFCore||(typeof require!=="undefined"?require("./core.js"):null); let value=input;return {steps:steps.map(s=>{if(value.length>2000000)throw new Error("Recipe intermediate exceeds 2 million characters.");value=C.transformText(value,s.format,s.direction);if(value.length>2000000)throw new Error("Recipe output exceeds 2 million characters.");return {format:s.format,direction:s.direction,output:value};}),output:value};}
  const api={md4,hash,hashHints,cipher,recipe,hex,unhex}; root.CTFCrypto=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
