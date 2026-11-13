/* Premium interaction layer: header state, reveal, chapter rail, hero parallax, face-swap choreography. */
(function (window, document) {
  'use strict';

  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return Boolean(reduce && reduce.matches); }

  /* ---------- header + progress ---------- */
  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.header-progress i');
  var dock = document.querySelector('.dock');
  var hero = document.querySelector('.hero');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-solid', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (dock) dock.classList.toggle('is-visible', y > window.innerHeight * 0.75);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- hero parallax ---------- */
  var tilt = document.querySelector('.stage-tilt');
  var copy = document.querySelector('.hero-copy');
  if (hero && tilt && !reduced() && window.matchMedia('(pointer:fine)').matches) {
    var raf = 0;
    hero.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = hero.getBoundingClientRect();
        var mx = (e.clientX - r.left) / r.width - 0.5;
        var my = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--mx', mx.toFixed(3));
        tilt.style.setProperty('--my', my.toFixed(3));
        if (copy) copy.style.transform = 'translate3d(' + (mx * -10).toFixed(1) + 'px,' + (my * -6).toFixed(1) + 'px,0)';
      });
    });
    hero.addEventListener('pointerleave', function () {
      tilt.style.setProperty('--mx', 0);
      tilt.style.setProperty('--my', 0);
      if (copy) copy.style.transform = '';
    });
  }

  /* ---------- reveal ---------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduced()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- detail entrance ---------- */
  var details = Array.prototype.slice.call(document.querySelectorAll('.detail'));
  if ('IntersectionObserver' in window) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-in');
      });
    }, { threshold: 0.06 });
    details.forEach(function (el) { dio.observe(el); });
  } else {
    details.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- chapter rail ---------- */
  var railLinks = Array.prototype.slice.call(document.querySelectorAll('.chapter-rail a'));
  var railTargets = railLinks.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return document.getElementById(id);
  });
  function railUpdate() {
    var mid = window.innerHeight * 0.42;
    var active = 0;
    railTargets.forEach(function (t, i) {
      if (!t) return;
      if (t.getBoundingClientRect().top <= mid) active = i;
    });
    railLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
  }
  if (railLinks.length) {
    window.addEventListener('scroll', railUpdate, { passive: true });
    railUpdate();
  }

  /* ---------- face / feature choreography ---------- */
/* ---------- detail counter ---------- */
  var counter = document.querySelector('.detail-counter');
  var counterNow = document.getElementById('detail-now');
  var detailEls = Array.prototype.slice.call(document.querySelectorAll('.detail'));
  function counterTick() {
    if (!counter || !detailEls.length) return;
    var mid = window.innerHeight * 0.5;
    var idx = -1;
    detailEls.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) idx = i;
    });
    counter.classList.toggle('is-on', idx >= 0);
    if (idx >= 0 && counterNow) counterNow.textContent = String(idx + 1).padStart(2, '0');
  }
  window.addEventListener('scroll', counterTick, { passive: true });
  counterTick();
  /* ---------- scroll-driven structure sequence ---------- */
  var structure = document.querySelector('.structure');
  var views = Array.prototype.slice.call(document.querySelectorAll('.structure-view'));
  var stepEls = Array.prototype.slice.call(document.querySelectorAll('.structure-steps span'));
  var structureBar = document.getElementById('structure-bar');
  var structureStep = document.getElementById('structure-step');
  var structureTitle = document.getElementById('structure-title');
  var structureBody = document.getElementById('structure-body');
  var ghostLetter = document.getElementById('structure-ghost-letter');
  var STRUCTURE_COPY = [
    { step: '01 · FRONT', title: '正面视图', body: '三面头部可旋转切换，正面朝向时为一种护理面。' },
    { step: '02 · SIDE', title: '侧面视图', body: '头部旋转后换到另一护理面，机身握持角度保持一致。' },
    { step: '03 · BACK', title: '背面视图', body: '三个护理面围绕同一旋转结构，切换时无需更换配件。' }
  ];
  var structureState = -1;

  function structureTick() {
    if (!structure) return;
    var r = structure.getBoundingClientRect();
    var span = structure.offsetHeight - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    if (structureBar) structureBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    var idx = p < 0.3 ? 0 : p < 0.62 ? 1 : 2;
    if (idx === structureState) return;
    structureState = idx;
    views.forEach(function (v, i) {
      var on = i === idx;
      v.style.opacity = on ? '1' : '0';
      v.style.transform = on ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,' + (i < idx ? -22 : 22) + 'px,0) scale(.96)';
      v.style.transition = 'opacity .7s cubic-bezier(.22,.8,.24,1), transform .9s cubic-bezier(.22,.8,.24,1)';
    });
    stepEls.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
    var copy = STRUCTURE_COPY[idx];
    if (structureStep) structureStep.textContent = copy.step;
    if (structureTitle) structureTitle.textContent = copy.title;
    if (structureBody) structureBody.textContent = copy.body;
    if (ghostLetter) {
      ghostLetter.textContent = idx === 0 ? '1' : idx === 1 ? '2' : '3';
      ghostLetter.style.opacity = '1';
    }
  }
  if (structure) {
    window.addEventListener('scroll', structureTick, { passive: true });
    window.addEventListener('resize', function () { structureState = -1; structureTick(); });
    structureTick();
  }
  function rootOf(node) {
    if (!node) return null;
    if (node.nodeType === 1 && node.classList.contains('fetrex-pi')) return node;
    return node.closest ? node.closest('.fetrex-pi') : null;
  }
  var pulseTimers = new WeakMap();
  function pulse(el, cls, ms) {
    if (!el || reduced()) return;
    var prev = pulseTimers.get(el);
    if (prev) window.clearTimeout(prev);
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    pulseTimers.set(el, window.setTimeout(function () { el.classList.remove(cls); }, ms));
  }
  document.addEventListener('fetrex:facechange', function (e) {
    var root = rootOf(e.target);
    if (!root) return;
    pulse(root, 'is-face-swap', 1000);
  });
  document.addEventListener('fetrex:featurechange', function (e) {
    var root = rootOf(e.target);
    if (!root) return;
    pulse(root, 'is-feature-swap', 700);
  });
})(window, document);
