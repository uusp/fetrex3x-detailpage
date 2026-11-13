/* Motion enhancement layer. Existing image and product-interaction scripts remain functional without it. */
(function (window, document) {
  'use strict';

  var gallery = document.querySelector('.hero .gallery');
  var image = document.getElementById('gallery-image');
  var thumbRail = gallery && gallery.querySelector('.thumbs');
  var thumbs = thumbRail ? Array.prototype.slice.call(thumbRail.querySelectorAll('.thumb')) : [];
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var classTimers = new WeakMap();
  var swapSequence = 0;
  var imageAnimationTimer = 0;
  var revealObserver = null;

  function reducedMotion() {
    return Boolean(motionQuery && motionQuery.matches);
  }

  function timersFor(element) {
    var timers = classTimers.get(element);
    if (!timers) {
      timers = Object.create(null);
      classTimers.set(element, timers);
    }
    return timers;
  }

  function clearPulse(element, className) {
    if (!element) return;
    var timers = timersFor(element);
    if (timers[className]) {
      window.clearTimeout(timers[className]);
      delete timers[className];
    }
    element.classList.remove(className);
  }

  function pulseClass(element, className, duration) {
    if (!element || reducedMotion()) return;
    var timers = timersFor(element);
    if (timers[className]) window.clearTimeout(timers[className]);

    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    timers[className] = window.setTimeout(function () {
      element.classList.remove(className);
      delete timers[className];
    }, duration);
  }

  function removeImageAnimation() {
    window.clearTimeout(imageAnimationTimer);
    if (image) image.classList.remove('fx-switch-in');
  }

  function animateIncomingImage(sequence) {
    if (!image || sequence !== swapSequence || reducedMotion()) return;

    var play = function () {
      if (sequence !== swapSequence || reducedMotion()) return;
      image.classList.remove('fx-switch-in');
      void image.offsetWidth;
      image.classList.add('fx-switch-in');
      imageAnimationTimer = window.setTimeout(removeImageAnimation, 820);
    };

    window.setTimeout(function () {
      if (sequence !== swapSequence || reducedMotion()) return;
      if (image.decode) {
        image.decode().catch(function () {}).then(play);
      } else {
        play();
      }
    }, 0);
  }

  if (gallery && image && thumbRail && thumbs.length) {
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('.thumb') : null;
      if (!target || !thumbRail.contains(target) || target.getAttribute('aria-pressed') === 'true') return;

      swapSequence += 1;
      var sequence = swapSequence;
      pulseClass(gallery, 'fx-main-swap', 880);
      animateIncomingImage(sequence);
    }, true);

    thumbRail.addEventListener('keydown', function (event) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) return;

      var current = thumbs.indexOf(document.activeElement);
      if (current === -1) return;

      var next = current;
      if (event.key === 'ArrowLeft') next = (current - 1 + thumbs.length) % thumbs.length;
      if (event.key === 'ArrowRight') next = (current + 1) % thumbs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = thumbs.length - 1;

      event.preventDefault();
      thumbs[next].focus({ preventScroll: true });
      thumbs[next].click();
    });
  }

  function interactionRoot(node) {
    if (!node) return null;
    if (node.nodeType === 1 && node.classList.contains('fetrex-pi')) return node;
    return node.closest ? node.closest('.fetrex-pi') : null;
  }

  document.addEventListener('fetrex:facechange', function (event) {
    var root = interactionRoot(event.target);
    if (!root) return;
    clearPulse(root, 'fx-feature-change');
    clearPulse(root, 'fx-section-arrive');
    pulseClass(root, 'fx-face-change', 980);
  });

  document.addEventListener('fetrex:featurechange', function (event) {
    var root = interactionRoot(event.target);
    if (!root) return;
    clearPulse(root, 'fx-face-change');
    clearPulse(root, 'fx-section-arrive');
    pulseClass(root, 'fx-feature-change', 720);
  });

  function observeInteractionSections() {
    if (!('IntersectionObserver' in window) || reducedMotion()) return;

    revealObserver = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.18 || reducedMotion()) return;
        revealObserver.unobserve(entry.target);
        pulseClass(entry.target, 'fx-section-arrive', 1180);
      });
    }, { threshold: [0.18, 0.32, 0.48] });

    Array.prototype.slice.call(document.querySelectorAll('.fetrex-pi')).forEach(function (root) {
      revealObserver.observe(root);
    });
  }

  function clearAllMotion() {
    swapSequence += 1;
    removeImageAnimation();
    clearPulse(gallery, 'fx-main-swap');
    Array.prototype.slice.call(document.querySelectorAll('.fetrex-pi')).forEach(function (root) {
      clearPulse(root, 'fx-face-change');
      clearPulse(root, 'fx-feature-change');
      clearPulse(root, 'fx-section-arrive');
    });
  }

  function handleMotionPreference() {
    if (reducedMotion()) clearAllMotion();
  }

  if (motionQuery) {
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionPreference);
    } else if (motionQuery.addListener) {
      motionQuery.addListener(handleMotionPreference);
    }
  }

  observeInteractionSections();
})(window, document);
