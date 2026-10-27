const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const [vendor,pkg] of [['vendor/jsQR.js','jsqr/dist/jsQR.js'],['vendor/crypto-js.js','crypto-js/crypto-js.js']])assert.deepEqual(fs.readFileSync(path.join(root,vendor)),fs.readFileSync(require.resolve(pkg)),`Vendored bytes differ: ${vendor}`);
const html=fs.readFileSync(path.join(root,'LetsWin CTF.html'),'utf8');assert.ok(html.includes('Bundled third-party licenses'));assert.ok(html.includes('Apache License'));assert.ok(html.includes('Jeff Mott'));
for(const doc of ['README.md','docs/USER_GUIDE.md','docs/THIRD_PARTY.md']){const text=fs.readFileSync(path.join(root,doc),'utf8');for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const target=match[1];if(!/^(?:https?:|#)/.test(target))assert.ok(fs.existsSync(path.resolve(root,path.dirname(doc),target)),`Broken documentation link ${doc}: ${target}`);}}
assert.ok(fs.statSync(path.join(root,'docs','letswin-overview.png')).size>10000);
assert.match(fs.readFileSync(path.join(root,'LetsWin CTF.cmd'),'utf8'),/%~dp0LetsWin CTF\.html/);
assert.match(fs.readFileSync(path.join(root,'LetsWin CTF.command'),'utf8'),/open "LetsWin CTF\.html"/);
console.log('Distribution checks passed: pinned vendor bytes, embedded licenses, documentation links, screenshot and launcher targets.');
