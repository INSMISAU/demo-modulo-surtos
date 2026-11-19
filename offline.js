(function () {
  'use strict';
  var box = document.getElementById('course-offline');
  var label = box && box.querySelector('[data-offline-status]');
  var button = box && box.querySelector('button');
  var progress = box && box.querySelector('progress');
  var registration = null, busy = false, checking = false, checkAgain = false;
  function show(text, retry) {
    if (label) label.textContent = text;
    if (button) { button.hidden = !retry; button.disabled = busy; }
    if (progress) progress.hidden = !busy;
  }
  function ask(worker, type) {
    return new Promise(function (resolve, reject) {
      var channel = new MessageChannel();
      var timeout = setTimeout(function () { channel.port1.close(); reject(new Error('No reply')); }, type === 'COURSE_OFFLINE_PREPARE' ? 180000 : 5000);
      channel.port1.onmessage = function (event) {
        clearTimeout(timeout); channel.port1.close();
        if (event.data && event.data.ok) resolve(event.data); else reject(new Error('Incomplete download'));
      };
      worker.postMessage({type: type}, [channel.port2]);
    });
  }
  async function check() {
    if (!registration || busy) return;
    if (checking) { checkAgain = true; return; }
    checking = true;
    try {
      if (registration.installing) { show('A descarregar o curso para este aparelho…', false); return; }
      if (registration.waiting) {
        var next = await ask(registration.waiting, 'COURSE_OFFLINE_STATUS');
        if (next.ready) { show('Actualização descarregada. Feche todas as abas deste curso e volte a abri-lo para utilizar a versão preparada.', false); return; }
      }
      if (!registration.active) { show('Ligue-se à internet para preparar o curso neste aparelho.', true); return; }
      var result = await ask(registration.active, 'COURSE_OFFLINE_STATUS');
      show(result.ready ? 'Pronto para usar sem internet neste aparelho: aulas, imagens, avaliações e manual em PDF.' : 'A preparação está incompleta. Com ligação à internet, tente novamente.', !result.ready);
    } catch (_) { show('Não foi possível confirmar a preparação. Com ligação à internet, tente novamente.', true); }
    finally { checking = false; if (checkAgain) { checkAgain = false; check(); } }
  }
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', function () { check(); });
  }
  async function start() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      show('Este navegador não permite preparar o curso sem internet. Utilize um navegador actualizado e abra o endereço seguro do curso.', false); return;
    }
    navigator.serviceWorker.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'COURSE_OFFLINE_PROGRESS') return;
      if (!registration || ![registration.installing, registration.waiting, registration.active].includes(event.source)) return;
      if (progress) { progress.max = event.data.total; progress.value = event.data.completed; }
      show('A descarregar o curso: ' + event.data.completed + ' de ' + event.data.total + ' recursos. Mantenha esta página aberta até terminar.', false);
      if (progress) progress.hidden = false;
    });
    navigator.serviceWorker.addEventListener('controllerchange', check);
    try {
      registration = await navigator.serviceWorker.register('sw.js', {updateViaCache: 'none'});
      registration.addEventListener('updatefound', function () { watch(registration.installing); check(); });
      watch(registration.installing);
      await check();
    } catch (_) {
      registration = await navigator.serviceWorker.getRegistration().catch(function () { return null; });
      if (registration) await check(); else show('Não foi possível preparar o curso. Confirme a ligação e tente novamente.', true);
    }
  }
  if (button) button.addEventListener('click', async function () {
    if (busy) return;
    if (!registration) { await start(); return; }
    busy = true; show('A preparar o curso. Mantenha esta página aberta até terminar.', false);
    try {
      await registration.update();
      if (registration.installing) return;
      if (registration.active && !registration.waiting) await ask(registration.active, 'COURSE_OFFLINE_PREPARE');
    } catch (_) { /* check() below reports completeness, never an assumed success. */ }
    finally { busy = false; await check(); }
  });
  window.addEventListener('online', check);
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, {once: true});
})();
