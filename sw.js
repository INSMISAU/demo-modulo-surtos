/* Service Worker — Curso de Investigação de Surtos (INS)
   Mostra sempre a versão mais recente com internet e funciona offline.
   Subir CACHE_VERSION quando publicar alterações (v1 -> v2). */
const CACHE_VERSION = "curso-surtos-v1";
const CORE = [
  "./","./index.html","./pretest.html","./apresentacao.html","./certificado.html",
  "./modulo1.html","./modulo2.html","./modulo3.html","./modulo4.html",
  "./modulo5.html","./modulo6.html","./modulo7.html",
  "./curso.js","./logo_ins.png","./cover.jpg",
  "./fig2.png","./fig3.png","./fig6.png","./fig-chitima.png",
  "./i192.png","./i512.png","./manifest.json"
];
const STATIC_RX = /\.(css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|pdf)$/i;
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_VERSION).then((c)=>Promise.allSettled(CORE.map((u)=>c.add(u)))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE_VERSION).map((k)=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",(e)=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==self.location.origin) return;
  const isPage=req.mode==="navigate"||url.pathname.endsWith(".html")||url.pathname.endsWith("/");
  if(isPage){
    e.respondWith(fetch(req).then((res)=>{if(res&&res.status===200){const c=res.clone();caches.open(CACHE_VERSION).then((k)=>k.put(req,c));}return res;}).catch(()=>caches.match(req).then((cached)=>cached||caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((cached)=>{
    const network=fetch(req).then((res)=>{if(res&&res.status===200){const c=res.clone();caches.open(CACHE_VERSION).then((k)=>k.put(req,c));}return res;}).catch(()=>null);
    return cached||network;
  }));
});
