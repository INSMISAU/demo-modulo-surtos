(function(){
'use strict';
if(new URLSearchParams(location.search).get('testadores')!=='1')return;
window.INSValidation=true;
var hub='https://insmisau.github.io/academia-digital-ins/?testadores=1&administracao=1',api='https://ins-academia-digital.perciliamuianga.chatgpt.site/api/testers/session';
var key='ins-platform-validation-session-v1',project='https://watlfdjcgfxmzymztmvc.supabase.co',publicKey='sb_publishable_ZxGOBZcm1IGp36e7Qh2nyg_S8Tb56B4';
var labels={publico:'Público / participante',editor:'Editor',revisor:'Revisor',publicador:'Publicador',admin:'Administrador'};
function saved(){try{var s=JSON.parse(localStorage.getItem(key)||'null');return s&&s.expires>Date.now()?s:null;}catch(e){return null;}}
async function central(body){var s=saved();if(!s){location.replace(hub);throw Error('Entre na validação.');}var r=await fetch(api,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+s.session,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});var d=await r.json();if(!r.ok)throw Error(d.error||'Acesso indisponível.');return d;}
async function bridge(action){var s=saved();if(!s){location.replace(hub);throw Error('Entre na validação.');}var r=await fetch(project+'/functions/v1/platform-acesso',{method:'POST',headers:{Authorization:'Bearer '+s.session,apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({action:action||'session'})});var d=await r.json();if(!r.ok)throw Error(d.error||'Acesso indisponível.');return d;}
var isCMS=/\/cms\.html$/.test(location.pathname),client=null;
if(isCMS&&window.supabase){
 var original=window.supabase.createClient;
 var validationFactory=function(){
  var sb=original(project,publicKey,{auth:{storageKey:'ins-manual-validation-auth',persistSession:false,autoRefreshToken:false}});client=sb;
  var get=sb.auth.getSession.bind(sb.auth);
  sb.auth.getSession=async function(){try{var info=await bridge();await sb.auth.setSession(info.session);return await get();}catch(e){var el=document.getElementById('loginErr');if(el){el.textContent=e.message;el.classList.remove('hide');}return {data:{session:null},error:e};}};
  sb.auth.signInWithPassword=async function(){return {data:{user:null},error:{message:'Entre pelo acesso único de validação na Academia.'}};};
  sb.auth.signOut=async function(){location.assign(hub+'#plataformas');return {error:null};};return sb;
 };window.supabase=Object.assign({},window.supabase,{createClient:validationFactory});
 window.addEventListener('DOMContentLoaded',function(){
  window.publicarFicheiros=async function(files,n,withData){try{
   var s=saved();if(!s)throw Error('Sessão expirada.');window.toast('A publicar a versão de validação…');
   var r=await fetch(project+'/functions/v1/platform-publicar',{method:'POST',headers:{Authorization:'Bearer '+s.session,apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({files:files})});var d=await r.json();if(!r.ok)throw Error(d.error||'Publicação não concluída.');
   var el=document.getElementById('content');el.textContent='';var card=document.createElement('div');card.className='card';var title=document.createElement('h1');title.textContent='Publicação de validação concluída';var p=document.createElement('p');p.textContent=n+' doenças · '+new Date().toLocaleDateString('pt-PT');var a=document.createElement('a');a.href=d.url;a.textContent='Ver versão publicada';a.className='btn-g';var back=document.createElement('button');back.textContent='Voltar ao gestor';back.className='btn-o';back.onclick=function(){window.render();};card.append(title,p,a,back);el.append(card);window.toast('Publicação concluída.');
  }catch(e){window.toast(e.message);}};
 });
}
window.addEventListener('DOMContentLoaded',async function(){
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;try{var u=new URL(a.href,location.href);if(u.origin!==location.origin)return;if(u.pathname.indexOf('/academia-digital-ins/')===0){a.href=hub+'#'+(/demo-modulo-surtos/.test(location.pathname)?'catalogo':'biblioteca');return;}if(/^\/(manual-surtos|demo-modulo-surtos)\//.test(u.pathname)&&(/\.html$/.test(u.pathname)||u.pathname.endsWith('/'))){u.searchParams.set('testadores','1');if(/\/cms\.html$/.test(u.pathname))u.searchParams.delete('validacao');a.href=u.href;}}catch(err){}},true);
 try{
  var info=await central();if(info.role==='publico')hub=hub.replace('&administracao=1','');var bar=document.createElement('aside');bar.setAttribute('aria-label','Validação das plataformas');bar.style.cssText='position:relative;z-index:1000;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:#f0f6f7;color:#294f60;font:14px Arial;border-bottom:1px solid #c8dce0';
  var name=document.createElement('strong');name.textContent=info.name;var label=document.createElement('label');label.textContent='Testar como ';var select=document.createElement('select');select.style.cssText='width:auto;padding:6px;border-radius:6px';
  Object.keys(labels).forEach(function(role){var opt=document.createElement('option');opt.value=role;opt.textContent=labels[role];select.append(opt);});select.value=info.role;label.append(select);
  select.onchange=async function(){select.disabled=true;try{var d=await central({action:'switch',role:select.value});var s=saved();localStorage.setItem(key,JSON.stringify(Object.assign({},s,{role:d.role})));location.reload();}catch(e){alert(e.message);select.disabled=false;}};
  bar.append(name,label);
  [['Academia',hub+'#'+(info.role==='publico'?'inicio':'plataformas')],['Curso Básico','https://insmisau.github.io/demo-modulo-surtos/?testadores=1'],['e-book','https://insmisau.github.io/manual-surtos/?testadores=1']].forEach(function(v){var a=document.createElement('a');a.href=v[1];a.textContent=v[0];a.style.cssText='color:#0f5b78;padding:5px';bar.append(a);});
  if(!isCMS&&info.role!=='publico'){var manage=document.createElement('a');manage.textContent='Gerir conteúdos';manage.href=/demo-modulo-surtos/.test(location.pathname)?hub+'#curso-basico-editor':'https://insmisau.github.io/manual-surtos/cms.html?testadores=1&administracao=1';bar.append(manage);}
  bar.id='ins-platform-tester-bar';document.body.prepend(bar);
  new MutationObserver(function(){if(!bar.isConnected)document.body.prepend(bar);}).observe(document.body,{childList:true});
 }catch(e){if(saved()){var p=document.createElement('p');p.setAttribute('role','alert');p.textContent=e.message;document.body.prepend(p);}else location.replace(hub);}
});
})();
