import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const files = [
  'index.html', 'modulo1.html', 'modulo2.html', 'modulo3.html', 'percurso.html',
  'modulo4.html', 'modulo5.html', 'modulo6.html', 'modulo7.html',
  'formacao.css', 'formacao-dados.js', 'formacao-config.js', 'formacao-leitura.js',
  'formacao.js', '271bad1e-854b-4f1e-b68a-d84c0b58180c.js', 'curso.js', 'curso-acesso.js',
  'offline.js', 'manual.pdf', 'logo_ins.png', 'i192.png', 'i512.png', 'manifest.json'
];
const raw = await readFile('formacao-dados.js', 'utf8');
const data = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
for (const module of data.modules) for (const section of module.sections) {
  for (const match of section.html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(?:https?:|data:|mailto:)/.test(match[1])) throw new Error('External lesson resource needs review: ' + match[1]);
    files.push(match[1].split(/[?#]/)[0]);
  }
}
const manifest = await Promise.all([...new Set(files)].sort().map(async path => {
  const content = await readFile(path);
  return {path, bytes: content.byteLength, sha256: createHash('sha256').update(content).digest('hex')};
}));
const worker = await readFile('sw.js', 'utf8');
const id = createHash('sha256').update(JSON.stringify(manifest)).digest('hex').slice(0, 16);
await writeFile('sw.js', worker.replace(/\/\* OFFLINE_FILES_START \*\/[\s\S]*?\/\* OFFLINE_FILES_END \*\//,
  '/* OFFLINE_FILES_START */ ' + JSON.stringify(manifest, null, 2) + ' /* OFFLINE_FILES_END */')
  .replace(/\/\* OFFLINE_ID_START \*\/[\s\S]*?\/\* OFFLINE_ID_END \*\//,
    '/* OFFLINE_ID_START */ ' + JSON.stringify(id) + ' /* OFFLINE_ID_END */'));
console.log(manifest.length + ' resources, ' + manifest.reduce((n, f) => n + f.bytes, 0) + ' bytes');
