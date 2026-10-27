// Optional read-only availability check. External failures are recorded, not hidden.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'app.js'),'utf8'),R=require('../catalog');
const categories=vm.runInNewContext(source.slice(source.indexOf('  const categories = ['),source.indexOf('  R.apply(categories);'))+'\ncategories;');R.apply(categories);
const resources=[...categories.flatMap(c=>c.resources),...R.training],results=[];let cursor=0;
const reportPath=path.join(root,'docs','link-check.json');
const prior=process.argv.includes('--changed')&&fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):null;
async function check(resource){const [name,,url]=resource;const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol)||/^(localhost|127\.|\[|10\.|192\.168\.)/.test(parsed.hostname))return {name,url,result:'Skipped non-public URL'};
  const cached=prior?.results.find(r=>r.name===name&&r.url===url);if(cached)return {...cached,checkedAt:cached.checkedAt||prior.checkedAt};
  try {let response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'LetsWinCTF-LinkCheck/2.0'}});let method='HEAD';if([403,405,501].includes(response.status)){response=await fetch(url,{method:'GET',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'LetsWinCTF-LinkCheck/2.0','Range':'bytes=0-1023'}});method='GET';}await response.body?.cancel();return {name,url,status:response.status,method,finalUrl:response.url,result:response.ok?'Responded successfully':`HTTP ${response.status}; manual check needed`};}
  catch(e){return {name,url,result:'Not verified',error:e.cause?.code||e.name};}
}
(async()=>{await Promise.all(Array.from({length:6},async()=>{while(cursor<resources.length){const index=cursor++;results[index]=await check(resources[index]);results[index].checkedAt??=new Date().toISOString();}}));const result={checkedAt:new Date().toISOString(),note:'HTTP availability only. Does not verify site functionality, price, accounts, uploads, or downloadable programs. Bot protections may reject automated requests. Each row records its own check time; --changed rechecks only changed URLs.',results};fs.writeFileSync(reportPath,JSON.stringify(result,null,2));const ok=results.filter(r=>r.status>=200&&r.status<300).length;console.log(`${ok}/${results.length} resources responded successfully; ${results.length-ok} require manual verification. See docs/link-check.json.`);})().catch(e=>{console.error(e);process.exitCode=1;});
