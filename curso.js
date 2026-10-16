(function(root){
'use strict';
root.cursoPronto=new Promise(function(resolve){
 var script=document.createElement('script');script.src='curso-acesso.js';
 script.onload=function(){Promise.resolve(root.INSCursoAcesso&&root.INSCursoAcesso.ready).then(resolve,function(){resolve(false);});};
 script.onerror=function(){resolve(false);};document.head.appendChild(script);
});
root.cursoPronto.then(function(){

var cycle='testes-ins-20261016',folder=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1),prefix='ins-sync:'+cycle+':'+folder;
var queue=[],profile={},participant=null,busy=false,timer=null,lastSignature='',status='',retryTimer=null,retryDelay=30000;
function uuid(){if(root.crypto&&crypto.randomUUID)return crypto.randomUUID();var b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;return Array.from(b,function(x,i){return([4,6,8,10].indexOf(i)>=0?'-':'')+x.toString(16).padStart(2,'0');}).join('');}
try{participant=localStorage.getItem(prefix+':id');if(!participant){participant=uuid();localStorage.setItem(prefix+':id',participant);}profile=JSON.parse(localStorage.getItem(prefix+':profile')||'{}');queue=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(prefix+':event:')===0)queue.push(JSON.parse(localStorage.getItem(k)));}queue.sort(function(a,b){return a.created-b.created;});}catch(e){status='Não foi possível guardar os registos neste navegador.';}
function notify(text){status=text;var el=document.getElementById('curso-sync-status');if(el)el.textContent=text;}
function enqueue(table,row,eventId){if(!participant){notify('A gravação central está indisponível neste navegador.');return;}row.participante_ref=participant;row.evento_id=eventId||uuid();row.ciclo=cycle;var item={table:table,row:row,created:Date.now()};queue.push(item);try{localStorage.setItem(prefix+':event:'+row.evento_id,JSON.stringify(item));notify('Registos guardados neste navegador; envio pendente.');}catch(e){item.volatile=true;notify('Não foi possível guardar a fila de envio. Mantenha esta página aberta.');}flush();}
async function flush(){
 if(busy||!queue.length)return;busy=true;clearTimeout(retryTimer);retryTimer=null;
 var attempted=new Set(),pendingError='',temporaryFailure=false;
 try{
  while(true){
   var item=queue.find(function(x){return x.row.participante_ref===participant&&!attempted.has(x.row.evento_id);});if(!item)break;attempted.add(item.row.evento_id);
   try{
    if(!root.INSCursoAcesso||!root.INSCursoAcesso.sendEvent)throw new Error('Actualize a página para concluir o envio.');
    await root.INSCursoAcesso.sendEvent(item);
    queue.splice(queue.indexOf(item),1);try{localStorage.removeItem(prefix+':event:'+item.row.evento_id);}catch(e){}
    retryDelay=30000;
    if(item.table==='curso_testes'){lastSignature='';progress(currentState(),true);}
   }catch(e){
    pendingError=e.message||'Envio não confirmado.';
    if(!e.status||e.status>=500||e.status===429){temporaryFailure=true;break;}
    if(e.status===428||e.status===401)break;
   }
  }
  var ownPending=queue.some(function(x){return x.row.participante_ref===participant;});
  var message=ownPending?(pendingError||'Há registos por enviar. O registo foi conservado neste navegador.'):'Registos enviados ao painel.';
  if(ownPending&&queue.some(function(x){return x.row.participante_ref===participant&&x.volatile;}))message+=' A cópia local está indisponível: mantenha esta página aberta e tente novamente.';
  notify(message);
  if(temporaryFailure){retryTimer=setTimeout(flush,retryDelay);retryDelay=Math.min(300000,retryDelay*2);}
 }finally{busy=false;}
}
function identification(){return{email:profile.email||null,codigo:'Participante '+participant,provincia:profile.provincia||null,distrito:profile.distrito||null,funcao:profile.funcao||null,nivel:profile.nivel||null};}
function snapshot(state){var done={_profile:{nome:profile.nome||''}},scores={},node=0,count=0;var cfg=root.INS_CURSO;[1,2,3].forEach(function(id){var ms=state.modules&&state.modules[id]||{},n=cfg?cfg.modules[id-1].sections.length:[5,8,12][id-1];for(var i=0;i<n;i++){if((ms.read||[]).indexOf(i)>=0)done['m'+id+'-topic-'+(i+1)]=true;if(state.last&&state.last.module===id&&state.last.topic===i+1)node=count;count++;}if((ms.attempts||[]).length)done['m'+id+'-test']=true;scores['m'+id]=ms.best==null?null:ms.best;count++;});return Object.assign(identification(),{node:String(node),done:done,scores:scores,atualizado_em:new Date().toISOString()});}
function progress(state,immediate){if(!participant)return;var row=snapshot(state),sig=JSON.stringify([row.email,row.codigo,row.provincia,row.distrito,row.funcao,row.nivel,row.node,row.done,row.scores]);if(sig===lastSignature)return;clearTimeout(timer);var submit=function(){lastSignature=sig;timer=null;enqueue('curso_progresso',row);};if(immediate)submit();else timer=setTimeout(submit,700);}
function currentState(){try{return JSON.parse(localStorage.getItem('ins-course-v3:'+cycle+':'+folder)||'{"modules":{}}');}catch(e){return{modules:{}};}}
root.cursoSincronizarProgresso=function(state,immediate){progress(state,immediate);if(root.INSCursoAcesso)root.INSCursoAcesso.changed();};
root.cursoRegistarResultado=function(tipo,modulo,titulo,pontuacao,aprovado,detail){detail=detail||{};var answers={_version:detail.version||(root.INS_CURSO&&root.INS_CURSO.version)||'preteste-20261016',_type:tipo,_title:titulo,_passed:aprovado,_answers:detail.answers||{},_score:detail.score==null?null:detail.score,_total:detail.total||null,_duration_seconds:detail.durationSeconds==null?null:detail.durationSeconds,_started:detail.started||null};progress(currentState(),true);enqueue('curso_testes',{email:profile.email||null,modulo:modulo,nota:pontuacao,respostas:answers,criado_em:detail.at||new Date().toISOString()},detail.id);};
function mount(){var box=document.createElement('section');box.className='course-sync';box.style.cssText='max-width:1180px;margin:12px auto;padding:12px 20px;font:14px/1.5 system-ui;color:#164b56;background:#eef6f7;border-radius:10px';box.innerHTML='<details><summary>Identificação do participante</summary><p>Identifique os seus testes para facilitar o acompanhamento. Os campos são opcionais. Active o seu acesso em «O meu acesso» para continuar noutro dispositivo.</p><form id="curso-profile"><div style="display:flex;flex-wrap:wrap;gap:12px">'+[['nome','Nome'],['email','Email'],['provincia','Província'],['distrito','Distrito'],['funcao','Função'],['nivel','Nível']].map(function(x){return '<label>'+x[1]+'<input name="'+x[0]+'" type="'+(x[0]==='email'?'email':'text')+'" maxlength="'+(x[0]==='email'?254:120)+'" style="display:block;padding:8px;border:1px solid #aac5ca;border-radius:6px"></label>';}).join('')+'</div><button type="submit" style="margin:12px 0;padding:8px 14px">Guardar identificação</button></form><small id="curso-participant"></small></details><div style="display:flex;gap:15px;flex-wrap:wrap;margin-top:8px"><span id="curso-sync-status" role="status"></span><button id="curso-retry-sync" type="button">Tentar envio</button><a href="painel.html">Painel de acompanhamento</a></div>';
var app=document.getElementById('course-app');if(app)app.before(box);else document.body.prepend(box);
document.getElementById('curso-participant').textContent=participant?'Código: '+participant:'Código indisponível';
var form=document.getElementById('curso-profile');['nome','email','provincia','distrito','funcao','nivel'].forEach(function(k){form.elements[k].value=profile[k]||'';});
form.addEventListener('submit',function(e){e.preventDefault();var next={};['nome','email','provincia','distrito','funcao','nivel'].forEach(function(k){next[k]=form.elements[k].value.trim();});try{localStorage.setItem(prefix+':profile',JSON.stringify(next));profile=next;progress(currentState(),true);if(root.INSCursoAcesso)root.INSCursoAcesso.changed();}catch(e){notify('Não foi possível guardar a identificação.');}});
document.getElementById('curso-retry-sync').addEventListener('click',flush);notify(status||'Progresso guardado neste navegador.');
if(participant){try{if(!sessionStorage.getItem(prefix+':access')){enqueue('curso_acessos',Object.assign(identification(),{criado_em:new Date().toISOString()}));sessionStorage.setItem(prefix+':access','1');}}catch(e){}progress(currentState(),true);}flush();}
root.addEventListener('curso:acesso-activado',function(e){
 var data=e.detail;
 if(data.migratedFrom)queue.forEach(function(item){if(item.row.participante_ref===data.migratedFrom){item.row.participante_ref=data.participant;if(item.row.codigo)item.row.codigo='Participante '+data.participant;try{localStorage.setItem(prefix+':event:'+item.row.evento_id,JSON.stringify(item));}catch(err){item.volatile=true;}}});
 participant=data.participant;profile=data.profile||{};lastSignature='';
 var label=document.getElementById('curso-participant');if(label)label.textContent='Código: '+participant;
 progress(currentState(),true);flush();
});
root.addEventListener('curso:percurso-recuperado',function(e){profile=e.detail.profile||{};participant=e.detail.participant;lastSignature='';var form=document.getElementById('curso-profile');if(form)['nome','email','provincia','distrito','funcao','nivel'].forEach(function(k){form.elements[k].value=profile[k]||'';});});
root.addEventListener('online',function(){retryDelay=30000;flush();});root.addEventListener('pagehide',function(){if(timer){clearTimeout(timer);progress(currentState(),true);}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
});
})(window);
