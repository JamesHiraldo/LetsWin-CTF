const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "LetsWin CTF.html"), "utf8");
assert.match(html, /Choose your game mode/);
assert.match(html, /RegEx Workbench/);
assert.match(html, /https:\/\/regex101\.com\//);
assert.doesNotMatch(html, /<script\s+src=/);
assert.doesNotMatch(html, /<link[^>]+href="styles\.css"/);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const sourceHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const sourceFiles = [...sourceHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
assert.equal(scripts.length, sourceFiles.length);
for (const script of scripts) new vm.Script(script[1]);
for (const filename of sourceFiles) {
  assert.ok(html.includes(fs.readFileSync(path.join(__dirname, "..", filename), "utf8")), `Bundle changed literal source bytes: ${filename}`);
}

console.log("Self-contained bundle checks passed.");
