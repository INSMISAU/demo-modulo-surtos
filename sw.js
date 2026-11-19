/* Each release is downloaded and verified before it can replace the previous one. */
const RELEASE = 'v22-offline-20261118';
const CONTENT_ID = /* OFFLINE_ID_START */ "d50cbf5889d30139" /* OFFLINE_ID_END */;
const SCOPE = new URL('./', self.location.href);
const CACHE_NAME = 'curso-surtos-' + encodeURIComponent(SCOPE.pathname) + '-' + RELEASE + '-' + CONTENT_ID;
const COMPLETE_URL = new URL('__offline_complete__', SCOPE).href;
// Generated from the actual files by scripts/build-offline.mjs.
const CORE = /* OFFLINE_FILES_START */ [
  {
    "path": "271bad1e-854b-4f1e-b68a-d84c0b58180c.js",
    "bytes": 218610,
    "sha256": "fbde52aab1700a3b308087ae78b41fb5192e7a952d81d5d08238763ce3245dd8"
  },
  {
    "path": "curso-acesso.js",
    "bytes": 22778,
    "sha256": "7487a56ef7f4740c533d6b3e558df14ebf6f104d0a4e2dc746ea3a31516a216d"
  },
  {
    "path": "curso.js",
    "bytes": 9675,
    "sha256": "999796ed3e7c3f9840efe20c8d8abfaffbeb448887cc9b7eb40b5a489b0a8369"
  },
  {
    "path": "curva-epidemiologica.svg",
    "bytes": 31678,
    "sha256": "f8b2fa2276b5d4dd6a20994689aaef6d439f7f109ecfddc168b1686e43a85669"
  },
  {
    "path": "formacao-config.js",
    "bytes": 263,
    "sha256": "bbe69435576c35b601af9a114b75bca6ae738b09ba09c2b0b89d0f77bae45951"
  },
  {
    "path": "formacao-dados.js",
    "bytes": 126230,
    "sha256": "b9cd0ec1edca72370fb24616dae75e42e6255283b39441eade3c2c7c1b58d485"
  },
  {
    "path": "formacao-leitura.js",
    "bytes": 5047,
    "sha256": "0e0690368ce96d71da8a2388ba0b77728156b745b199435ba98d4efad4174312"
  },
  {
    "path": "formacao.css",
    "bytes": 42294,
    "sha256": "18e0692bb3d3e00f6718b7d7a00f9e9aa91ab66ac530c047fcfe55e33baf36b9"
  },
  {
    "path": "formacao.js",
    "bytes": 36992,
    "sha256": "d2ced98a3b386e1aa70dfc9dcec9296df3fc5e2a593bcec6b6ae3aa86b0eaf7e"
  },
  {
    "path": "i192.png",
    "bytes": 2307,
    "sha256": "48c856f0fc98da0ba7f4c49cad884d1a0055220b651a521af0afa62655bc1d78"
  },
  {
    "path": "i512.png",
    "bytes": 6417,
    "sha256": "0201fa2fdd0e7428b417361b936b4cb99c37d8850d1b02928df45385b6fd7690"
  },
  {
    "path": "image1.png",
    "bytes": 497603,
    "sha256": "1863e76a31c505c4dd991811754ab3e6a6a738195421538387fbf44c6e9dcb94"
  },
  {
    "path": "image2.png",
    "bytes": 185543,
    "sha256": "e9f033f7ce13a47b2813a8d3989584487f64656c461aa86c6ca32b7c59378e0f"
  },
  {
    "path": "image3.png",
    "bytes": 111804,
    "sha256": "dd0b25f5d99863cdae88bf31a41411e0fcf8ff521cfd67f2c04eda72e61c2a3e"
  },
  {
    "path": "image4.png",
    "bytes": 85132,
    "sha256": "5b004b60ff93e1db38767b086a5bb89e63a24eafce9d416b248dcc8f266b5fbd"
  },
  {
    "path": "image5.png",
    "bytes": 380863,
    "sha256": "2c9e96f6ae63ddd24e5da522a4cf6bfc45079830e9d3ec364e94e3afac4e3bb4"
  },
  {
    "path": "image6.png",
    "bytes": 31555,
    "sha256": "a20a6025d8c619ce51d3bdd9037aae0e7186e724647cd800cb46d4605e30e117"
  },
  {
    "path": "image7.png",
    "bytes": 43097,
    "sha256": "5b1971eaeb88deb1c61ae7d81baa344fe4923150d426e0ea218b271d70f7fa1e"
  },
  {
    "path": "image8.png",
    "bytes": 25213,
    "sha256": "c2a53a06378c2fa76a06194ace68d468d2f3f61b661200fffb38db5098d58778"
  },
  {
    "path": "index.html",
    "bytes": 1828,
    "sha256": "90c703dc95439de675d5a0d8ebf7c2188e2febb6f5e149700fbd49baecfc8649"
  },
  {
    "path": "ins-fluxo-trabalho-campo.png",
    "bytes": 970459,
    "sha256": "9f4e4f12a25e173812a2c9eb9b14186a87762103a2941cdb7bdbb9d0658134f5"
  },
  {
    "path": "ins-preparacao-investigacao.png",
    "bytes": 71646,
    "sha256": "7f214ddf0f2de5fce9844fbb58092ed0def7c7df272471ebac87bb3ac050ee0f"
  },
  {
    "path": "logo_ins.png",
    "bytes": 46491,
    "sha256": "f89b9cd067a7030a574a14956bb1f32ae62f942d90a061e54e8a14eb35f6cb45"
  },
  {
    "path": "manifest.json",
    "bytes": 599,
    "sha256": "1ad898d3d7ca57f66f69e541b323d25a2e3227cb1ddb876f01431e617d4c2ef4"
  },
  {
    "path": "manual.pdf",
    "bytes": 5473577,
    "sha256": "d45ea5d83a6b8a15776122ded11a82404923ff0a7c8784a6b891596a737730bd"
  },
  {
    "path": "modulo1.html",
    "bytes": 1227,
    "sha256": "bd3746e9074b42d12ac8f87701e8a58386a26d05c5336c8ebb01d5f31b4f699f"
  },
  {
    "path": "modulo2.html",
    "bytes": 1227,
    "sha256": "f285c14c8f3694e0fad317dd6675cf9d278d34d999fa6de59fbb83fda2d43f77"
  },
  {
    "path": "modulo3.html",
    "bytes": 1227,
    "sha256": "30b32f927f481f146389fe5a5a84c20eba47a3a2734f5b2656cc6c48a19f87f2"
  },
  {
    "path": "modulo4.html",
    "bytes": 330,
    "sha256": "c04217bf251dc901422811cf060233112f2aaf48b5b3e4958490267323567c8d"
  },
  {
    "path": "modulo5.html",
    "bytes": 330,
    "sha256": "4e7047c312cd3e58e68d332b1a0a9f3aaedabad0ea56e94216e818208a874a59"
  },
  {
    "path": "modulo6.html",
    "bytes": 330,
    "sha256": "81154d78f39bd260fee18e93769721985a2f1bf9be40ab7e245309b263df8e79"
  },
  {
    "path": "modulo7.html",
    "bytes": 332,
    "sha256": "83f646c142aaf237b7b5504a2084ab50b761148f4a7bf97cbb7f290ef60f1cd4"
  },
  {
    "path": "offline.js",
    "bytes": 4729,
    "sha256": "aa7aaa88b5f0f70105680f68060d633c8cbe9c55d178d31219fd2ef767f31479"
  },
  {
    "path": "percurso.html",
    "bytes": 1480,
    "sha256": "4666a64919aa7acab1c22fb5fd5234316b6142f9a32e3ba5a0007cf9f19cb581"
  }
] /* OFFLINE_FILES_END */;
const FILES = new Map(CORE.map(file => [new URL(file.path, SCOPE).href, file]));
let preparing = null;

