const assert = require("node:assert/strict");
const C = require("../code-identifier.js");
const examples = [
  ["Python", 'import os\ndef greet(name):\n    print(name)'],
  ["JavaScript", 'const greet = (name) => { console.log(name); };'],
  ["TypeScript", 'interface User { name: string; }\nconst age: number = 42;'],
  ["PHP", '<?php $user = $_GET["name"]; echo $user; ?>'],
  ["C", '#include <stdio.h>\nint main(void) { printf("hello"); return 0; }'],
  ["C++", '#include <iostream>\nint main() { std::cout << "hello"; }'],
  ["C#", 'using System;\nnamespace Demo { class App { static void Main() { Console.WriteLine("hi"); } } }'],
  ["Java", 'public class App { public static void main(String[] args) { System.out.println("hi"); } }'],
  ["Go", 'package main\nfunc main() { fmt.Println("hi") }'],
  ["Rust", 'fn main() { let mut n = 1; println!("{}", n); }'],
  ["Ruby", 'def greet(name)\n  puts name\nend'],
  ["Perl", 'use strict; use warnings; my $n = 1; sub greet { print $n; }'],
  ["Lua", 'local function greet(name)\n  local n = 1\n  print(name)\nend'],
  ["PowerShell", 'param([string]$Name)\nWrite-Host $Name'],
  ["Shell (sh/Bash)", 'if [ -f sample ]; then\n echo ${HOME}\nfi'],
  ["Windows Batch", '@echo off\nsetlocal\necho %PATH%'],
  ["SQL", 'SELECT name FROM users WHERE id = 1 ORDER BY name;'],
  ["HTML", '<!doctype html><html><body><p>Hello</p></body></html>'],
  ["CSS", 'body { color: red; margin: 0; }'],
  ["JSON", '{"name":"sample","enabled":true}'],
  ["XML", '<?xml version="1.0"?><root xmlns="urn:demo"><item>1</item></root>'],
  ["YAML", '---\nname: demo\nitems:\n  - id: 1'],
  ["Assembly", 'section .text\nglobal _start\n_start:\nmov eax, 1\nret'],
  ["Swift", 'import Foundation\nfunc greet() -> String { return "Hello" }'],
  ["Kotlin", 'fun main() { val name: String = "Hello"; println(name) }']
];
for (const [language, source] of examples) {
  const result = C.identify(source);
  assert.equal(result.likelyType, language, JSON.stringify(result));
  assert.ok(result.candidates[0].clues.length);
}
assert.equal(C.languages.length, examples.length);
assert.equal(C.identify('#app { color: blue; }').likelyType, 'CSS');
assert.equal(C.identify('# comment\n\ndef greet():\n    return 1').candidates[0].clues.find(c=>c.reason==='Python function definition').line,3);
assert.equal(C.identify('<script>const greet = () => { console.log(1); };</script>').likelyType, 'HTML');
assert.match(C.identify('hello world').likelyType, /Unknown/);
assert.equal(C.identify('x = 1', 'sample.py').confidence, 'Low / ambiguous');
assert.equal(C.identify('def greet():\n    print(1)', 'wrong.js').likelyType, 'Python');
assert.equal(C.identify('#!/usr/bin/env python3\nprint(1)').likelyType, 'Python');
assert.equal(C.identify('```python\ndef greet():\n    return 1\n```').likelyType, 'Python');
assert.equal(C.identify('// def fake():\nconst x = "<?php use strict;"; console.log(x);').likelyType, 'JavaScript');
assert.equal(C.identify('/* fn fake() { println!(1); } */\nhello').confidence, 'Unknown');
assert.ok(C.identify('int main() { return 0; }').confidence.includes('Low'));
assert.throws(() => C.identify(''), /Paste code/);
assert.throws(() => C.identify('a'.repeat(200001)), /200,000/);
assert.throws(() => C.identify('MZ\0binary'), /binary/);
assert.doesNotThrow(() => C.identify('a'.repeat(200000)));
global.__codeIdentifierExecuted = false;
C.identify('globalThis.__codeIdentifierExecuted = true; console.log("test");');
assert.equal(global.__codeIdentifierExecuted, false);
delete global.__codeIdentifierExecuted;
console.log(`Code Identifier passed: ${examples.length} language/format fixtures, ambiguity, misleading hints, quoted/comment text, input limits and no execution.`);
