(function(root){
'use strict';
function shuffle(items,random){var a=items.slice();random=random||Math.random;for(var i=a.length-1;i>0;i--){var j=Math.floor(random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function grade(questions,answers,passMark){var score=0;questions.forEach(function(q){var a=(answers[q.id]||[]).slice().sort(),c=q.correct.slice().sort();if(JSON.stringify(a)===JSON.stringify(c))score++;});var raw=questions.length?score*100/questions.length:0;return{score:score,total:questions.length,percent:Math.round(raw*10)/10,passed:raw>=(passMark||80)};}

// Preserve the previous state before applying the revised document structure.
function migrateState(previous,version){
 var next=JSON.parse(JSON.stringify(previous));
 if(next.version===version)return next;
 var from=next.version||'2026-10-14';
 if(from==='2026-10-14'){
  var third=next.modules&&next.modules[3];
  if(third){third.read=(third.read||[]).map(function(i){return i===10?11:i;});if(third.topic===11)third.topic=12;}
  if(next.last&&next.last.module===3&&next.last.topic===11)next.last.topic=12;
 }
 // The source document places ethics within 3.10 and the exercise at 3.11.
 // Keep existing marks, attempts, study time and the exercise's stable identifier.
 var documentUpdate=version==='2026-10-20-documento-ins'&&(from==='2026-10-15-final-ins'||from==='2026-10-14');
 if(documentUpdate){
  var third20=next.modules&&next.modules[3];
  function topic20(topic){return topic===12?11:topic===11?10:topic;}
  if(third20){
   third20.read=(third20.read||[]).filter(function(i){return i!==10;}).map(function(i){return i===11?10:i;});
   third20.read=Array.from(new Set(third20.read)).sort(function(a,b){return a-b;});
   third20.topic=topic20(third20.topic);
  }
  if(next.last&&next.last.module===3)next.last.topic=topic20(next.last.topic);
 }
 Object.keys(next.modules||{}).forEach(function(id){
  var item=next.modules[id];
  // All 43 assessment items are unchanged in this document update.
  if(documentUpdate){
   [item.draft].concat(item.otherDrafts||[]).forEach(function(draft){
    if(draft&&draft.version==='2026-10-15-final-ins')draft.version=version;
   });
  }
  if(item.draft&&item.draft.version!==version){
   item.archivedDrafts=item.archivedDrafts||[];
   item.archivedDrafts.push({version:item.draft.version||from,draft:item.draft});
   item.draft=null;
  }
 });
 next.version=version;
 return next;
}

// Calendar duration is independent from reading time and assessment grades.
var DAY_MS=86400000;
function scheduleInfo(schedule,now){
 var start=schedule&&typeof schedule.startedAt==='string'?Date.parse(schedule.startedAt):NaN;
 var days=schedule&&schedule.days;
 if(!isFinite(start)||!Number.isInteger(days)||days<1||days>3660)return null;
 var end=start+days*DAY_MS,diff=Math.max(0,(now-start)/DAY_MS);
 return {start:start,end:end,days:days,elapsed:Math.min(days,Math.floor(diff)),remaining:Math.min(days,Math.max(0,Math.ceil((end-now)/DAY_MS))),value:Math.min(days,diff),expired:now>=end,overdue:Math.max(0,Math.floor((now-end)/DAY_MS))};
}
function dateLabel(ms){return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Africa/Maputo'}).format(new Date(ms));}

// Presentation only: keep source text, order, images and reading identifiers.
var COURSE_EMPHASIS={
 'm1-s1':['superior ao esperado','hospedeiro vulnerável'],
 'm1-s2':['limiar de alerta','limiar epidémico'],
 'm1-s3':['causa, a fonte e o modo de transmissão'],
 'm1-s4':['profissionais de saúde devidamente capacitados'],
 'm1-s5':['diarreia aquosa','fonte de água partilhada'],
 'm2-s1':['níveis basais','padrão de ocorrência'],
 'm2-s2':['número de casos fora do comum','limiares predefinidos'],
 'm2-s3':['limiar de alerta','limiar epidémico'],
 'm2-s4':['comunicação obrigatória'],
 'm2-s5':['Reunião de preparação','Reunião inicial','Formulário de saída'],
 'm2-s6':['epidemiologistas'],
 'm2-s7':['Aspectos administrativos','Aspectos logísticos','Aspectos técnicos'],
 'm2-s8':['três óbitos','últimas 48 horas'],
 'm3-s1':['requisitos fundamentais'],
 'm3-s2':['verificar o diagnóstico','acima do esperado'],
 'm3-s3':['diagnóstico está correcto','verificação diagnóstica'],
 'm3-s4':['casos suspeitos, prováveis, confirmados'],
 'm3-s5':['busca activa de casos','subnotificados'],
 'm3-s6':['pessoa, lugar e tempo'],
 'm3-s7':['origem, o modo de transmissão','factores de risco'],
 'm3-s8':['dados e evidências','provável fonte de infecção'],
 'm3-s9':['fonte do agente infeccioso','pessoas susceptíveis'],
 'm3-s10':['relatório técnico detalhado','comunicação dos resultados'],
 'm3-s11':['comunidade seja informada','fins previstos'],
 'm3-s12':['23 casos','2 óbitos']
};
function formatCourseContent(container,section){
 if(!container||container.dataset.presentation)return;
 container.dataset.presentation='2026-10-16';
 var doc=container.ownerDocument,group=null,hasContent=false,number=0,headings=0;
 Array.from(container.childNodes).forEach(function(node){
  var heading=node.nodeType===1&&node.tagName==='H2',meaningful=node.nodeType===1||!!node.textContent.trim();
  if(!group||(heading&&hasContent)){
   group=doc.createElement('section');group.className='source-section';
   container.insertBefore(group,node);number++;hasContent=false;
  }
  group.appendChild(node);
  if(heading){
   headings++;if(!node.id)node.id=section.id+'-heading-'+headings;
   if(!group.hasAttribute('aria-labelledby'))group.setAttribute('aria-labelledby',node.id);
   var title=node.textContent.trim();
   if(/^NOTA\b/i.test(title))group.classList.add('source-note');
   if(/exemplo|situação-problema|contexto/i.test(title))group.classList.add('source-example');
   if(/perguntas|actividade|exercício|gabarito/i.test(title))group.classList.add('source-practice');
  }else if(meaningful)hasContent=true;
 });
 if(section.practice)container.classList.add('source-exercise');
 // Highlight exact phrases already in the approved paragraphs; never rewrite them.
 (COURSE_EMPHASIS[section.id]||[]).forEach(function(phrase){
  var texts=[];
  function collect(node){
   if(node.nodeType===3){texts.push(node);return;}
   if(node.nodeType!==1||/^(STRONG|B|A|CODE|H[1-6]|FIGCAPTION)$/.test(node.tagName))return;
   Array.from(node.childNodes).forEach(collect);
  }
  container.querySelectorAll('p,li').forEach(function(el){
   if(!el.parentElement.closest('p,li'))collect(el);
  });
  var match=texts.find(function(n){return n.textContent.toLocaleLowerCase('pt').indexOf(phrase.toLocaleLowerCase('pt'))>=0;});
  if(!match)return;
  var text=match.textContent,index=text.toLocaleLowerCase('pt').indexOf(phrase.toLocaleLowerCase('pt'));
  var bold=doc.createElement('strong');bold.className='concept-emphasis';bold.textContent=text.slice(index,index+phrase.length);
  var fragment=doc.createDocumentFragment();fragment.appendChild(doc.createTextNode(text.slice(0,index)));fragment.appendChild(bold);fragment.appendChild(doc.createTextNode(text.slice(index+phrase.length)));match.parentNode.replaceChild(fragment,match);
 });
}


var API={shuffle:shuffle,grade:grade,migrateState:migrateState,scheduleInfo:scheduleInfo,dateLabel:dateLabel,formatCourseContent:formatCourseContent,emphasis:COURSE_EMPHASIS};root.INSFormacao=API;if(typeof module==='object'&&module.exports)module.exports=API;if(typeof document==='undefined')return;
function boot(){
var cfg=root.INS_CURSO;var folder=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1),key='ins-course-v3:testes-ins-20261016:'+folder;var state={modules:{},last:null};
var storageReady=true;
try{
 var raw=localStorage.getItem(key),saved=JSON.parse(raw||'null');
 if(saved&&saved.modules){
  if(saved.version!==cfg.version){
   var backupKey=key+':backup:'+(saved.version||'2026-10-14')+':before-'+cfg.version;
   try{if(localStorage.getItem(backupKey)===null)localStorage.setItem(backupKey,raw);}catch(e){storageReady=false;}
   state=migrateState(saved,cfg.version);
  }else state=saved;
 }else state.version=cfg.version;
}catch(e){storageReady=false;}

function moduleState(id){if(!state.modules[id])state.modules[id]={read:[],attempts:[],best:null,topic:0};return state.modules[id];}
var importing=false;
function save(){if(importing)return;try{if(root.INSCursoAcesso&&!root.INSCursoAcesso.canWrite())return;if(!storageReady)throw new Error('Previous progress could not be backed up');var latest=JSON.parse(localStorage.getItem(key)||'{}'),savedSchedule=scheduleInfo(latest.schedule,Date.now()),localSchedule=scheduleInfo(state.schedule,Date.now());if(savedSchedule&&(!localSchedule||savedSchedule.start<localSchedule.start))state.schedule=latest.schedule;localStorage.setItem(key,JSON.stringify(state));if(root.cursoSincronizarProgresso)root.cursoSincronizarProgresso(state);}catch(e){var e=document.getElementById('storage-status');if(e)e.textContent='O navegador não está a guardar o progresso. Mantenha esta página aberta.';}}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function button(text,id,secondary){return '<button class="course-btn'+(secondary?' secondary':'')+'" id="'+id+'">'+text+'</button>';}
function on(id,fn){var b=document.getElementById(id);if(b)b.addEventListener('click',fn);}
function canAccess(m){return cfg.progression!=='sequential'||m.id===1||moduleState(m.id-1).best>=cfg.passMark;}
// A module has started even when no complete topic has been marked as read yet.
function hasModuleActivity(s){return (s.read||[]).length>0||(s.attempts||[]).length>0||!!s.draft||(s.otherDrafts||[]).length>0||(s.archivedDrafts||[]).length>0||(typeof s.best==='number'&&isFinite(s.best))||Number(s.topic)>0||Object.keys(s.study||{}).length>0;}
function pctRead(m){return Math.round(moduleState(m.id).read.filter(function(i){return i>=0&&i<m.sections.length;}).length/m.sections.length*100);}
function elapsed(){return cfg.modules.reduce(function(n,item){return n+root.INSLeitura.seconds(moduleState(item.id).study);},0);}
function globalProgress(){var total=0,done=0,passed=0;cfg.modules.forEach(function(item){total+=item.sections.length;done+=moduleState(item.id).read.filter(function(i){return i>=0&&i<item.sections.length;}).length;if(moduleState(item.id).best>=cfg.passMark)passed++;});return {done:done,total:total,passed:passed,percent:Math.round(done/total*100)};}
function approvedHours(){var v=root.INS_CURSO_TEMPO&&root.INS_CURSO_TEMPO.cargaHorariaHoras;return typeof v==='number'&&isFinite(v)&&v>0?v:null;}
function deadlineDays(){var days=root.INS_CURSO_TEMPO&&root.INS_CURSO_TEMPO.prazoDias;return Number.isInteger(days)&&days>0&&days<=3660?days:90;}
function courseComplete(){var p=globalProgress();return p.done===p.total&&p.passed===cfg.modules.length;}
function beginSchedule(){
 if(importing||scheduleInfo(state.schedule,Date.now())||courseComplete())return;
 if(root.INSCursoAcesso&&!root.INSCursoAcesso.canWrite())return;
 try{
  var raw=localStorage.getItem(key),backupKey=key+':backup:before-prazo-90-dias';
  if(raw&&localStorage.getItem(backupKey)===null)localStorage.setItem(backupKey,raw);
 }catch(e){storageReady=false;return;}
 state.schedule={startedAt:new Date(Date.now()).toISOString(),days:deadlineDays()};save();
}
function deadlineCard(){
 var info=scheduleInfo(state.schedule,Date.now()),done=courseComplete(),days=info?info.days:deadlineDays();
 var title=done?'Curso concluído':!info?'Por iniciar':info.expired?'Prazo atingido':info.remaining+' '+(info.remaining===1?'dia restante':'dias restantes');
 var detail=info?info.elapsed+' de '+days+' dias decorridos':'O prazo começa ao iniciar a leitura ou a avaliação de um módulo.';
 if(info&&info.expired&&!done)detail+=' · '+(info.overdue?info.overdue+' '+(info.overdue===1?'dia após a data limite':'dias após a data limite'):'Data limite atingida');
 return '<div class="deadline-content'+(info&&info.expired&&!done?' deadline-expired':'')+'"><div class="progress-heading"><span class="progress-label">Prazo para concluir · '+days+' dias</span><strong>'+title+'</strong></div><progress data-deadline-bar value="'+(info?info.value:0)+'" max="'+days+'" aria-label="Prazo decorrido do curso" aria-valuetext="'+detail+'"></progress><p class="deadline-detail">'+detail+'</p>'+(info?'<div class="deadline-dates"><span>Início do prazo <time datetime="'+new Date(info.start).toISOString()+'">'+dateLabel(info.start)+'</time></span><span>Data limite <time datetime="'+new Date(info.end).toISOString()+'">'+dateLabel(info.end)+'</time></span></div>':'')+'</div>';
}
function updateDeadline(){document.querySelectorAll('[data-deadline]').forEach(function(el){var html=deadlineCard();if(el.innerHTML!==html)el.innerHTML=html;});}
function progressCard(compact){
 var p=globalProgress(),hours=approvedHours(),seconds=elapsed();
 return '<section class="progress-overview'+(compact?' compact':'')+'" aria-label="Prazo e progresso do curso">'+
 '<div class="progress-tracks"><div data-deadline>'+deadlineCard()+'</div>'+
 '<div class="reading-progress"><div class="progress-heading"><span class="progress-label">Leitura global do curso</span><strong data-global-percent>'+p.percent+'%</strong></div><progress data-global-bar value="'+p.done+'" max="'+p.total+'" aria-label="Leitura global"></progress><p data-global-read>'+p.done+' de '+p.total+' tópicos lidos</p></div></div>'+
 '<div class="progress-facts"><div><span class="progress-label">Avaliações aprovadas</span><strong>'+p.passed+' de '+cfg.modules.length+'</strong><p>Nota mínima: '+cfg.passMark+'%</p></div><div><span class="progress-label">Tempo de leitura registado</span><strong data-study-time>'+root.INSLeitura.timeLabel(seconds)+'</strong>'+(hours?'<p>Carga horária do curso: '+hours+' h</p><progress data-time-bar value="'+Math.min(seconds,hours*3600)+'" max="'+hours*3600+'" aria-label="Tempo de leitura em relação à carga horária"></progress>':'<p>Durante a leitura activa dos tópicos</p>')+'</div></div></section>';
}
function updateProgress(){
 if(!m)return;var p=globalProgress();document.querySelectorAll('[data-module-read]').forEach(function(el){el.textContent=pctRead(m)+'% · '+ms.read.length+'/'+m.sections.length+' tópicos lidos';});document.querySelectorAll('[data-module-bar]').forEach(function(el){el.value=ms.read.length;});document.querySelectorAll('[data-global-percent]').forEach(function(el){el.textContent=p.percent+'%';});document.querySelectorAll('[data-global-read]').forEach(function(el){el.textContent=p.done+' de '+p.total+' tópicos lidos';});document.querySelectorAll('[data-global-bar]').forEach(function(el){el.value=p.done;});document.querySelectorAll('[data-study-time]').forEach(function(el){el.textContent=root.INSLeitura.timeLabel(elapsed());});document.querySelectorAll('[data-time-bar]').forEach(function(el){el.value=Math.min(elapsed(),Number(el.max));});
 document.querySelectorAll('[data-go]').forEach(function(el){var i=Number(el.dataset.go)-1,read=ms.read.indexOf(i)>=0;if(i>=0){el.classList.toggle('is-read',read);var mark=el.querySelector('.topic-marker');if(mark)mark.textContent=read?'✓':'○';var label=el.querySelector('.topic-read-label');if(label)label.textContent=read?' — lido':'';}});
 var status=document.getElementById('reading-status');if(status&&ms.read.indexOf(current-1)>=0){status.textContent='✓ Leitura deste tópico concluída';status.classList.add('complete');var seek=document.getElementById('seek-unread');if(seek)seek.hidden=true;}
}
function home(){var app=document.getElementById('course-app');var cards=cfg.modules.map(function(m){var s=moduleState(m.id),started=hasModuleActivity(s);return '<article class="module-card"><span class="module-number">Módulo '+m.id+'</span><h2>'+esc(m.title)+'</h2><p>'+m.sections.length+' tópicos · '+m.questions.length+' perguntas de avaliação</p><progress max="100" value="'+pctRead(m)+'" aria-label="Leitura do módulo '+m.id+'"></progress><p>'+pctRead(m)+'% dos tópicos lidos'+(s.best!==null?' · Melhor nota: '+s.best+'%':'')+'</p><span class="status '+(s.best>=cfg.passMark?'passed':'')+'">'+(s.best>=cfg.passMark&&s.read.length===m.sections.length?'Módulo concluído':s.best>=cfg.passMark?'Avaliação aprovada':started?'Em curso':'Por iniciar')+'</span><a class="course-btn" href="modulo'+m.id+'.html">'+(started?'Continuar módulo':'Abrir módulo')+'</a>'+(s.draft?'<a class="course-btn secondary" href="modulo'+m.id+'.html?avaliacao=retomar">Retomar avaliação</a>':'')+'</article>';}).join('');
 var resume=state.last&&cfg.modules.some(function(m){return m.id===state.last.module;})?'<a class="course-btn" href="modulo'+state.last.module+'.html">Retomar a última leitura</a>':'';
 if(state.resume&&state.resume.type==='exam'&&moduleState(state.resume.module).draft)resume='<a class="course-btn" href="modulo'+state.resume.module+'.html?avaliacao=retomar">Retomar o teste interrompido</a>'+resume;

 app.innerHTML='<section class="course-hero"><p class="eyebrow">Instituto Nacional de Saúde · MISAU</p><h1>Curso Básico em Investigação de Surtos</h1><p>Reconhecer um possível surto, organizar a resposta e conduzir uma investigação epidemiológica.</p><div class="course-actions">'+resume+'<a class="course-btn secondary" href="manual.pdf">Consultar o manual</a></div></section>'+progressCard(false)+'<section id="cursos"><h2>Percurso de aprendizagem</h2><p>Leia os conteúdos, trabalhe os exercícios e realize a avaliação de cada módulo. A nota mínima de aprovação é '+cfg.passMark+'%. Pode repetir a avaliação para melhorar a classificação.</p><div class="module-grid">'+cards+'</div></section><section class="course-guide"><h2>Como utilizar o curso</h2><ol><li>Abra um módulo e escolha o tópico no índice.</li><li>Leia o conteúdo completo de cada tópico.</li><li>Percorra todo o conteúdo: a leitura é registada automaticamente. Responda aos exercícios no seu caderno.</li><li>Na avaliação, responda a uma pergunta de cada vez e confirme a submissão no final.</li><li>Consulte a classificação e o histórico de tentativas. Pode refazer a avaliação.</li></ol><p>Para continuar noutro dispositivo, consulte <a href="percurso.html">Recuperar o meu percurso</a>.</p></section>';
}
var m=null,ms=null,current=0,exam=null,answerMap={},qIndex=0,reader=null,reviewing=false;
function stopReader(discard){if(reader){var old=reader;reader=null;old.stop(discard);}}
function persistPosition(){if(!m)return;var pane=document.getElementById('lesson-content');if(pane){ms.topic=current;ms.scroll=pane.scrollTop;ms.scrollMode='content';state.last={module:m.id,topic:current};}save();}
function lesson(index,restore){stopReader();document.body.classList.add('reading-mode');exam=null;reviewing=false;state.resume={type:'lesson',module:m.id};current=Math.max(0,Math.min(m.sections.length,Number(index)||0));if(current)beginSchedule();ms.topic=current;state.last={module:m.id,topic:current};save();
 var nav='<nav aria-label="Tópicos do módulo"><button class="topic-button'+(current===0?' active':'')+'" data-go="0">Objectivos e avaliação</button>'+m.sections.map(function(s,i){return '<button class="topic-button'+(current===i+1?' active':'')+'" data-go="'+(i+1)+'"><span class="topic-marker" aria-hidden="true">'+(ms.read.indexOf(i)>=0?'✓':'○')+'</span> '+esc(s.title)+'<span class="sr-only topic-read-label">'+(ms.read.indexOf(i)>=0?' — lido':'')+'</span></button>';}).join('')+'<button class="topic-button" id="open-assessment">Avaliação · '+m.questions.length+' perguntas</button></nav>';
 var body;if(!current){body='<p class="eyebrow">Módulo '+m.id+'</p><h1>'+esc(m.title)+'</h1><h2>Objectivos de Aprendizagem</h2><p>O participante será capaz de:</p><ul>'+m.objectives.map(function(x){return'<li>'+esc(x)+'</li>';}).join('')+'</ul><h2>Avaliação do módulo</h2><p>O teste aplicado ao módulo contém '+m.questions.length+' perguntas. A aprovação exige pelo menos '+cfg.passMark+'%. As perguntas e as opções mudam de ordem em cada tentativa. A classificação é apresentada depois da submissão de todas as respostas.</p><p>Pode refazer a avaliação, mesmo depois de aprovado. A melhor classificação é conservada.</p>'+button('Iniciar leitura','read-start');}
 else{var sec=m.sections[current-1];body='<p class="eyebrow">Módulo '+m.id+' · Tópico '+current+' de '+m.sections.length+'</p><h1>'+esc(sec.title)+'</h1><div class="legacy-content course-source">'+sec.html+'</div><div id="reading-end" class="reading-end"><p id="reading-status" role="status">'+(ms.read.indexOf(current-1)>=0?'✓ Leitura deste tópico concluída':'A leitura é registada automaticamente ao percorrer todo o conteúdo.')+'</p><p id="reading-coverage" class="reading-help">Leia cada parte com a página activa. O progresso fica guardado para continuar depois.</p><button class="text-link" id="seek-unread"'+(ms.read.indexOf(current-1)>=0?' hidden':'')+'>Ir para a próxima parte por ler ↑</button></div>'+(sec.practice?'<p>Registe as respostas no seu caderno de exercícios para discussão na tutoria.</p>':'')+'<div class="course-actions">'+button('Anterior','previous-topic',true)+button(current===m.sections.length?'Ir para a avaliação':'Próximo tópico','next-topic')+'</div>';}

 document.getElementById('course-app').innerHTML='<div class="learning-layout"><aside class="topic-index"><a href="index.html#cursos" class="back-course">← Voltar ao curso</a><h2>Módulo '+m.id+'</h2><p data-module-read>'+pctRead(m)+'% · '+ms.read.length+'/'+m.sections.length+' tópicos lidos</p><progress data-module-bar max="'+m.sections.length+'" value="'+ms.read.length+'" aria-label="Leitura deste módulo"></progress>'+'<details class="reader-progress"'+(root.innerWidth>850?' open':'')+'><summary>Prazo e progresso do curso</summary>'+progressCard(true)+'</details><details class="topic-menu"'+(root.innerWidth>850?' open':'')+'><summary>Índice do módulo</summary>'+nav+'</details></aside><main class="lesson-content" id="lesson-content" tabindex="-1">'+body+'<p id="storage-status" role="status"></p></main></div>';
 document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){ms.scroll=0;lesson(Number(b.dataset.go));});});document.querySelectorAll('[data-topic]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();lesson(Number(a.dataset.topic));});});
 on('read-start',function(){lesson(1);});on('previous-topic',function(){ms.scroll=0;lesson(current-1);});on('next-topic',function(){ms.scroll=0;if(current===m.sections.length)assessmentStart();else lesson(current+1);});on('open-assessment',assessmentStart);
 if(current){formatCourseContent(document.querySelector('.course-source'),sec);reader=root.INSLeitura.start({source:document.querySelector('.course-source'),viewport:document.getElementById('lesson-content'),end:document.getElementById('reading-end'),id:sec.id,index:current-1,state:function(){return ms;},save:save,update:function(info){var el=document.getElementById('reading-coverage');if(el)el.textContent=info.parts+' de '+info.total+' partes percorridas neste tópico.';updateProgress();},completed:function(){updateProgress();updateDeadline();}});on('seek-unread',function(){var next=reader&&reader.firstUnread();if(next){next.el.setAttribute('tabindex','-1');next.el.focus({preventScroll:true});var r=next.el.getBoundingClientRect();var pane=document.getElementById('lesson-content'),pr=pane.getBoundingClientRect();pane.scrollTo({top:Math.max(0,pane.scrollTop+r.top-pr.top+r.height*next.part-pane.clientHeight/2),behavior:'auto'});}});}
 updateProgress();
 var pane=document.getElementById('lesson-content');pane.addEventListener('scroll',function(){ms.scroll=pane.scrollTop;ms.scrollMode='content';},{passive:true});if(restore)requestAnimationFrame(function(){pane.scrollTop=ms.scroll||0;});else{pane.scrollTop=0;ms.scroll=0;root.scrollTo(0,0);pane.focus({preventScroll:true});}
}
function examMinutes(){var n=root.INS_CURSO_TEMPO&&root.INS_CURSO_TEMPO.avaliacaoMinutos;return Number.isFinite(n)&&n>0?n:60;}
function timerMarkup(){return '<div class="exam-clock"><span>Tempo restante</span> <strong id="exam-time" role="timer"></strong><p id="exam-warning" role="status" aria-live="polite"></p></div>';}
function ensureTimed(d){
 if(!d.expiresAt){d.timingStarted=new Date().toISOString();d.expiresAt=new Date(Date.now()+examMinutes()*60000).toISOString();d.timeLimitMinutes=examMinutes();save();}
}
function completeDraft(item,d,expired){
 var target=moduleState(item.id),result=grade(d.questions,d.answers||{},cfg.passMark);
 var prior=target.attempts.find(function(a){return d.id?a.id===d.id:a.started===d.started;});
 function sameAttempt(x){return x&&(x===d||(d.id?x.id===d.id:x.started===d.started));}
 if(sameAttempt(target.draft))target.draft=null;
 target.otherDrafts=(target.otherDrafts||[]).filter(function(x){return !sameAttempt(x);});
 if(prior){save();return prior;}
 var end=expired?Date.parse(d.expiresAt):Date.now(),start=Date.parse(d.timingStarted||d.started);
 var record={id:d.id,at:new Date(end).toISOString(),version:d.version,started:d.started,durationSeconds:Math.max(0,Math.round((end-start)/1000)),percent:result.percent,passed:result.passed,score:result.score,total:result.total,expired:!!expired,timeLimitMinutes:d.timeLimitMinutes||examMinutes(),expiresAt:d.expiresAt};
 target.attempts.push(record);target.best=Math.max(target.best||0,result.percent);
 save();
 if(root.cursoRegistarResultado)root.cursoRegistarResultado('modulo',item.id,item.title,result.percent,result.passed,Object.assign({},record,{answers:JSON.parse(JSON.stringify(d.answers||{}))}));
 return record;
}
function resultView(result){
 document.body.classList.remove('reading-mode');exam=null;reviewing=false;
 var next=cfg.modules.find(function(x){return x.id===m.id+1;});
 document.getElementById('course-app').innerHTML='<main class="assessment"><p class="eyebrow">Avaliação submetida</p><h1>'+result.percent+'%</h1><p class="status '+(result.passed?'passed':'')+'">'+(result.passed?'Aprovado':'Ainda não atingiu '+cfg.passMark+'%')+'</p>'+(result.expired?'<p role="status">O tempo de uma hora terminou. Foram submetidas as respostas guardadas. As perguntas sem resposta não pontuam.</p>':'')+'<p>Melhor classificação: '+ms.best+'%.</p><p>'+(result.passed?'Pode rever os conteúdos ou repetir a avaliação para melhorar a classificação.':'Reveja os conteúdos e os exercícios do módulo antes de iniciar outra tentativa.')+'</p><div class="course-actions">'+button('Refazer avaliação','retry')+button('Rever conteúdos','review-content',true)+(next&&canAccess(next)?'<a class="course-btn" href="modulo'+next.id+'.html">Ir para o Módulo '+next.id+'</a>':'')+'<a class="course-btn secondary" href="index.html#cursos">Voltar ao curso</a></div><p id="storage-status" role="status"></p></main>';
 on('retry',assessmentStart);on('review-content',function(){lesson(current);});root.scrollTo(0,0);
}
function sweepTimedAttempts(){
 var currentResult=null,changed=false;
 cfg.modules.forEach(function(item){var target=moduleState(item.id);[target.draft].concat(target.otherDrafts||[]).filter(Boolean).forEach(function(d){
  if(d.expiresAt&&Date.now()>=Date.parse(d.expiresAt)){
   var active=m&&m.id===item.id&&exam&&target.draft===d;
   var result=completeDraft(item,d,true);if(active)currentResult=result;changed=true;
  }
 });});
 if(currentResult)resultView(currentResult);
 else if(changed&&!m)home();
 return !!currentResult;
}
function updateExamClock(){
 if(sweepTimedAttempts())return;
 if(!exam||!ms||!ms.draft)return;
 var remaining=Math.max(0,Math.ceil((Date.parse(ms.draft.expiresAt)-Date.now())/1000)),el=document.getElementById('exam-time'),warning=document.getElementById('exam-warning');
 if(el)el.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
 if(warning){var text=remaining<=60?'Falta menos de um minuto. As respostas guardadas serão submetidas automaticamente.':remaining<=300?'Faltam menos de cinco minutos. Reveja as respostas antes do fim.':'';if(warning.textContent!==text)warning.textContent=text;}
}
function resumeDraft(d){
 ms.draft=d;ensureTimed(d);exam=d.questions;answerMap=d.answers;qIndex=d.index||0;reviewing=false;save();question();
}
function assessmentStart(){
 stopReader();document.body.classList.remove('reading-mode');exam=null;reviewing=false;sweepTimedAttempts();
 var history=ms.attempts.slice().reverse().map(function(a){return '<li>'+new Date(a.at).toLocaleString('pt-PT')+' · '+a.percent+'% · '+(a.passed?'Aprovado':'Por consolidar')+(a.expired?' · tempo terminado':'')+'</li>';}).join('');
 document.getElementById('course-app').innerHTML='<main class="assessment"><a href="modulo'+m.id+'.html">← Voltar aos conteúdos</a><h1>Avaliação do Módulo '+m.id+'</h1><p>'+m.questions.length+' perguntas · aprovação mínima '+cfg.passMark+'%.</p><p>Cada tentativa dispõe de '+examMinutes()+' minutos corridos, incluindo a revisão. O tempo continua a contar se sair ou fechar a página. No fim, são submetidas as respostas guardadas; as perguntas sem resposta não pontuam. Se a página estiver fechada, o resultado é registado quando regressar.</p><p>Pode repetir a avaliação. Cada nova tentativa tem novamente uma hora. A melhor classificação é conservada.</p><p>Não são mostrados acertos, erros ou respostas correctas durante a tentativa.</p>'+button('Iniciar nova tentativa','new-attempt')+(ms.draft?button('Retomar tentativa em curso','resume-attempt',true):'')+(ms.otherDrafts&&ms.otherDrafts.length?'<h2>Outras versões guardadas</h2><p>Foram conservadas respostas feitas em paralelo. Escolha a versão que pretende continuar.</p>'+ms.otherDrafts.map(function(d,i){return '<button class="course-btn secondary" data-draft="'+i+'">Continuar versão '+(i+1)+' · '+Object.keys(d.answers||{}).length+' perguntas respondidas</button>';}).join(''):'')+'<h2>Histórico de tentativas</h2>'+(history?'<ul>'+history+'</ul>':'<p>Ainda não submeteu uma avaliação deste módulo.</p>')+(ms.archivedDrafts&&ms.archivedDrafts.length?'<p class="course-note">Uma tentativa por concluir da versão anterior foi conservada no histórico local. Inicie uma nova tentativa para responder às perguntas actualizadas.</p>':'')+'<p id="storage-status" role="status"></p></main>';
 document.querySelectorAll('[data-draft]').forEach(function(b){b.addEventListener('click',function(){var d=ms.otherDrafts.splice(Number(b.dataset.draft),1)[0];if(ms.draft)ms.otherDrafts.push(ms.draft);resumeDraft(d);});});
 on('new-attempt',function(){
  beginSchedule();if(ms.draft){ms.otherDrafts=ms.otherDrafts||[];ms.otherDrafts.push(ms.draft);}
  var questions=shuffle(m.questions).map(function(q){return Object.assign({},q,{options:shuffle(q.options)});});
  resumeDraft({id:root.INSCursoAcesso?root.INSCursoAcesso.uuid():String(Date.now()),version:cfg.version,questions:questions,answers:{},index:0,started:new Date().toISOString()});
 });
 on('resume-attempt',function(){resumeDraft(ms.draft);});root.scrollTo(0,0);
}
function question(){
 ensureTimed(ms.draft);if(sweepTimedAttempts())return;
 document.body.classList.remove('reading-mode');beginSchedule();state.resume={type:'exam',module:m.id};save();
 var q=exam[qIndex],selected=answerMap[q.id]||[],multiple=q.multiple||q.correct.length>1;
 document.getElementById('course-app').innerHTML='<main class="assessment"><p class="eyebrow">Avaliação do Módulo '+m.id+'</p>'+timerMarkup()+'<p id="question-position">Pergunta '+(qIndex+1)+' de '+exam.length+'</p><progress max="'+exam.length+'" value="'+(qIndex+1)+'" aria-label="Posição na avaliação"></progress><fieldset><legend>'+esc(q.text)+'</legend>'+(multiple?'<p>Seleccione todas as opções adequadas.</p>':'')+q.options.map(function(o){return '<label class="answer-option"><input type="'+(multiple?'checkbox':'radio')+'" name="answer" value="'+esc(o.id)+'" '+(selected.indexOf(o.id)>=0?'checked':'')+'><span>'+esc(o.text)+'</span></label>';}).join('')+'</fieldset><p id="answer-status" role="status"></p><div class="course-actions">'+(reviewing?button('Finalizar revisão','finish-review'):'')+(qIndex?button('Pergunta anterior','previous-question',true):'')+button(qIndex===exam.length-1?'Rever e submeter':'Guardar e continuar','next-question')+button('Guardar e sair','leave-exam',true)+'</div><p id="storage-status" role="status"></p></main>';
 function collect(){if(sweepTimedAttempts())return false;if(!ms.draft)return false;answerMap[q.id]=Array.from(document.querySelectorAll('input[name="answer"]:checked')).map(function(x){return x.value;});ms.draft.answers=answerMap;ms.draft.index=qIndex;save();return true;}
 document.querySelectorAll('input[name="answer"]').forEach(function(i){i.addEventListener('change',collect);});
 on('finish-review',function(){if(collect())review();});
 on('previous-question',function(){if(!collect())return;qIndex--;ms.draft.index=qIndex;save();question();});
 on('next-question',function(){if(!collect())return;if(!answerMap[q.id].length){document.getElementById('answer-status').textContent='Seleccione uma resposta para continuar.';return;}if(qIndex===exam.length-1)review();else{qIndex++;ms.draft.index=qIndex;save();question();}});
 on('leave-exam',function(){if(collect())lesson(current);});updateExamClock();root.scrollTo(0,0);
}
function review(){
 if(sweepTimedAttempts())return;
 var complete=exam.every(function(q){return (answerMap[q.id]||[]).length>0;});reviewing=true;
 document.getElementById('course-app').innerHTML='<main class="assessment"><h1>Rever e submeter</h1>'+timerMarkup()+'<p>'+Object.keys(answerMap).filter(function(k){return answerMap[k].length;}).length+' de '+exam.length+' perguntas respondidas.</p><ol>'+exam.map(function(q,i){return '<li><button class="review-question" data-review="'+i+'">Pergunta '+(i+1)+' · '+((answerMap[q.id]||[]).length?'Respondida':'Por responder')+'</button></li>';}).join('')+'</ol><p>A submissão guarda a classificação desta tentativa. Pode refazer depois para melhorar a nota.</p>'+button('Submeter avaliação','submit-assessment')+'<p id="storage-status" role="status"></p></main>';
 document.querySelectorAll('[data-review]').forEach(function(b){b.addEventListener('click',function(){qIndex=Number(b.dataset.review);question();});});
 document.getElementById('submit-assessment').disabled=!complete;on('submit-assessment',finish);updateExamClock();root.scrollTo(0,0);
}
function finish(){if(!exam||sweepTimedAttempts())return;resultView(completeDraft(m,ms.draft,false));}

function start(){if(!cfg)return;var id=Number(document.body.dataset.module||0);m=cfg.modules.find(function(x){return x.id===id;});if(!m){home();return;}if(!canAccess(m)){document.getElementById('course-app').innerHTML='<main class="assessment"><h1>Conclua o módulo anterior</h1><p>A aprovação exige pelo menos '+cfg.passMark+'%.</p><a class="course-btn" href="modulo'+(m.id-1)+'.html">Abrir o módulo anterior</a></main>';return;}ms=moduleState(id);var topic=new URLSearchParams(location.search).get('topic');current=topic!==null?Number(topic):ms.topic||0;if(new URLSearchParams(location.search).get('avaliacao')==='retomar'&&ms.draft){exam=ms.draft.questions;answerMap=ms.draft.answers;qIndex=ms.draft.index||0;question();}else lesson(current,true);root.addEventListener('pagehide',persistPosition);}
root.addEventListener('curso:percurso-recuperado',function(e){
 stopReader(true);importing=true;
 try{state=migrateState(e.detail.course,cfg.version);if(m){ms=moduleState(m.id);if(exam&&ms.draft){exam=ms.draft.questions;answerMap=ms.draft.answers;qIndex=ms.draft.index||0;question();}else if(exam){exam=null;assessmentStart();}else lesson(ms.topic||0,true);}else home();}finally{importing=false;}
});
root.addEventListener('curso:guardar-leitura',function(){if(reader)reader.flush();});
var examTimer=root.setInterval(updateExamClock,1000);root.addEventListener('pagehide',function(){root.clearInterval(examTimer);examTimer=null;});root.addEventListener('pageshow',function(){if(examTimer===null)examTimer=root.setInterval(updateExamClock,1000);updateExamClock();});root.addEventListener('focus',updateExamClock);document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='hidden')updateExamClock();});
var deadlineTimer=null;
function resumeDeadline(){updateDeadline();if(deadlineTimer===null&&root.setInterval)deadlineTimer=root.setInterval(updateDeadline,60000);}
root.addEventListener('pagehide',function(){if(deadlineTimer!==null){root.clearInterval(deadlineTimer);deadlineTimer=null;}});
root.addEventListener('pageshow',resumeDeadline);
root.addEventListener('focus',updateDeadline);
document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='hidden')updateDeadline();});
resumeDeadline();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
if(root.cursoPronto)root.cursoPronto.then(boot);else boot();

})(typeof window!=='undefined'?window:globalThis);
