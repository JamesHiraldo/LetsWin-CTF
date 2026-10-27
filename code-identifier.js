(function (root) {
  "use strict";
  // Fixed syntax rules only: input is never evaluated, compiled or transmitted.
  const definitions = [
    ["Python", "Python interpreter", ["py", "pyw"], [
      [6, /^\s*(?:async\s+)?def\s+\w+\s*\([^\n]*\)\s*(?:->[^\n]+)?\s*:/m, "Python function definition"],
      [4, /^\s*(?:from\s+[\w.]+\s+import\s+|import\s+[\w.]+\s*$)/m, "Python import statement"],
      [4, /^\s*(?:if|elif|for|while|class|with|except)\b[^\n{};]{0,200}:\s*$/m, "Colon-ended block"],
      [2, /\b(?:print|len|range)\s*\(|\b(?:True|False|None)\b/, "Python-style built-in or literal"]]],
    ["JavaScript", "Browser or Node.js", ["js", "mjs", "cjs", "jsx"], [
      [4, /\b(?:const|let|var)\s+[\w$]+\s*=/, "JavaScript variable declaration"],
      [4, /\bfunction\s*[\w$]*\s*\(|=>/, "Function or arrow syntax"],
      [4, /\b(?:console\s*\.\s*log|document\s*\.|module\s*\.\s*exports|require\s*\()/, "JavaScript runtime API"],
      [3, /^\s*(?:export\s+(?:default|const|function)|import\s*[{*])/m, "JavaScript module syntax"]]],
    ["TypeScript", "TypeScript compiler; JavaScript runtime", ["ts", "tsx", "mts", "cts"], [
      [6, /\b(?:interface|type)\s+\w+\s*(?:extends\s+\w+\s*)?[{=]/, "TypeScript type declaration"],
      [5, /\b(?:const|let)\s+\w+\s*:\s*[\w<>{}\[\]| ]{1,80}\s*=/, "Typed JavaScript variable"],
      [5, /\b\w+\s*:\s*(?:string|number|boolean|unknown|never)\b/, "TypeScript primitive annotation"],
      [3, /\b(?:import|export)\s+type\b|\bsatisfies\s+\w+/, "TypeScript-specific type syntax"]]],
    ["PHP", "PHP interpreter", ["php", "phtml"], [
      [12, /<\?php\b|<\?=/i, "PHP opening tag"],
      [4, /\$\w+\s*->|\$_(?:GET|POST|SERVER|SESSION)\b/, "PHP object access or superglobal"],
      [3, /\b(?:echo|require_once|include_once)\b|\bfunction\s+\w+\s*\(\s*\$/, "PHP output/include or function syntax"]]],
    ["C", "C compiler", ["c", "h"], [
      [5, /^\s*#\s*include\s*<\s*(?:stdio|stdlib|string|stdint|unistd)\.h\s*>/m, "C standard-library include"],
      [4, /\b(?:int|void)\s+main\s*\(/, "C-family main function"],
      [3, /\b(?:printf|scanf|malloc|free)\s*\(/, "C library call"],
      [2, /\b(?:typedef\s+struct|sizeof\s*\()/, "C-family type/memory syntax"]]],
    ["C++", "C++ compiler", ["cpp", "cc", "cxx", "hpp", "hxx", "h"], [
      [7, /\bstd::\w+|\busing\s+namespace\s+std\b/, "C++ standard namespace"],
      [6, /^\s*#\s*include\s*<(?:iostream|vector|string|map|memory)>/m, "C++ library header"],
      [5, /\btemplate\s*<|\bconstexpr\b|\bnullptr\b/, "C++ language feature"]]],
    ["C#", ".NET", ["cs", "csx"], [
      [6, /\busing\s+System(?:\.|\s*;)|\bConsole\s*\.\s*Write(?:Line)?\s*\(/, ".NET namespace or console API"],
      [5, /\b(?:public|private)\s+(?:static\s+)?(?:void|Task)\s+Main\s*\(/, "C# Main method"],
      [4, /\bnamespace\s+[\w.]+\s*[{;]|\b(?:get|set)\s*;/, "C# namespace or property accessor"]]],
    ["Java", "Java / JVM", ["java"], [
      [6, /\bpublic\s+static\s+void\s+main\s*\(/, "Java main method"],
      [6, /\bSystem\s*\.\s*out\s*\.\s*print(?:ln)?\s*\(/, "Java console API"],
      [5, /^\s*(?:import\s+java\.|package\s+[\w.]+\s*;)/m, "Java import/package"],
      [2, /\bpublic\s+class\s+\w+/, "Public class declaration"]]],
    ["Go", "Go toolchain", ["go"], [
      [6, /^\s*func\s+(?:\([^\n]+\)\s*)?\w+\s*\(/m, "Go function declaration"],
      [4, /^\s*package\s+\w+\s*$/m, "Go package declaration"],
      [4, /\b\w+\s*:=|\bfmt\s*\.\s*Print(?:ln|f)?\s*\(/, "Go short declaration or fmt API"]]],
    ["Rust", "Rust compiler / Cargo", ["rs"], [
      [6, /\bfn\s+\w+\s*\([^\n]*\)/, "Rust function declaration"],
      [5, /\b(?:println|vec|format|panic)!\s*[([]/, "Rust macro invocation"],
      [4, /\blet\s+mut\b|\bimpl\s+\w+|\buse\s+\w+::/, "Rust binding, implementation or import"]]],
    ["Ruby", "Ruby interpreter", ["rb", "rake", "gemspec"], [
      [5, /^\s*def\s+\w+[!?]?(?:\s*\([^\n]*\))?\s*$/m, "Ruby method definition"],
      [3, /^\s*end\s*$/m, "End-delimited block"],
      [4, /\bputs\s|\.each\s+do\b|\battr_(?:reader|writer|accessor)\b/, "Ruby output/iteration/accessor"]]],
    ["Perl", "Perl interpreter", ["pl", "pm"], [
      [6, /\buse\s+(?:strict|warnings)\s*;/, "Perl pragmas"],
      [5, /\bmy\s+[$@%]\w+|\bsub\s+\w+\s*\{/, "Perl variable or subroutine"],
      [3, /\$\w+\s*=~\s*[ms]\W/, "Perl pattern operation"]]],
    ["Lua", "Lua interpreter", ["lua"], [
      [6, /\blocal\s+function\s+\w+|\bfunction\s+\w+(?:[.:]\w+)*\s*\(/, "Lua-style function declaration"],
      [4, /\blocal\s+\w+\s*=|\b(?:ipairs|pairs)\s*\(/, "Lua local or table iteration"],
      [3, /\bthen\s*$|^\s*end\s*$/m, "Lua-style block terminator"]]],
    ["PowerShell", "PowerShell", ["ps1", "psm1", "psd1"], [
      [6, /\b(?:Write-Host|Write-Output|Get-Content|Get-ChildItem|Invoke-WebRequest|ForEach-Object)\b/i, "PowerShell cmdlet"],
      [5, /\$(?:PSVersionTable|PSScriptRoot|env:|PSItem)\b/i, "PowerShell automatic variable"],
      [4, /\[CmdletBinding\s*\(|\bparam\s*\(\s*\[|\$\w+\s+-(?:eq|ne|match|like)\b/i, "PowerShell parameter/operator syntax"]]],
    ["Shell (sh/Bash)", "POSIX shell or Bash", ["sh", "bash", "zsh"], [
      [6, /^\s*(?:fi|esac|done)\s*;?\s*$/m, "Shell block terminator"],
      [5, /\bthen\s*(?:;|$)|\bdo\s*(?:;|$)/m, "Shell block syntax"],
      [4, /\$\{|\$\(|\[\[/, "Shell expansion or test"],
      [2, /^\s*(?:echo|export|source)\s/m, "Shell-style command"]]],
    ["Windows Batch", "Windows cmd.exe", ["bat", "cmd"], [
      [8, /^\s*@?echo\s+off\b/im, "Batch echo directive"],
      [5, /%~dp0|%[A-Za-z_]\w*%|%%[A-Za-z]/, "Batch variable expansion"],
      [3, /^\s*(?:setlocal|endlocal|goto\s+\w+|call\s+|rem\s)/im, "Batch control command"]]],
    ["SQL", "SQL database engine (dialect varies)", ["sql"], [
      [7, /\bSELECT\b[^;]{0,500}\bFROM\b/i, "SQL SELECT/FROM query"],
      [7, /\b(?:CREATE|ALTER)\s+TABLE\b|\bINSERT\s+INTO\b|\bDELETE\s+FROM\b/i, "SQL data/schema statement"],
      [3, /\b(?:WHERE|GROUP\s+BY|ORDER\s+BY|INNER\s+JOIN)\b/i, "SQL query clause"]]],
    ["HTML", "Web browser", ["html", "htm"], [
      [10, /<!doctype\s+html\b|<html\b/i, "HTML document marker"],
      [5, /<(?:div|span|form|input|button|script|body|head|p|a)\b[^>]{0,300}>/i, "HTML element"],
      [6, /<\/(?:script|style)\s*>/i, "Embedded script/stylesheet closing tag"],
      [3, /<\/(?:div|span|body|script|p|a)>/i, "HTML closing element"]]],
    ["CSS", "Browser stylesheet", ["css"], [
      [6, /(?:[.#][\w-]+|\b(?:body|html|button))\s*\{/, "CSS selector block"],
      [5, /\b(?:color|background|font-size|margin|padding|display|border)\s*:[^;{}\n]{1,100}[;}]/i, "CSS property declaration"],
      [4, /@(?:media|keyframes|supports)\b/, "CSS at-rule"]]],
    ["JSON", "JSON data parser", ["json", "jsonl"], []],
    ["XML", "XML parser", ["xml", "svg", "xsd"], [
      [10, /<\?xml\b/i, "XML declaration"],
      [5, /\bxmlns\s*=/, "XML namespace"],
      [3, /<([A-Za-z_][\w:.-]*)\b[^>]{0,200}>[^<]{0,200}<\/\1\s*>/, "Paired markup elements"]]],
    ["YAML", "YAML data parser", ["yaml", "yml"], [
      [3, /^---\s*$/m, "YAML document separator"],
      [3, /^\s*[\w-]+:\s*(?:[\w.-]+)?\s*$/m, "YAML-style mapping"],
      [3, /^\s*-\s+[\w-]+:\s/m, "YAML mapping sequence"]]],
    ["Assembly", "Assembler; architecture varies", ["asm", "s"], [
      [5, /^\s*(?:section\s+\.|\.text\b|\.global\b|global\s+\w+)/im, "Assembler section/symbol directive"],
      [5, /^\s*(?:mov|lea|xor|push|pop|cmp|ldr|str|add|sub)\s+(?:[re]?(?:ax|bx|cx|dx|sp|bp|si|di)|[xwr]\d+|%\w+)\b/im, "Register/instruction syntax"],
      [3, /^\s*(?:syscall|ret|int\s+0x80)\s*$/im, "Assembler control instruction"]]],
    ["Swift", "Swift toolchain", ["swift"], [
      [6, /\bfunc\s+\w+\s*\([^\n]*\)\s*(?:->\s*\w+\s*)?\{/, "Swift-style function"],
      [6, /^\s*import\s+(?:Foundation|UIKit|SwiftUI)\b/m, "Swift framework import"],
      [4, /\b(?:guard\s+let|if\s+let|var\s+\w+\s*:\s*String)\b/, "Swift binding/type syntax"]]],
    ["Kotlin", "Kotlin / JVM or native", ["kt", "kts"], [
      [7, /\bfun\s+\w+\s*\(/, "Kotlin function declaration"],
      [4, /\b(?:val|var)\s+\w+\s*:\s*(?:String|Int|Boolean)\b/, "Kotlin typed binding"],
      [4, /\bdata\s+class\s+\w+|\bcompanion\s+object\b/, "Kotlin class syntax"]]]
  ];

  // Mask quoted text and common comments while retaining line breaks and offsets.
  // This is a conservative lexical aid, not a complete parser for each language.
  function mask(source) {
    const chars = source.split("");
    function blank(start, end) { for (let j = start; j < end; j++) if (chars[j] !== "\n" && chars[j] !== "\r") chars[j] = " "; }
    let i = 0;
    while (i < source.length) {
      const start = i, c = source[i];
      if (source.startsWith("//", i) || (c === "#" && !/^#\s*(?:include|define|if|endif|pragma)\b/.test(source.slice(i, i + 40)) && !/^#[\w-]+[^\n]{0,80}\{/.test(source.slice(i,i+100)))) {
        while (i < source.length && source[i] !== "\n") i++;
        blank(start, i);
      } else if (source.startsWith("/*", i) || source.startsWith("<!--", i)) {
        const endToken = source.startsWith("/*", i) ? "*/" : "-->";
        const end = source.indexOf(endToken, i + 2); i = end < 0 ? source.length : end + endToken.length; blank(start, i);
      } else if (c === '"' || c === "'" || c === "`") {
        const token = source.startsWith(c.repeat(3), i) ? c.repeat(3) : c;
        i += token.length;
        while (i < source.length) {
          if (source[i] === "\\") { i += 2; continue; }
          if (source.startsWith(token, i)) { i += token.length; break; }
          i++;
        }
        blank(start, Math.min(i, source.length));
      } else i++;
    }
    return chars.join("");
  }

  function identify(input, filename = "") {
    if (typeof input !== "string" || !input.trim()) throw new Error("Paste code or open a source file first.");
    if (input.length > 200000) throw new Error("Code identification is limited to 200,000 characters.");
    if (input.includes("\0")) throw new Error("This looks like binary data. Use File Triage for executable files.");
    let source = input.replace(/^\uFEFF/, ""), fenceHint = "";
    const fence = source.trim().match(/^```([\w#+.-]*)[^\S\n]*\n([\s\S]*?)\n```$/);
    if (fence) { fenceHint = fence[1].toLowerCase(); source = fence[2]; }
    const clean = mask(source), extension = String(filename).split(/[\\/]/).pop().split(".").slice(1).pop()?.toLowerCase();
    const aliases = {js:"JavaScript",jsx:"JavaScript",ts:"TypeScript",tsx:"TypeScript",py:"Python",python:"Python",cpp:"C++",csharp:"C#",cs:"C#",bash:"Shell (sh/Bash)",sh:"Shell (sh/Bash)",ps1:"PowerShell",powershell:"PowerShell",yml:"YAML"};
    const shebang = source.match(/^#![^\n]{0,200}/)?.[0] || "";
    const interpreters = [[/\bpython[\d.]*\b/,"Python"],[/\b(?:node|nodejs)\b/,"JavaScript"],[/\b(?:bash|sh|zsh)\b/,"Shell (sh/Bash)"],[/\bruby\b/,"Ruby"],[/\bperl\b/,"Perl"],[/\bphp\b/,"PHP"],[/\blua[\d.]*\b/,"Lua"],[/\bpwsh\b/,"PowerShell"]];
    let json = false;
    if (/^\s*[{[]/.test(source)) { try { const value = JSON.parse(source); json = value !== null && typeof value === "object"; } catch { /* Not a complete JSON document. */ } }
    const candidates = definitions.map(([language, environment, extensions, rules]) => {
      let score = 0, syntaxScore = 0; const clues = [];
      for (const [weight, pattern, reason] of rules) {
        const match = pattern.exec(clean);
        if (match) { score += weight; syntaxScore += weight; const tokenOffset=match.index+Math.max(0,match[0].search(/\S/)); clues.push({reason, line: clean.slice(0,tokenOffset).split("\n").length}); }
      }
      if (language === "JSON" && json) { score += 14; syntaxScore += 14; clues.push({reason:"Successfully parsed as a complete JSON object or array"}); }
      if (interpreters.some(([pattern, name]) => name === language && pattern.test(shebang))) { score += 12; syntaxScore += 12; clues.push({reason:"Interpreter named in the shebang",line:1}); }
      if (extension && extensions.includes(extension)) { score += 3; clues.push({reason:`Filename extension .${extension} (hint only)`}); }
      if (fenceHint && (aliases[fenceHint] || fenceHint).toLowerCase() === language.toLowerCase()) { score += 3; clues.push({reason:"Markdown code-fence language label (hint only)"}); }
      return {language, environment, score, syntaxScore, clues};
    }).filter(c => c.score >= 3).sort((a,b) => b.score-a.score || b.syntaxScore-a.syntaxScore || a.language.localeCompare(b.language));
    const best = candidates[0], runnerUp = candidates[1];
    const gap = best ? best.score - (runnerUp?.score || 0) : 0;
    const confidence = !best ? "Unknown" : best.syntaxScore >= 9 && gap >= 4 ? "High" : best.syntaxScore >= 5 && gap >= 2 ? "Moderate" : "Low / ambiguous";
    const embedded = [];
    if (best?.language === "HTML" && /<script\b/i.test(clean)) embedded.push("Script element present; inspect its contents separately to identify the script language.");
    if (best?.language === "HTML" && /<style\b/i.test(clean)) embedded.push("Embedded stylesheet element present.");
    return {
      likelyType: best?.language || "Unknown — insufficient recognizable syntax",
      confidence,
      environment: best?.environment || "Undetermined",
      lines: source.split(/\r\n|\r|\n/).length,
      characters: source.length,
      candidates: candidates.slice(0,5),
      embedded,
      note: "Rule-based identification, not AI. Confidence is a heuristic label, not a probability. Shared syntax, comments, incomplete or obfuscated code can be ambiguous. This does not identify the exact app that produced the code, prove what it does, or establish that it is safe. Code is never executed."
    };
  }
  const api = {identify, languages: definitions.map(d => d[0])};
  root.CTFCode = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