function canonical(url) {
  const u = new URL(url);
  u.search = ''; u.hash = '';
  if (u.href === SCOPE.href) return new URL('index.html', SCOPE).href;
  return u.href;
}
async function status() {
  const cache = await caches.open(CACHE_NAME);
  const marker = await cache.match(COMPLETE_URL);
  let completed = 0;
  for (const file of CORE) {
    const response = await cache.match(new URL(file.path, SCOPE).href);
    if (response && response.status === 200) completed++;
  }
  return {version: RELEASE, ready: !!marker && completed === CORE.length,
    completed, total: CORE.length, bytes: CORE.reduce((sum, file) => sum + file.bytes, 0)};
}
async function broadcast(message) {
  const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  for (const client of clients) {
    if (client.url.startsWith(SCOPE.href)) client.postMessage(message);
  }
}
async function verifiedFetch(file) {
  const url = new URL(file.path, SCOPE).href;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 45000);
  try {
    const response = await fetch(new Request(url, {cache: 'reload', credentials: 'same-origin', signal: abort.signal}));
    if (response.status !== 200 || response.redirected) throw new Error('Download failed: ' + file.path);
    const body = await response.clone().arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (body.byteLength !== file.bytes || hash !== file.sha256) throw new Error('Release mismatch: ' + file.path);
    return response;
  } finally { clearTimeout(timeout); }
}
function prepare() {
  if (preparing) return preparing;
  preparing = (async () => {
    const cache = await caches.open(CACHE_NAME);
    if ((await status()).ready) return status();
    await cache.delete(COMPLETE_URL);
    let completed = 0;
    // A failed file never creates a ready marker. Successfully verified files
    // remain available for retry, without touching an older release or progress.
    for (const file of CORE) {
      const url = new URL(file.path, SCOPE).href;
      const cached = await cache.match(url);
      if (!cached || cached.status !== 200) await cache.put(url, await verifiedFetch(file));
      completed++;
      await broadcast({type: 'COURSE_OFFLINE_PROGRESS', completed, total: CORE.length, version: RELEASE});
    }
    await cache.put(COMPLETE_URL, new Response(JSON.stringify({version: RELEASE}), {
      headers: {'Content-Type': 'application/json'}
    }));
    const result = await status();
    if (!result.ready) throw new Error('Incomplete offline package');
    return result;
  })().finally(() => { preparing = null; });
  return preparing;
}
self.addEventListener('install', event => {
  // No skipWaiting: an open assessment keeps its existing worker and release.
  event.waitUntil(prepare());
});
self.addEventListener('activate', event => {
  // Leave older caches alone: an old tab may still need its own release.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (!event.source || !event.source.url || !event.source.url.startsWith(SCOPE.href)) return;
  if (!event.data || !['COURSE_OFFLINE_STATUS', 'COURSE_OFFLINE_PREPARE'].includes(event.data.type)) return;
  const port = event.ports && event.ports[0];
  event.waitUntil((async () => {
    try {
      const result = await (event.data.type === 'COURSE_OFFLINE_PREPARE' ? prepare() : status());
      if (port) port.postMessage({ok: true, ...result});
    } catch (_) { if (port) port.postMessage({ok: false}); }
  })());
});
async function ranged(request, response) {
  const range = request.headers.get('range');
  if (!range || request.headers.has('if-range')) return response;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  // Ignoring malformed or multiple ranges and returning the full 200 is valid.
  if (!match || (!match[1] && !match[2])) return response;
  const body = await response.arrayBuffer(), size = body.byteLength;
  let start, end;
  if (!match[1]) { start = Math.max(0, size - Number(match[2])); end = size - 1; }
  else { start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1; }
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding'); headers.delete('Content-Length');
  headers.set('Accept-Ranges', 'bytes');
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start || match[2] === '0' && !match[1]) {
    headers.set('Content-Range', 'bytes */' + size);
    return new Response(null, {status: 416, headers});
  }
  end = Math.min(end, size - 1);
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), {status: 206, headers});
}
async function resource(request, file) {
  const cache = await caches.open(CACHE_NAME), url = new URL(file.path, SCOPE).href;
  let response = await cache.match(url);
  if (!response) {
    try { response = await verifiedFetch(file); await cache.put(url, response.clone()); }
    catch (_) {
      return new Response('Este recurso ainda não está guardado. Volte ao curso com ligação e conclua a preparação para utilizar sem internet.', {
        status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}
      });
    }
  }
  if (request.method === 'HEAD') return new Response(null, {status: response.status, headers: response.headers});
  return ranged(request, response);
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (!['GET', 'HEAD'].includes(request.method)) return;
  const file = FILES.get(canonical(request.url));
  // No API, credentials, unrelated pages or other origins enter the course cache.
  if (file) event.respondWith(resource(request, file));
});
