(function(root){
'use strict';
var clone=function(x){return x==null?x:JSON.parse(JSON.stringify(x));};
function serial(value){return JSON.stringify(value==null?null:value,function(_key,v){if(v&&typeof v==='object'&&!Array.isArray(v)){var sorted=Object.create(null);Object.keys(v).sort().forEach(function(k){sorted[k]=v[k];});return sorted;}return v;});}
var same=function(a,b){return serial(a)===serial(b);};
function unique(items,key){var out=[],seen=new Set();(items||[]).forEach(function(x){if(x==null)return;var k=key?key(x):serial(x);if(!seen.has(k)){seen.add(k);out.push(clone(x));}});return out;}
function attemptKey(a){return a.id||[a.started,a.at,a.percent].join('|');}
function draftKey(d){return d&&(d.id||d.started||JSON.stringify(d.order||d.questions));}
function choose(local,remote,base){return same(local,base)?clone(remote):clone(local);}
function mergeDraft(local,remote,base,completed,alternatives){
 var candidates=[],preferred=choose(local,remote,base);
 if(local&&remote&&draftKey(local)===draftKey(remote)&&!same(local,remote)){
  var la=local.answers||{},ra=remote.answers||{},ba=base&&draftKey(base)===draftKey(local)?base.answers||{}:{};
  var answers={},conflict=false;
  unique(Object.keys(la).concat(Object.keys(ra))).forEach(function(k){
   if(!same(la[k],ba[k])&&!same(ra[k],ba[k])&&!same(la[k],ra[k]))conflict=true;
   var val=choose(la[k],ra[k],ba[k]);if(val!==undefined)answers[k]=val;
  });
  if(!conflict){preferred=choose(local,remote,base)||clone(local);preferred.answers=answers;candidates=[preferred];}
  else candidates=[preferred,remote,local];
 }else candidates=[preferred,local,remote];
 candidates=unique(candidates.concat(alternatives||[])).filter(function(d){return !completed.some(function(a){return (a.id&&a.id===d.id)||(a.started&&a.started===d.started);});});
 return {draft:candidates[0]||null,alternatives:candidates.slice(1)};
}
function mergeStudy(a,b){
 var out={};Object.keys(Object.assign({},a,b)).forEach(function(topic){
  var x=(a||{})[topic]||{},y=(b||{})[topic]||{},n={seen:{},sessions:{}};
  Object.keys(Object.assign({},x.seen,y.seen)).forEach(function(k){n.seen[k]=((x.seen||{})[k]||0)|((y.seen||{})[k]||0);});
  Object.keys(Object.assign({},x.sessions,y.sessions)).forEach(function(k){n.sessions[k]=Math.max(Number((x.sessions||{})[k])||0,Number((y.sessions||{})[k])||0);});
  out[topic]=n;
 });return out;
}
function mergeSchedule(local,remote,base){
 // Keep the first recorded start, including after offline changes or an old client.
 var values=[local,remote,base].filter(function(s){return s&&typeof s.startedAt==='string'&&isFinite(Date.parse(s.startedAt))&&Number.isInteger(s.days)&&s.days>0&&s.days<=3660;});
 values.sort(function(a,b){return Date.parse(a.startedAt)-Date.parse(b.startedAt)||a.days-b.days;});
 if(!values.length)return null;
 return {startedAt:new Date(Date.parse(values[0].startedAt)).toISOString(),days:values[0].days};
}
function merge(local,remote,base){
 local=clone(local);remote=clone(remote);base=base||{};
 var result=clone(remote),lc=local.course||{},rc=remote.course||{},bc=base.course||{};
 result.profile={};unique(Object.keys(local.profile||{}).concat(Object.keys(remote.profile||{}))).forEach(function(k){result.profile[k]=choose((local.profile||{})[k],(remote.profile||{})[k],(base.profile||{})[k]);});
 result.course=clone(rc);result.course.modules={};var schedule=mergeSchedule(lc.schedule,rc.schedule,bc.schedule);if(schedule)result.course.schedule=schedule;else delete result.course.schedule;result.course.last=choose(lc.last,rc.last,bc.last);result.course.resume=choose(lc.resume,rc.resume,bc.resume);
 unique(Object.keys(lc.modules||{}).concat(Object.keys(rc.modules||{}))).forEach(function(id){
  var l=(lc.modules||{})[id]||{},r=(rc.modules||{})[id]||{},b=(bc.modules||{})[id]||{},s=Object.assign({},r,l);
  s.study=mergeStudy(l.study,r.study);
  s.read=unique((r.read||[]).concat(l.read||[])).sort(function(a,b){return a-b;});
  s.attempts=unique((r.attempts||[]).concat(l.attempts||[]),attemptKey).sort(function(a,b){return String(a.at).localeCompare(String(b.at));});
  var scores=[l.best,r.best].concat(s.attempts.map(function(a){return a.percent;})).filter(function(x){return typeof x==='number'&&isFinite(x);});s.best=scores.length?Math.max.apply(null,scores):null;
  s.topic=choose(l.topic,r.topic,b.topic)||0;s.scroll=choose(l.scroll,r.scroll,b.scroll)||0;
  s.archivedDrafts=unique((r.archivedDrafts||[]).concat(l.archivedDrafts||[]));
  var d=mergeDraft(l.draft,r.draft,b.draft,s.attempts,(l.otherDrafts||[]).concat(r.otherDrafts||[]));s.draft=d.draft;s.otherDrafts=d.alternatives;
  result.course.modules[id]=s;
 });
 result.pretestHistory=unique((remote.pretestHistory||[]).concat(local.pretestHistory||[]),attemptKey);
 var pd=mergeDraft(local.pretest,remote.pretest,base.pretest,result.pretestHistory,(local.pretestAlternatives||[]).concat(remote.pretestAlternatives||[]));
 result.pretest=pd.draft;result.pretestAlternatives=pd.alternatives;
 return result;
}
var API={merge:merge,mergeDraft:mergeDraft,mergeSchedule:mergeSchedule};root.INSCursoAcesso=API;
if(typeof module==='object'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
var folder=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1),cycle='testes-ins-20261016',prefix='ins-sync:'+cycle+':'+folder;
var courseKey='ins-course-v3:'+cycle+':'+folder,preKey='ins-pretest-v1:'+cycle+':'+folder;
var endpoint='https://watlfdjcgfxmzymztmvc.supabase.co/functions/v1/curso-percurso';
var activeKey='',meta=null,busy=null,timer=null,timerDue=0,retryAt=0,failures=0,status='',onlineReady=false,mountReady=false,applying=false;
var SYNC_INTERVAL=30000;
function read(k,fallback){try{var v=localStorage.getItem(k);return v?JSON.parse(v):clone(fallback);}catch(_){return clone(fallback);}}
function get(k){try{return localStorage.getItem(k)||'';}catch(_){return '';}}
function uuid(){if(root.crypto.randomUUID)return root.crypto.randomUUID();var a=new Uint8Array(16);root.crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;return Array.from(a,function(x,i){return ([4,6,8,10].indexOf(i)>=0?'-':'')+x.toString(16).padStart(2,'0');}).join('');}
function snapshot(skipFlush){
 if(!skipFlush)root.dispatchEvent(new CustomEvent('curso:guardar-leitura'));
 var participant=get(prefix+':id');if(!participant){participant=uuid();localStorage.setItem(prefix+':id',participant);}
 return {schema:1,participant:participant,profile:read(prefix+':profile',{}),course:read(courseKey,{version:'2026-10-15-final-ins',modules:{},last:null}),pretest:read(preKey,null),pretestHistory:read(prefix+':pretest-history',[]),pretestAlternatives:read(prefix+':pretest-alternatives',[])};
}
function remember(data){meta={revision:data.revision,base:clone(data.state),updated:data.updated};localStorage.setItem(prefix+':cloud-meta',JSON.stringify(meta));}
function apply(s,notify){
 applying=true;
 try{
  localStorage.setItem(courseKey,JSON.stringify(s.course));localStorage.setItem(prefix+':profile',JSON.stringify(s.profile));localStorage.setItem(prefix+':id',s.participant);
  if(s.pretest)localStorage.setItem(preKey,JSON.stringify(s.pretest));else localStorage.removeItem(preKey);
  localStorage.setItem(prefix+':pretest-history',JSON.stringify(s.pretestHistory||[]));localStorage.setItem(prefix+':pretest-alternatives',JSON.stringify(s.pretestAlternatives||[]));
  if(notify)root.dispatchEvent(new CustomEvent('curso:percurso-recuperado',{detail:clone(s)}));
 }finally{applying=false;}
}
function setStatus(text){status=text;var el=document.getElementById('curso-cloud-status');if(el)el.textContent=text;}
function keyIsCurrent(){return get(prefix+':cloud-key')===activeKey;}
async function request(action,key,data){
 var abort=new AbortController(),timeout=setTimeout(function(){abort.abort();},12000);
 try{
  var res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-curso-chave':key},body:JSON.stringify(Object.assign({action:action},data||{})),signal:abort.signal,cache:'no-store'});
  var body=await res.json();if(!res.ok&&res.status!==409){var err=new Error(body.error||'Não foi possível sincronizar.');err.status=res.status;throw err;}
  return body;
 }finally{clearTimeout(timeout);}
}
// Keep frequent local saves; send time/reading details in bounded batches.
function scheduleSync(delay){
 if(!activeKey||!keyIsCurrent())return;
 var due=Math.max(Date.now()+delay,retryAt);
 if(timer!==null&&timerDue<=due)return;
 clearTimeout(timer);timerDue=due;
 timer=setTimeout(function(){timer=null;timerDue=0;synchronise({background:true});},Math.max(0,due-Date.now()));
}
function milestones(s){
 var c=clone(s);Object.keys(c.course.modules||{}).forEach(function(id){delete c.course.modules[id].study;delete c.course.modules[id].scroll;});
 return serial(c);
}
async function synchronise(options){
 clearTimeout(timer);timer=null;timerDue=0;
 if(!activeKey||!keyIsCurrent())return false;if(busy)return busy;
 var background=!!(options&&options.background===true),key=activeKey;
 var currentAccess=function(){return key===activeKey&&keyIsCurrent();};
 busy=(async function(){
  await Promise.resolve();
  try{
   var local=snapshot(),dirty=!meta||!same(local,meta.base);
   if(background&&!dirty){onlineReady=true;setStatus('Percurso guardado. Pode continuar noutro dispositivo com a sua chave pessoal.');return true;}
   setStatus('A guardar e recuperar o percurso…');
   // A known revision can be written directly. The server returns its current
   // state on a conflict, so no initial full read is needed before every save.
   if(!meta||!dirty){
    var current=await request('read',key);if(!currentAccess())return false;
    local=snapshot();var merged=merge(local,current.state,meta&&meta.base||current.state);
    if(!same(merged,local))apply(merged,true);remember(current);
   }
   for(var i=0;i<4;i++){
    var next=snapshot();if(same(next,meta.base))break;
    var res=await request('write',key,{revision:meta.revision,state:clone(next)});
    if(!currentAccess())return false;
    if(res.conflict){var combined=merge(snapshot(),res.state,meta.base);apply(combined,true);remember(res);continue;}
    remember(res);if(background)break;
   }
   failures=0;retryAt=0;
   var pending=!same(snapshot(),meta.base);onlineReady=!pending;
   setStatus(pending?'Alterações guardadas neste aparelho; envio automático pendente. Use «Sincronizar agora» antes de mudar de aparelho.':'Percurso guardado. Pode continuar noutro dispositivo com a sua chave pessoal.');
   if(pending)scheduleSync(SYNC_INTERVAL);
   return !pending;
  }catch(e){
   onlineReady=false;
   if(!currentAccess())return false;
   setStatus(e.status===401?'A chave não foi reconhecida. O percurso neste aparelho foi conservado.':'Sem confirmação de envio. O percurso está guardado neste aparelho; o envio será repetido quando houver ligação.');
   if(e.status!==401){failures++;retryAt=Date.now()+Math.min(300000,SYNC_INTERVAL*Math.pow(2,Math.min(failures-1,4)));scheduleSync(SYNC_INTERVAL);}
   return false;
  }finally{busy=null;}
 })();return busy;
}
function changed(){
 if(applying||!activeKey||!keyIsCurrent())return;
 onlineReady=false;setStatus('Alterações guardadas neste aparelho; envio automático pendente.');
 var urgent=!meta||milestones(snapshot(true))!==milestones(meta.base);
 scheduleSync(urgent?1200:SYNC_INTERVAL);
}
function backup(){var entries={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(':backup-')>=0||/:cloud-key$|:pending-cloud-key$/.test(k))continue;if(k===courseKey||k===preKey||k.indexOf(prefix+':')===0)entries[k]=localStorage.getItem(k);}localStorage.setItem(prefix+':backup-before-login:'+new Date().toISOString(),JSON.stringify(entries));}
function newKey(){var b=new Uint8Array(32);root.crypto.getRandomValues(b);return 'INS1-'+btoa(String.fromCharCode.apply(null,b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function activate(){
 var button=document.getElementById('curso-access-create');button.disabled=true;
 try{
  backup();var key=get(prefix+':pending-cloud-key')||newKey();localStorage.setItem(prefix+':pending-cloud-key',key);
  var s=snapshot(),res=await request('create',key,{state:s,protocol:2});
  var before=snapshot(),oldParticipant=before.participant;
  if(res.state.participant!==oldParticipant){
   before.participant=res.state.participant;
   apply(before,false);
   localStorage.setItem(prefix+':cloud-key',key);activeKey=key;
   var detail=clone(before);detail.migratedFrom=oldParticipant;
   root.dispatchEvent(new CustomEvent('curso:acesso-activado',{detail:detail}));
  }else{localStorage.setItem(prefix+':cloud-key',key);activeKey=key;root.dispatchEvent(new CustomEvent('curso:acesso-activado',{detail:clone(before)}));}
  remember(res);localStorage.removeItem(prefix+':pending-cloud-key');
  if(!same(snapshot(),res.state))await synchronise();else setStatus('Acesso criado e percurso guardado. Guarde agora a sua chave pessoal.');
  refresh();showKey();
 }catch(e){setStatus(e.message||'Não foi possível activar o acesso. O percurso local está conservado.');}
 finally{button.disabled=false;}
}
async function login(event){
 event.preventDefault();var button=document.getElementById('curso-access-enter'),input=document.getElementById('curso-access-key');button.disabled=true;
 try{
  var key=input.value.trim();if(!/^INS1-[A-Za-z0-9_-]{43}$/.test(key))throw new Error('Copie a chave pessoal completa, começando por INS1-.');
  if(activeKey&&!await synchronise())throw new Error('Conclua o envio deste percurso antes de abrir outro acesso.');
  var res=await request('read',key),old=snapshot(),target=res.state;
  var hasWork=!!mergeSchedule(old.course.schedule,null,null)||Object.keys(old.course.modules||{}).some(function(id){var m=old.course.modules[id];return Object.keys(m.study||{}).length||(m.read||[]).length||(m.attempts||[]).length||(m.draft&&Object.keys(m.draft.answers||{}).length);})||(old.pretest&&Object.keys(old.pretest.answers||{}).length)||(old.pretestHistory||[]).length;
  if(!activeKey&&hasWork&&root.confirm('Encontrámos leituras ou respostas neste aparelho. Pretende juntá-las ao percurso da sua chave pessoal?'))target=merge(old,res.state,{});
  backup();apply(target,false);remember(res);localStorage.setItem(prefix+':cloud-key',key);activeKey=key;
  if(!same(target,res.state))await synchronise();
  location.href='index.html#cursos';
 }catch(e){setStatus(e.message||'Não foi possível recuperar o percurso.');}finally{button.disabled=false;}
}
function showKey(){var box=document.getElementById('curso-key-display'),input=document.getElementById('curso-private-key');box.hidden=false;input.value=activeKey;input.focus();input.select();}
function refresh(){
 if(!mountReady)return;
 document.getElementById('curso-access-create').hidden=!!activeKey;
 document.getElementById('curso-access-show').hidden=!activeKey;
 document.getElementById('curso-cloud-sync').hidden=!activeKey;
 document.getElementById('curso-access-logout').hidden=!activeKey;
 document.getElementById('curso-access-description').textContent=activeKey?'O seu acesso está activo. Use a mesma chave pessoal nos seus outros dispositivos.':'Active o seu acesso para guardar a leitura e os testes e continuar no telemóvel ou no computador.';
 var list=document.getElementById('curso-pretest-history');list.replaceChildren();
 read(prefix+':pretest-history',[]).slice().reverse().forEach(function(a){var li=document.createElement('li');li.textContent=new Date(a.at).toLocaleString('pt-PT')+' · '+a.percent+'%';list.appendChild(li);});
 document.getElementById('curso-pretest-history-area').hidden=!list.children.length;
 var variants=document.getElementById('curso-pretest-variants');variants.replaceChildren();
 read(prefix+':pretest-alternatives',[]).forEach(function(d,i){var b=document.createElement('button');b.type='button';b.textContent='Continuar outra versão do pré-teste · '+Object.keys(d.answers||{}).length+' respostas';b.style.cssText='display:block;margin:8px 0;padding:10px';b.addEventListener('click',function(){var s=snapshot(),chosen=s.pretestAlternatives.splice(i,1)[0];if(s.pretest)s.pretestAlternatives.push(s.pretest);s.pretest=chosen;apply(s,true);changed();location.href='pretest.html';});variants.appendChild(b);});
 setStatus(status||'O percurso está guardado neste aparelho.');
}
async function logout(){
 if(!await synchronise())return;
 backup();[':cloud-key',':cloud-meta',':profile',':id',':pretest-history',':pretest-alternatives',':access'].forEach(function(s){localStorage.removeItem(prefix+s);});
 localStorage.removeItem(courseKey);localStorage.removeItem(preKey);sessionStorage.removeItem(prefix+':access');clearTimeout(timer);timer=null;timerDue=0;activeKey='';location.href='index.html';
}
function mount(){
 if(mountReady)return;var box=document.createElement('section');box.className='course-access';box.setAttribute('aria-label','O meu acesso');
 box.style.cssText='max-width:1140px;margin:12px auto;padding:18px 20px;border:1px solid #bad6de;border-radius:12px;background:#f2f8fa;color:#164b56;font:15px/1.5 system-ui;box-sizing:border-box';
 box.innerHTML='<h2 style="margin:0 0 6px;font-size:19px">O meu acesso</h2><p id="curso-access-description" style="margin:6px 0"></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" id="curso-access-create">Activar o meu acesso</button><button type="button" id="curso-access-show" hidden>Mostrar a minha chave</button><button type="button" id="curso-cloud-sync" hidden>Sincronizar agora</button><button type="button" id="curso-access-logout" hidden>Sair deste aparelho</button></div><div id="curso-key-display" hidden><p><strong>Guarde esta chave num local privado.</strong> Ela permite abrir o seu percurso. Não a partilhe com outras pessoas.</p><label for="curso-private-key">A minha chave pessoal</label><input id="curso-private-key" readonly autocomplete="off" spellcheck="false" style="display:block;box-sizing:border-box;width:100%;max-width:600px;font:14px monospace;padding:10px;margin:5px 0"><button type="button" id="curso-copy-key">Copiar chave</button> <button type="button" id="curso-hide-key">Ocultar chave</button></div><details style="margin-top:12px"><summary>Já tenho uma chave — recuperar o meu percurso</summary><form id="curso-access-login"><label for="curso-access-key">Chave pessoal</label><input id="curso-access-key" type="password" autocomplete="off" spellcheck="false" required placeholder="INS1-…" style="display:block;box-sizing:border-box;width:100%;max-width:600px;padding:10px;margin:5px 0"><button id="curso-access-enter" type="submit">Entrar e recuperar</button></form></details><p id="curso-cloud-status" role="status" aria-live="polite" style="margin:12px 0 0"></p><details id="curso-pretest-history-area" hidden><summary>Histórico do pré-teste</summary><ul id="curso-pretest-history"></ul></details>';
 var variants=document.createElement('div');variants.id='curso-pretest-variants';box.appendChild(variants);
 var app=document.getElementById('course-app');if(app)app.before(box);else document.body.prepend(box);
 box.querySelectorAll('button').forEach(function(b){b.style.cssText='cursor:pointer;font:600 14px system-ui;padding:10px 13px;min-height:44px;border:1px solid #007088;border-radius:7px;background:white;color:#00596c';});
 document.getElementById('curso-access-create').addEventListener('click',activate);document.getElementById('curso-access-login').addEventListener('submit',login);
 document.getElementById('curso-access-show').addEventListener('click',showKey);document.getElementById('curso-cloud-sync').addEventListener('click',synchronise);
 document.getElementById('curso-access-logout').addEventListener('click',logout);document.getElementById('curso-hide-key').addEventListener('click',function(){document.getElementById('curso-key-display').hidden=true;document.getElementById('curso-private-key').value='';});
 document.getElementById('curso-copy-key').addEventListener('click',async function(){try{await navigator.clipboard.writeText(activeKey);setStatus('Chave copiada. Guarde-a num local privado.');}catch(_){showKey();setStatus('Seleccione e copie a chave apresentada.');}});
 mountReady=true;refresh();
}
API.sendEvent=async function(item){
 if(!activeKey||!keyIsCurrent()){var missing=new Error('Active o seu acesso em «O meu acesso» para enviar os registos ao painel.');missing.status=428;throw missing;}
 if(item.row.participante_ref!==get(prefix+':id')){var other=new Error('Este registo pertence a outro acesso guardado neste aparelho.');other.status=403;throw other;}
 return request('event',activeKey,{table:item.table,row:item.row});
};
API.snapshot=snapshot;API.changed=changed;API.sync=synchronise;API.canWrite=keyIsCurrent;API.uuid=uuid;
API.pretestFinished=function(record){var history=read(prefix+':pretest-history',[]);history.push(record);localStorage.setItem(prefix+':pretest-history',JSON.stringify(unique(history,attemptKey)));changed();refresh();};
API.ready=(async function(){
 activeKey=get(prefix+':cloud-key');meta=read(prefix+':cloud-meta',null);
 if(activeKey)await synchronise();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 return true;
})();
root.addEventListener('online',synchronise);
root.addEventListener('pagehide',function(){
 if(!activeKey||!meta||!keyIsCurrent())return;
 clearTimeout(timer);timer=null;timerDue=0;var state=snapshot();if(same(state,meta.base))return;
 var body=JSON.stringify({action:'write',revision:meta.revision,state:state});
 if(new TextEncoder().encode(body).length<60000)fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-curso-chave':activeKey},body:body,keepalive:true,cache:'no-store'}).catch(function(){});
});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')synchronise();else if(activeKey)synchronise();});
root.addEventListener('storage',function(e){if(e.key===prefix+':cloud-key'&&!keyIsCurrent())location.reload();});
root.addEventListener('curso:percurso-recuperado',refresh);
})(typeof window!=='undefined'?window:globalThis);
