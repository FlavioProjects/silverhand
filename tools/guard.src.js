/* Proteção leve contra cópia casual: bloqueia botão direito, seleção, cópia,
   atalhos de devtools/código-fonte/salvar/imprimir, e cobre a página enquanto
   o DevTools estiver aberto. Campos de formulário continuam funcionando. */
(function () {
  'use strict';
  var doc = document;
  function isField(t) {
    return t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]');
  }
  function block(e) { if (isField(e.target)) return; e.preventDefault(); e.stopPropagation(); return false; }

  ['contextmenu', 'copy', 'cut', 'selectstart', 'dragstart'].forEach(function (ev) {
    doc.addEventListener(ev, block, { capture: true });
  });

  doc.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' ||
        (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) ||
        (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u')) ||
        (mod && (k === 'u' || k === 's' || k === 'p'))) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    if (mod && (k === 'c' || k === 'a' || k === 'x') && !isField(e.target)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, { capture: true });

  function ready(fn) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var st = doc.createElement('style');
    st.textContent =
      'body *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
      'input,textarea,select,[contenteditable="true"]{-webkit-user-select:text;user-select:text}' +
      'img{-webkit-user-drag:none}' +
      '@media print{html,body{display:none!important}}' +
      '#__sh_cover{position:fixed;inset:0;z-index:2147483600;background:#0f1a14;display:none}';
    doc.head.appendChild(st);
    var cover = doc.createElement('div');
    cover.id = '__sh_cover';
    doc.body.appendChild(cover);
    var hidden = false;
    function show(on) { if (on !== hidden) { hidden = on; cover.style.display = on ? 'block' : 'none'; } }
    /* debugger só pausa com o DevTools aberto: se a pausa demorar, ele está aberto. */
    function check() {
      var t0 = performance.now();
      (function () { debugger; })();
      show(performance.now() - t0 > 100);
    }
    setInterval(check, 1000);
  });
})();
