(function(root){
'use strict';
// Viewport coverage is a reading aid, not evidence of comprehension or credit hours.
var FULL=65535;
function cover(mask,rect,top,bottom){
 if(!rect||rect.height<=0||bottom<=top)return mask||0;
 for(var i=0;i<16;i++){var y=rect.top+rect.height*(i+.5)/16;if(y>=top&&y<=bottom)mask=(mask||0)|(1<<i);}
 return mask||0;
}
function mergeStudy(a,b){
 var out={};Object.keys(Object.assign({},a,b)).forEach(function(topic){
  var x=(a||{})[topic]||{},y=(b||{})[topic]||{},n={seen:{},sessions:{}};
  Object.keys(Object.assign({},x.seen,y.seen)).forEach(function(k){n.seen[k]=((x.seen||{})[k]||0)|((y.seen||{})[k]||0);});
  Object.keys(Object.assign({},x.sessions,y.sessions)).forEach(function(k){n.sessions[k]=Math.max(Number((x.sessions||{})[k])||0,Number((y.sessions||{})[k])||0);});
  out[topic]=n;
 });return out;
}
function seconds(study){var ms=0;Object.keys(study||{}).forEach(function(k){Object.values(study[k].sessions||{}).forEach(function(v){ms+=Number(v)||0;});});return Math.floor(ms/1000);}
function timeLabel(s){s=Math.max(0,Math.floor(s||0));return s>=3600?Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min':s>=60?Math.floor(s/60)+' min':s+' s';}
function start(options){
 var doc=root.document,source=options.source,session=root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 var units=Array.from(source.querySelectorAll('[data-source-p], .course-table-wrap, .course-equation'));
 units=units.filter(function(el){return !units.some(function(other){return other!==el&&other.contains(el);});});
 var occurrences={};units=units.map(function(el,i){var id=el.getAttribute('data-source-p')||'extra-'+i;occurrences[id]=(occurrences[id]||0)+1;return {el:el,id:id+'-'+occurrences[id]};});
 var alive=true,activeAt=Date.now(),interacted=false,last=Date.now(),dirty=false,lastSaved=last,previous={},endSeen=false;
 var listeners=[];
 function listen(target,event,fn){target.addEventListener(event,fn,{passive:true});listeners.push([target,event,fn]);}
 function activity(e){if(e.isTrusted!==false){activeAt=Date.now();interacted=true;}}
 ['pointerdown','touchstart','wheel','keydown'].forEach(function(e){listen(doc,e,activity);});
 function flush(){if(dirty){dirty=false;lastSaved=Date.now();options.save();}}
 function tick(){
  if(!alive)return;var now=Date.now(),delta=now-last;last=now;
  if(doc.visibilityState==='hidden'||(doc.hasFocus&&!doc.hasFocus())||!activeAt||now-activeAt>120000||delta>2500||delta<0){previous={};return;}
  var state=options.state();state.study=state.study||{};var record=state.study[options.id]||(state.study[options.id]={seen:{},sessions:{}});
  record.seen=record.seen||{};record.sessions=record.sessions||{};
  var head=doc.querySelector('.course-head'),pane=options.viewport,pr=pane&&pane.getBoundingClientRect(),top=Math.max((head?head.getBoundingClientRect().bottom:0),pr?pr.top+pane.clientTop:0),bottom=Math.min(root.innerHeight,pr?pr.top+pane.clientTop+pane.clientHeight:root.innerHeight),visible=false,all=!!units.length;
  units.forEach(function(u){
   var rect=u.el.getBoundingClientRect(),mask=cover(0,rect,top,bottom);
   if(mask)visible=true;
   // A part must remain visible across samples; fast scroll jumps do not complete it.
   var stable=mask&(previous[u.id]||0),before=record.seen[u.id]||0;
   if(stable&&(before|stable)!==before){record.seen[u.id]=before|stable;dirty=true;}
   previous[u.id]=mask;
   if((record.seen[u.id]||0)!==FULL)all=false;
  });
  if(visible){record.sessions[session]=(record.sessions[session]||0)+Math.min(1000,delta);dirty=true;}
  var end=options.end.getBoundingClientRect(),atEnd=end.top>=top&&end.top<=bottom;
  var complete=all&&atEnd&&endSeen;endSeen=atEnd;
  var count=units.filter(function(u){return record.seen[u.id]===FULL;}).length;
  options.update({parts:count,total:units.length,seconds:seconds(state.study),complete:complete});
  if(complete&&state.read.indexOf(options.index)<0){state.read.push(options.index);state.read.sort(function(a,b){return a-b;});dirty=true;options.completed();flush();}
  if(now-lastSaved>=5000)flush();
 }
 function pause(){flush();previous={};endSeen=false;last=Date.now();}
 listen(doc,'visibilitychange',pause);listen(root,'pagehide',pause);
 var timer=root.setInterval(tick,250);
 return {flush:flush,stop:function(discard){if(!alive)return;if(!discard)tick();alive=false;root.clearInterval(timer);listeners.forEach(function(x){x[0].removeEventListener(x[1],x[2]);});if(!discard)flush();},firstUnread:function(){var record=(options.state().study||{})[options.id]||{};var seen=record.seen||{};var u=units.find(function(u){return seen[u.id]!==FULL;});if(u){var mask=seen[u.id]||0,band=0;while(band<16&&(mask&(1<<band)))band++;return {el:u.el,part:(band+.5)/16};}return null;}};
}
var API={cover:cover,mergeStudy:mergeStudy,seconds:seconds,timeLabel:timeLabel,start:start,FULL:FULL};root.INSLeitura=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
