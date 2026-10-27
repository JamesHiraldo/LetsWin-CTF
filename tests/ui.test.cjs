const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom'),{Worker}=require('node:worker_threads');
const root=path.resolve(__dirname,'..');let checks=0;const check=fn=>{fn();checks++;};
const fixtures=require('./fixtures.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setup(){
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'LetsWin CTF.html'),'utf8'),{url:'https://local-test.invalid/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window;Object.assign(w,{TextEncoder,TextDecoder,structuredClone,Blob,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView});
  const blobs=new Map(),downloads=[];let id=0;
  w.URL.createObjectURL=blob=>{const url='blob:test/'+ ++id;blobs.set(url,blob);return url;};w.URL.revokeObjectURL=url=>blobs.delete(url);
  w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
  w.Worker=class{
    constructor(url){this.stopped=false;this.ready=blobs.get(url).text().then(code=>{if(this.stopped)return;this.worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:value=>parentPort.postMessage(value)};${code};parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.(error));});}
    async postMessage(data){await this.ready;if(!this.stopped)this.worker.postMessage(data);}
    terminate(){this.stopped=true;this.worker?.terminate();}
  };
  for(const script of w.document.querySelectorAll('script'))w.eval(script.textContent);
  const $=s=>w.document.querySelector(s),click=s=>{const el=$(s);assert.ok(el,`Missing element ${s}`);el.click();},input=(s,value)=>{const el=$(s);assert.ok(el,`Missing input ${s}`);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));},open=(category,id)=>{click(`[data-nav="${category}"]`);click(`[data-tool="${id}"]`);};
  const file=(selector,filename,bytes)=>{const buffer=Buffer.from(bytes);Object.defineProperty($(selector),'files',{configurable:true,value:[{name:filename,lastModified:1793012400000,size:buffer.length,type:'application/octet-stream',arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),text:async()=>buffer.toString()}]});};
  return {dom,w,$,click,input,open,file,errors,downloads};
}
(async()=>{
  const {dom,w,$,click,input,open,file,errors,downloads}=setup();
  check(()=>assert.equal($('#shell').hidden,true));check(()=>assert.equal($('#modeGate').hidden,false));
  click('[data-mode="individual"]');check(()=>assert.equal($('#modeGate').hidden,true));check(()=>assert.equal($('#teamNotes'),null));check(()=>assert.ok(!$('#content').textContent.includes('Open ChatGPT')));
  click('[data-nav="workspace"]');click('[data-desk="new"]');input('#challengeTitle','Demo <script>alert(1)</script>');input('[data-challenge-field="notes"]','solo investigation');input('[data-challenge-field="flag"]','flag{demo}');
  check(()=>assert.equal($('#content script'),null));check(()=>assert.match($('#activeChallenge').textContent,/Demo <script>/));
  open('crypto','codec');input('#codecInput','ZmxhZ3tkZW1vfQ==');click('[data-run="codec"]');await wait(10);check(()=>assert.equal($('#output').textContent,'flag{demo}'));
  click('[data-desk="saveResult"]');check(()=>assert.match($('#handoffStatus').textContent,/saved/));
  input('#handoffTarget','digests');click('[data-desk="sendOutput"]');check(()=>assert.equal($('#digestText').value,'flag{demo}'));input('#digestText','hello');click('[data-desk="digest"]');check(()=>assert.equal($('#output').textContent,'5d41402abc4b2a76b9719d911017c592'));
  input('#saltedInput','$argon2id$v=19$m=65536,t=3,p=1$abc$abc');click('[data-desk="hint"]');check(()=>assert.match($('#output').textContent,/Argon2/));
  open('crypto','ciphers');input('#cipherInput','Khoor');click('[data-desk="cipher"]');check(()=>assert.equal($('#output').textContent,'Hello'));
  open('crypto','recipes');input('#recipeInput','ZmxhZ3tkZW1vfQ==');click('[data-desk="addStep"]');click('[data-desk="recipe"]');check(()=>assert.equal($('#output').textContent,'flag{demo}'));input('#recipeName','Decode sample');click('[data-desk="saveRecipe"]');check(()=>assert.equal($('#savedRecipes option').textContent,'Decode sample'));click('[data-desk="clearSteps"]');click('[data-desk="loadRecipe"]');check(()=>assert.equal(w.document.querySelectorAll('#recipeSteps li').length,1));
  open('forensics','logs');input('#logText','timestamp,source,message\n2026-10-26T10:00:00Z,A,error\n2026-10-26T10:00:00Z,A,error\n2026-10-26T11:00:00Z,B,ok');click('[data-run="logs"]');await wait(10);check(()=>assert.equal(w.document.querySelectorAll('.log-table tbody tr').length,3));
  $('#logDuplicates').checked=true;click('[data-desk="analyzeLogs"]');check(()=>assert.equal(w.document.querySelectorAll('.log-table tbody tr').length,2));click('[data-desk="resetAnalysis"]');input('#logFrom','2026-10-26T10:30');click('[data-desk="analyzeLogs"]');check(()=>assert.equal(w.document.querySelectorAll('.log-table tbody tr').length,1));click('#exportLogs');await wait(10);check(()=>assert.equal(downloads.at(-1).name,'LetsWin-CTF-results.csv'));const csv=await downloads.at(-1).blob.text();check(()=>assert.ok(csv.includes('ok')&&!csv.includes('error')));
  click('[data-desk="resetAnalysis"]');input('#logFilter','error');click('#filterLogs');await wait(10);check(()=>assert.equal(w.document.querySelectorAll('.log-table tbody tr').length,2));input('#logFilterMode','regex');input('#logFilter','ok');click('#filterLogs');await wait(120);check(()=>assert.equal(w.document.querySelectorAll('.log-table tbody tr').length,1));
  input('#logZone','INVALID/ZONE');click('[data-desk="analyzeLogs"]');await wait(10);check(()=>assert.equal($('#output').classList.contains('error'),true));
  open('forensics','regex');input('#regexPattern','flag\\{[^}]+\\}');input('#regexInput','a flag{test} b');click('[data-run="regex"]');await wait(120);check(()=>assert.match($('#output').textContent,/flag\{test\}/));input('#regexPattern','(a+)+$');input('#regexInput','a'.repeat(30000)+'!');click('[data-run="regex"]');await wait(1200);check(()=>assert.match($('#output').textContent,/time|second|limit|too long/i));
  open('osint','what3words');input('#wordsInput','///clip.apples.leap');click('[data-run="what3words"]');check(()=>assert.equal($('#output a').href,'https://what3words.com/clip.apples.leap'));
  open('web','jwt');input('#jwtInput','eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIn0.');click('[data-run="jwt"]');check(()=>assert.match($('#output').textContent,/demo/));
  open('network','cidr');input('#cidrInput','192.0.2.0/24');click('[data-run="cidr"]');check(()=>assert.match($('#output').textContent,/256/));
  open('osint','url');input('#urlInput','https://example.test/path?a=1');click('[data-run="url"]');check(()=>assert.match($('#output').textContent,/example.test/));
  open('osint','iocs');input('#iocInput','Contact analyst@example.test; https://example.test at 192.0.2.1');click('[data-run="iocs"]');check(()=>assert.match($('#output').textContent,/192\.0\.2\.1/));
  open('crypto','hash');input('#hashText','abc');click('[data-run="hashText"]');await wait(30);check(()=>assert.match($('#output').textContent,/ba7816bf8f01cfea414140de5dae2223/));
  file('#hashFile','sample.txt','abc');$('#hashFile').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(30);check(()=>assert.match($('#output').textContent,/sample.txt/));
  open('crypto','hashid');input('#hashInput','5d41402abc4b2a76b9719d911017c592');click('[data-run="hashid"]');check(()=>assert.match($('#output').textContent,/MD5/));
  open('crypto','wordlist');input('#wordlistHash','2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');input('#wordlistInput','wrong\nhello\nno');click('[data-run="wordlist"]');await wait(50);check(()=>assert.match($('#output').textContent,/hello/));
  open('forensics','file');file('#triageFile','sample.txt','flag{test file}');$('#triageFile').files[0].slice=function(start,end){return new Blob(['flag{test file}'.slice(start,end)]);};click('[data-run="file"]');await wait(20);check(()=>assert.match($('#output').textContent,/flag\{test file\}/));
  open('network','pcap');file('#pcapFile','sample.pcap',fixtures.practiceCapture());click('[data-run="pcap"]');await wait(20);check(()=>assert.match($('#output').textContent,/TCP/));
  open('network','streams');file('#streamFile','sample.pcap',fixtures.practiceCapture());click('[data-desk="streams"]');await wait(30);check(()=>assert.match($('#streamResults').textContent,/example.com/));check(()=>assert.ok($('[data-http-download]')));click('[data-http-download]');const bodyExport=await downloads.at(-1).blob.text();check(()=>assert.equal(bodyExport,'flag{stream_demo}'));
  click('[data-stream-download]');check(()=>assert.match(downloads.at(-1).name,/TCP-run/));
  open('forensics','code');input('#codeInput','def greet(name):\n    print(name)');click('[data-desk="identifyCode"]');check(()=>assert.equal(JSON.parse($('#output').textContent).likelyType,'Python'));
  file('#codeFile','demo.go','package main\nfunc main() { fmt.Println("hello") }');$('#codeFile').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);check(()=>assert.equal(JSON.parse($('#output').textContent).likelyType,'Go'));check(()=>assert.equal($('#codeFilename').value,'demo.go'));
  input('#codeInput','<script>globalThis.__unsafeCodeRan = true;</script>');click('[data-desk="identifyCode"]');check(()=>assert.equal(w.__unsafeCodeRan,undefined));check(()=>assert.equal($('#content script'),null));
  file('#codeFile','utf16.py',Buffer.concat([Buffer.from([255,254]),Buffer.from('def greet():\n    print(1)','utf16le')]));$('#codeFile').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);check(()=>assert.equal(JSON.parse($('#output').textContent).likelyType,'Python'));
  file('#codeFile','binary.dat',Buffer.from([255,255,0]));$('#codeFile').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);check(()=>assert.match($('#output').textContent,/not valid UTF/));
  open('crypto','codec');input('#codecInput','def greet():\n    print(1)');input('#codecFormat','rot13');input('#codecDirection','encode');click('[data-run="codec"]');input('#handoffTarget','code');click('[data-desk="sendOutput"]');check(()=>assert.match($('#codeInput').value,/qrs terrg/));
  click('[data-nav="catalog"]');input('#catalogSearch','md5decrypt');check(()=>assert.match($('#catalogResults').textContent,/YOUR TOP CHOICE/));click('[data-favorite]');click('[data-nav="favorites"]');check(()=>assert.match($('#content').textContent,/md5decrypt/));check(()=>assert.ok($('#content details')));
  click('[data-nav="guides"]');check(()=>assert.equal(w.document.querySelectorAll('.guide').length,5));click('[data-handoff-tool="image"]');check(()=>assert.ok($('#imageFile')));
  click('[data-nav="workspace"]');check(()=>assert.equal($('[data-challenge-field="notes"]').value,'solo investigation'));check(()=>assert.match($('#content').textContent,/Encoding Workbench/));click('[data-desk="export"]');const backup=await downloads.at(-1).blob.text();check(()=>assert.equal(JSON.parse(backup).mode,'individual'));
  click('#changeMode');click('[data-mode="team"]');check(()=>assert.ok($('#teamNotes')));click('[data-nav="workspace"]');check(()=>assert.equal($('#challengeTitle'),null));click('[data-nav="favorites"]');check(()=>assert.match($('#content').textContent,/No favorites/));open('crypto','recipes');check(()=>assert.equal($('#savedRecipes').options.length,0));
  click('[data-nav="workspace"]');file('#workspaceImport','solo.json',backup);$('#workspaceImport').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(10);check(()=>assert.match($('#saveStatus').textContent,/game mode/));
  click('[data-desk="new"]');input('#challengeTitle','Team case');input('[data-challenge-field="notes"]','team private');click('#changeMode');click('[data-mode="individual"]');click('[data-nav="workspace"]');check(()=>assert.equal($('[data-challenge-field="notes"]').value,'solo investigation'));
  file('#workspaceImport','backup.json',backup);$('#workspaceImport').dispatchEvent(new w.Event('change',{bubbles:true}));await wait(10);check(()=>assert.match($('#saveStatus').textContent,/replaces/));click('#saveStatus button');check(()=>assert.equal($('[data-challenge-field="flag"]').value,'flag{demo}'));
  click('[data-desk="delete"]');check(()=>assert.ok($('[data-desk="confirmDelete"]')));click('[data-desk="cancelDelete"]');check(()=>assert.ok($('#challengeTitle')));
  // All workbenches render with output and the handoff controls.
  for(const [category,ids] of [['osint',['url','iocs','what3words']],['crypto',['codec','hash','hashid','wordlist','digests','ciphers','recipes']],['forensics',['file','logs','regex','image','code']],['web',['jwt']],['network',['pcap','cidr','streams']]])for(const id of ids){open(category,id);check(()=>assert.ok($('#output')&&$('#handoffTarget'),id));}
  // A pending file read cannot populate a new mode/page.
  open('network','streams');let resolve;Object.defineProperty($('#streamFile'),'files',{value:[{size:24,arrayBuffer:()=>new Promise(r=>resolve=r)}]});click('[data-desk="streams"]');click('#changeMode');click('[data-mode="team"]');resolve(new ArrayBuffer(24));await wait(10);check(()=>assert.equal($('#streamResults'),null));check(()=>assert.ok($('#teamNotes')));
  check(()=>assert.deepEqual(errors.map(e=>e.message),[]));dom.window.close();
  console.log(`DOM UI workflows passed: ${checks} assertions, including all 19 workbenches, worker timeout, import/export, handoffs and mode isolation.`);
})().catch(e=>{console.error(e);process.exitCode=1;});




