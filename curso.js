/* =====================================================================
   Academia Digital de Epidemiologia — registo de progresso do curso
   Liga ao mesmo Supabase do manual (projeto watlfdjcgfxmzymztmvc).
   A chave é publishable (pública por design; a proteção é a RLS).

   DESENHO/ENTREGA: regista resultados SEM bloquear o utilizador.
   O login/senha é activado no fim — este código já fica preparado:
   quando houver sessão autenticada, usa o utilizador real;
   enquanto não houver, usa um identificador local anónimo.
   Nunca lança erros para o ecrã (falha em silêncio + cópia local).
   ===================================================================== */
(function () {
  var URL = 'https://watlfdjcgfxmzymztmvc.supabase.co';
  var KEY = 'sb_publishable_ZxGOBZcm1IGp36e7Qh2nyg_S8Tb56B4';
  var sb = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(URL, KEY);
    }
  } catch (e) {}

  function pid() {
    try {
      var k = 'curso_pid', v = localStorage.getItem(k);
      if (!v) {
        v = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : ('anon-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return 'anon-' + Date.now(); }
  }

  function saveLocal(rec) {
    try {
      var q = JSON.parse(localStorage.getItem('curso_resultados') || '[]');
      q.push(rec);
      if (q.length > 500) q = q.slice(-500);
      localStorage.setItem('curso_resultados', JSON.stringify(q));
    } catch (e) {}
  }

  function insert(rec) {
    if (!sb) return;
    try {
      sb.from('curso_resultados').insert([rec]).then(function () {}, function () {});
    } catch (e) {}
  }

  // API pública: chamada no fim de cada módulo e no pré-teste
  window.cursoRegistarResultado = function (tipo, modulo, titulo, pontuacao, aprovado) {
    var base = {
      tipo: tipo || null,
      modulo: (modulo == null ? null : modulo),
      titulo: titulo || null,
      pontuacao: (pontuacao == null ? null : pontuacao),
      aprovado: (aprovado == null ? null : aprovado),
      criado_em: new Date().toISOString()
    };
    saveLocal(base);
    if (!sb) return;
    try {
      sb.auth.getUser().then(function (r) {
        var user = r && r.data && r.data.user;
        var rec = Object.assign({}, base, {
          participante_ref: user ? user.id : pid(),
          auth_id: user ? user.id : null,
          email: user ? user.email : null
        });
        insert(rec);
      }, function () {
        insert(Object.assign({}, base, { participante_ref: pid(), auth_id: null, email: null }));
      });
    } catch (e) {}
  };
})();
