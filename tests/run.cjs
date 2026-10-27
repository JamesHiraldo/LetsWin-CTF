const {spawnSync}=require("node:child_process");
const fs=require("node:fs"),path=require("node:path");
const start=Date.now();let passed=0;
for(const file of fs.readdirSync(__dirname).filter(f=>f.endsWith(".test.cjs")).sort()){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status||1);passed++;
}
console.log(`${passed} suites passed in ${((Date.now()-start)/1000).toFixed(2)} seconds.`);
