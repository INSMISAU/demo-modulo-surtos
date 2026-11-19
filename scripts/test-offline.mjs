import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto, createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const source = await readFile('sw.js', 'utf8');
const core = JSON.parse(source.match(/OFFLINE_FILES_START \*\/ ([\s\S]*?) \/\* OFFLINE_FILES_END/)[1]);
const scope = 'https://example.test/demo-modulo-surtos/';
const mime = path => path.endsWith('.html') ? 'text/html' : path.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
let assertions = 0;
function ok(value, message) { assert.ok(value, message); assertions++; }
function eq(a, b, message) { assert.deepEqual(a, b, message); assertions++; }
const content = new Map();
for (const f of core) {
  const data = await readFile(f.path); content.set(f.path, data);
  eq(data.byteLength, f.bytes, f.path + ' size');
  eq(createHash('sha256').update(data).digest('hex'), f.sha256, f.path + ' digest');
}
const raw = await readFile('formacao-dados.js', 'utf8');
const course = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
const listed = new Set(core.map(f => f.path));
for (const m of course.modules) for (const s of m.sections) {
  for (const match of s.html.matchAll(/(?:href|src)="([^"#]+)"/g)) ok(listed.has(match[1].split(/[?#]/)[0]), 'Lesson resource covered');
}
for (const name of ['index.html','modulo1.html','modulo2.html','modulo3.html','percurso.html']) {
  const html = (await readFile(name)).toString();
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (m[1].startsWith('http')) {
      eq(m[1], 'https://insmisau.github.io/academia-digital-ins/#catalogo', 'Fixed return to Academy');
      continue;
    }
    ok(listed.has(m[1].split(/[?#]/)[0]), name + ' dependency ' + m[1]);
  }
  eq((html.match(/src="offline.js"/g) || []).length, 1, 'One registration path');
  eq((html.match(/class="academy-return"/g) || []).length, 1, 'Return link on every course page');
  ok(html.includes('href="https://insmisau.github.io/academia-digital-ins/#catalogo"'), 'Return reaches the Academy catalogue');
}
for (const name of ['formacao-dados.js','formacao-config.js','formacao.js','formacao-leitura.js','curso.js','manual.pdf',
 'image1.png','image2.png','image3.png','image4.png','image5.png','image6.png','image7.png','image8.png']) {
  const before = execFileSync('git', ['show','HEAD:' + name], {maxBuffer: 12000000});
  eq(await readFile(name), before, 'Approved file untouched: ' + name);
}

function worker() {
  const handlers = {}, stores = new Map(), calls = [], notices = [];
  let offline = false, bad = '', httpError = '', quota = false, claimed = 0, skipped = 0;
  function cache(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      async match(input) { return entries.get(typeof input === 'string' ? input : input.url)?.clone(); },
      async put(input, response) {
        if (quota) throw new Error('QuotaExceededError');
        entries.set(typeof input === 'string' ? input : input.url, response.clone());
      },
      async delete(input) { return entries.delete(input); }
    };
  }
  const env = vm.createContext({URL, Request, Response, Headers, AbortController, crypto: webcrypto,
    Uint8Array, setTimeout, clearTimeout, console,
    caches: {open: async name => cache(name)},
    fetch: async req => {
      calls.push(req.url);
      if (offline) throw new TypeError('Network unavailable');
      const path = new URL(req.url).pathname.slice(new URL(scope).pathname.length);
      if (path === httpError) return new Response('not found', {status: 404});
      const bytes = path === bad ? Buffer.from('wrong release') : content.get(path);
      if (!bytes) return new Response('missing', {status: 404});
      return new Response(bytes, {headers: {'Content-Type': mime(path), 'Content-Length': String(bytes.length)}});
    },
    self: {location: {href: scope + 'sw.js'}, addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting: () => { skipped++; }, clients: {claim: async () => { claimed++; },
        matchAll: async () => [{url: scope, postMessage: m => notices.push(m)}, {url: 'https://example.test/other/', postMessage: () => { throw Error('Wrong scope'); }}]}}
  });
  vm.runInContext(source, env);
  return {stores, calls, notices, env,
    set offline(v) { offline = v; }, set bad(v) { bad = v; }, set httpError(v) { httpError = v; }, set quota(v) { quota = v; },
    get claimed() { return claimed; }, get skipped() { return skipped; },
    async event(name) { let p; handlers[name]({waitUntil: value => { p = value; }}); return p; },
    async message(type, url = scope) { let p, reply; handlers.message({source: {url}, data: {type}, ports: [{postMessage: m => { reply = m; }}], waitUntil: value => { p = value; }}); await p; return reply; },
    async fetch(path, init) { let p; handlers.fetch({request: new Request(new URL(path, scope), init), respondWith: value => { p = value; }}); return p; }
  };
}
const w = worker();
// Simulate an interrupted rollout, preserving an already usable older release.
w.stores.set('curso-surtos-v21-validacao-gp-20261026', new Map([['old',new Response('old course')]]));
w.httpError = 'manual.pdf';
await assert.rejects(w.event('install')); assertions++;
ok(!(await w.message('COURSE_OFFLINE_STATUS')).ready, 'Missing PDF cannot report ready');
ok(w.stores.has('curso-surtos-v21-validacao-gp-20261026'), 'Previous release preserved');
eq(w.skipped, 0, 'No forced replacement during assessment');
w.httpError = '';
const beforeRetry = w.calls.length;
ok((await w.message('COURSE_OFFLINE_PREPARE')).ready, 'Retry completes package');
ok(w.calls.length - beforeRetry < core.length, 'Retry reuses verified partial download');
await w.event('activate'); eq(w.claimed, 1, 'Claims only after installation');
eq(await w.message('COURSE_OFFLINE_PREPARE', 'https://example.test/other/'), undefined, 'Other pages cannot prepare this course');
w.offline = true;
const networkCount = w.calls.length;
for (const file of core) {
  const response = await w.fetch(file.path);
  eq(response.status, 200, 'Offline: ' + file.path);
  eq(Buffer.from(await response.arrayBuffer()), content.get(file.path), 'Original bytes offline: ' + file.path);
}
eq(w.calls.length, networkCount, 'Complete course requires no network');
for (const path of ['./', 'index.html?anything=1', 'modulo3.html?topic=6', 'modulo1.html?avaliacao=retomar']) {
  eq((await w.fetch(path)).status, 200, 'Queries retain original page identity');
}
for (const path of ['not-a-course-page.html','/academia-digital-ins/index.html','https://api.example.test/course']) {
  eq(await w.fetch(path), undefined, 'Unrelated traffic is not replaced with the home page');
}
eq(await w.fetch('index.html', {method:'POST'}), undefined, 'Never cache writes');
const pdf = content.get('manual.pdf');
for (const [range, start, end] of [['bytes=0-1023',0,1023],['bytes=1024-',1024,pdf.length-1],['bytes=-512',pdf.length-512,pdf.length-1],['bytes=0-99999999',0,pdf.length-1]]) {
  const r = await w.fetch('manual.pdf', {headers:{Range:range}});
  eq(r.status, 206, 'PDF range ' + range);
  eq(r.headers.get('content-range'), 'bytes '+start+'-'+end+'/'+pdf.length);
  eq(Buffer.from(await r.arrayBuffer()), pdf.subarray(start,end+1));
}
for (const range of ['bytes=99999999-','bytes=10-1','bytes=-0']) eq((await w.fetch('manual.pdf',{headers:{Range:range}})).status,416);
for (const range of ['nonsense','bytes=0-1,4-5']) eq((await w.fetch('manual.pdf',{headers:{Range:range}})).status,200);
eq((await w.fetch('manual.pdf',{headers:{Range:'bytes=0-1','If-Range':'not-this-version'}})).status,200);
eq((await w.fetch('manual.pdf',{method:'HEAD'})).body,null,'HEAD has no body');
// Eviction must remove the ready claim and expose a recoverable failure.
const releaseStore = [...w.stores.values()].find(s => [...s.keys()].some(k => k.endsWith('__offline_complete__')));
releaseStore.delete(scope+'manual.pdf');
ok(!(await w.message('COURSE_OFFLINE_STATUS')).ready, 'Evicted file invalidates readiness');
eq((await w.fetch('manual.pdf')).status,503,'Missing offline PDF has a truthful error');
ok(!(await w.message('COURSE_OFFLINE_PREPARE')).ok,'Offline retry does not claim success');
w.offline = false; ok((await w.message('COURSE_OFFLINE_PREPARE')).ready,'Repair after reconnect');
const corrupt = worker(); corrupt.bad = 'formacao-dados.js';
await assert.rejects(corrupt.event('install')); assertions++;
ok(!(await corrupt.message('COURSE_OFFLINE_STATUS')).ready,'200 response from wrong release rejected');
corrupt.bad = ''; ok((await corrupt.message('COURSE_OFFLINE_PREPARE')).ready,'Retry of integrity failure');
const full = worker(); full.quota = true;
await assert.rejects(full.event('install')); assertions++;
full.quota = false; ok(!(await full.message('COURSE_OFFLINE_STATUS')).ready,'Quota failure not ready');
ok((await full.message('COURSE_OFFLINE_PREPARE')).ready,'Retry after storage failure');
// The offline guard changes only network waiting, not credentials or local state.
const access = await readFile('curso-acesso.js', 'utf8');
const requestBody = access.slice(access.indexOf('async function request('), access.indexOf('// Keep frequent local saves'));
let apiCalls = 0;
const requestEnv = vm.createContext({root:{navigator:{onLine:false}}, AbortController, setTimeout, clearTimeout,
  endpoint:'https://api.example.test/course', fetch:async (_url, init) => {
    apiCalls++; eq(init.headers['x-curso-chave'],'private-test-key','Existing credential header preserved');
    return new Response('{"ok":true}',{headers:{'Content-Type':'application/json'}});
  }});
vm.runInContext(requestBody,requestEnv);
await assert.rejects(vm.runInContext("request('read','private-test-key')",requestEnv)); assertions++;
eq(apiCalls,0,'Offline visit never waits on API');
requestEnv.root.navigator.onLine=true;
ok((await vm.runInContext("request('read','private-test-key')",requestEnv)).ok,'Online request unchanged');
eq(apiCalls,1,'Normal API call after reconnect');
console.log(assertions+' offline assertions passed; '+core.length+' files; approved course bytes preserved.');
