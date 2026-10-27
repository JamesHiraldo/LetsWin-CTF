const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const R = require("../catalog.js");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const initializer = source.slice(source.indexOf("  const categories = ["), source.indexOf("  R.apply(categories);"));
const categories = vm.runInNewContext(initializer + "\ncategories;");
R.apply(categories);
for (const [id, name] of [...R.requested, ...R.imported]) {
  const entries = id === "training" ? R.training : categories.find(category => category.id === id).resources;
  assert.ok(entries.some(entry => entry[0].toLowerCase() === name.toLowerCase()), `Missing ${name}`);
}
const all = [...categories.flatMap(category => category.resources), ...R.training];
for (const entry of all) assert.ok(["http:", "https:"].includes(new URL(entry[2]).protocol));
assert.equal(categories.find(category => category.id === "crypto").resources[0][0], "md5decrypt");
const count = all.length;
R.apply(categories);
assert.equal(categories.flatMap(category => category.resources).length + R.training.length, count);
console.log(`Catalog coverage passed: ${R.imported.length} repository entries, ${count} linked resources total.`);
