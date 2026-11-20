/* privacy.html: o índice lateral marca a seção que está sendo lida. */
(function () {
  var links = document.querySelectorAll('.pv-toc a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var current = null;
  function mark(id) {
    if (id === current || !byId[id]) return;
    if (current) byId[current].removeAttribute('aria-current');
    byId[id].setAttribute('aria-current', 'location');
    current = id;
  }
  // a seção ativa é a que cruza a faixa logo abaixo da barra do topo
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
  }, { rootMargin: '-120px 0px -65% 0px' });
  var ids = Object.keys(byId);
  ids.forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) io.observe(sec);
  });
  // a última seção é curta e nunca chega ao topo: no fim da página, marca ela
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) mark(ids[ids.length - 1]);
  }, { passive: true });
})();
