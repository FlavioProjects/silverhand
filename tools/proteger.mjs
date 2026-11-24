#!/usr/bin/env node
/* Gera a versão protegida do site NO PRÓPRIO DIRETÓRIO (sobrescreve).
   Rodar sempre sobre os arquivos LEGÍVEIS (ver README, 'Proteção do código'), nunca duas vezes.
     cd tools && npm install && node proteger.mjs
   - js/main.js, js/legal.js: ofuscados (nomes, strings e fluxo embaralhados)
   - js/guard.js: gerado a partir de tools/guard.src.js (bloqueios + anti-DevTools)
   - css/*.css: minificados, sem comentários
   - index.html, privacy.html, 404.html: sem comentários e espaços colapsados;
     <script> inline e JSON-LD ficam idênticos (os hashes da CSP no _headers continuam valendo)
   - ?v= das três páginas trocado, para o cache dos visitantes pegar a versão nova */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import JsObfuscator from 'javascript-obfuscator';
import CleanCSS from 'clean-css';
import { minify } from 'html-minifier-terser';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const p = (f) => resolve(root, f);

const marker = '/*sh-protected*/';
for (const f of ['js/main.js', 'js/legal.js']) {
  if (readFileSync(p(f), 'utf8').startsWith(marker)) {
    console.error(`${f} já está protegido. Recupere os arquivos legíveis (ver README, 'Proteção do código').`);
    process.exit(1);
  }
}

const base = {
  compact: true, simplify: true, sourceMap: false,
  identifierNamesGenerator: 'hexadecimal', renameGlobals: false,
  disableConsoleOutput: true, numbersToExpressions: true,
  stringArray: true, stringArrayEncoding: ['base64'], stringArrayThreshold: 1,
  stringArrayRotate: true, stringArrayShuffle: true,
  splitStrings: true, splitStringsChunkLength: 8,
  transformObjectKeys: true, unicodeEscapeSequence: false, selfDefending: true,
};
// sem controlFlowFlattening/deadCode no código do site: pesam no carregamento e nas animações
const siteOpts = { ...base, controlFlowFlattening: false, deadCodeInjection: false };
const guardOpts = { ...base, stringArrayEncoding: ['rc4'], controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5, deadCodeInjection: false };
// (sem debugProtection: o guard.src.js já faz a checagem do DevTools, e o loop extra gastava CPU)

const obf = (src, o) => marker + JsObfuscator.obfuscate(src.replace(/\bdebugger\s*;/g, ''), o).getObfuscatedCode();
for (const f of ['js/main.js', 'js/legal.js']) writeFileSync(p(f), obf(readFileSync(p(f), 'utf8'), siteOpts));
writeFileSync(p('js/guard.js'), marker + JsObfuscator.obfuscate(readFileSync(resolve(here, 'guard.src.js'), 'utf8'), guardOpts).getObfuscatedCode());

for (const f of ['css/style.css', 'css/legal.css']) {
  const out = new CleanCSS({ level: { 1: { specialComments: 0 } } }).minify(readFileSync(p(f), 'utf8'));
  if (out.errors.length) { console.error(f, out.errors); process.exit(1); }
  writeFileSync(p(f), out.styles);
}

const d = new Date();
const ver = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
for (const f of ['index.html', 'privacy.html', '404.html']) {
  let html = readFileSync(p(f), 'utf8');
  html = html.replace(/(\.(?:css|js))\?v=\d+/g, `$1?v=${ver}`);
  const guardSrc = f === '404.html' ? '/js/guard.js' : 'js/guard.js';
  html = html.replace('</head>', `<script src="${guardSrc}?v=${ver}" defer></script>\n</head>`);
  html = await minify(html, {
    removeComments: true, collapseWhitespace: true, conservativeCollapse: true,
    minifyJS: false, minifyCSS: false, processScripts: [], keepClosingSlash: true,
    caseSensitive: true,
  });
  writeFileSync(p(f), html);
}
console.log(`Protegido. Versão de cache: ${ver}`);
