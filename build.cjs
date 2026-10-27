const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const replacements = [
  ['<link rel="stylesheet" href="styles.css">', `<style>\n${fs.readFileSync(path.join(root, "styles.css"), "utf8")}\n</style>`],
  ...scripts.map(file => [`<script src="${file}"></script>`, `<script>\n${fs.readFileSync(path.join(root, file), "utf8")}\n</script>`])
];
for (const [needle, replacement] of replacements) {
  if (!html.includes(needle)) throw new Error(`Missing template marker: ${needle}`);
  html = html.replace(needle, () => replacement);
}
const licenses = ["vendor/crypto-js-LICENSE.txt", "vendor/jsQR-LICENSE.txt"].map(file => file + "\n" + fs.readFileSync(path.join(root, file), "utf8")).join("\n\n").replace(/--/g, "—");
html = html.replace("</body>", () => `<!-- Bundled third-party licenses\n${licenses}\n-->\n</body>`);
fs.writeFileSync(path.join(root, "LetsWin CTF.html"), html, "utf8");
console.log("Built LetsWin CTF.html");
