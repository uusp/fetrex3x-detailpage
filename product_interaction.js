/* Fetrex 3X product interaction. Copy is read from the supplied validated JSON. */
(function (global, document) {
  'use strict';

  var INSTANCE_KEY = '__fetrexProductInteraction';
  var FACE_ORDER = ['I', 'M', 'C'];
  var FALLBACK_IMAGE = 'product_front_lit.webp';
  var instanceSequence = 0;

  var IMAGE_BY_FEATURE = {
    I: {
      '量子护理': 'face_I_quantum.webp',
      '注氧雾化': 'face_I_mist.webp',
      '肌底红光': 'face_I_red.webp'
    },
    M: {
      'EMS增强': 'face_M_ems.webp',
      '水光导入': 'face_M_water.webp',
      '按摩激活': 'face_M_massage.webp',
      '三色光护': 'face_M_ems.webp'
    },
    C: {
      '急速冰肌': 'face_C_ice.webp',
      '面部清洁': 'face_C_clean.webp',
      '眼唇清洁': 'face_C_eye_lip.webp'
    }
  };

  var FACE_IMAGE = {
    I: 'face_I_quantum.webp',
    M: 'face_M_ems.webp',
    C: 'face_C_clean.webp'
  };

  var PHOTO_BY_FEATURE = {
    '量子护理': 'quantum.jpg',
    '注氧雾化': 'mist.jpg',
    '肌底红光': 'redlight.jpg',
    'EMS增强': 'ems.jpg',
    '水光导入': 'water.jpg',
    '按摩激活': 'massage.jpg',
    '痘印光护': 'spotlight.jpg',
    '舒缓光护': 'soothing.jpg',
    '亮肤光护': 'brightening.jpg',
    '亮泽光护': 'brightening.jpg',
    '三色光护': 'brightening.jpg',
    '急速冰肌': 'ice.jpg',
    '面部清洁': 'faceclean.jpg',
    '眼唇清洁': 'eyelip.jpg'
  };

  var scriptUrl = document.currentScript && document.currentScript.src;
  var defaultAssetBase = resolveUrl('./assets/', scriptUrl || document.baseURI);

  function resolveUrl(path, base) {
    try {
      return new URL(path, base).href;
    } catch (error) {
      return path;
    }
  }

  function resolveContainer(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container || container.nodeType !== 1) {
      throw new TypeError('mountProductInteraction: container must be an element or a selector that matches one.');
    }
    return container;
  }

  function normalizeData(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.details)) {
      throw new TypeError('mountProductInteraction: data.details must be the validated copy array.');
    }

    var groups = { I: [], M: [], C: [] };
    data.details.forEach(function (record) {
      var title = record && typeof record.title === 'string' ? record.title.trim() : '';
      var match = /^([IMC])\s*面\s*[·•]\s*(.+)$/u.exec(title);
      if (!match) return;
      var face = match[1];
      var item = {
        id: record.id,
        key: String(record.id),
        title: title,
        shortTitle: match[2].trim(),
        accessibleLabel: title,
        body: typeof record.body === 'string' ? record.body : '',
        note: typeof record.note === 'string' ? record.note : '',
        evidence: Array.isArray(record.evidence) ? record.evidence.slice() : [],
        image: (IMAGE_BY_FEATURE[face] && IMAGE_BY_FEATURE[face][match[2].trim()]) || FACE_IMAGE[face],
        photo: PHOTO_BY_FEATURE[match[2].trim()] || 'quantum.jpg'
      };

      if (face === 'M' && item.shortTitle === '三色光护') {
        ['痘印光护', '舒缓光护', '亮肤光护'].forEach(function (label, index) {
          groups[face].push(Object.assign({}, item, {
            key: String(record.id) + ':' + index,
            shortTitle: label,
            accessibleLabel: item.title + ' · ' + label,
            photo: PHOTO_BY_FEATURE[label]
          }));
        });
        return;
      }

      groups[face].push(item);
    });

    FACE_ORDER.forEach(function (face) {
      if (!groups[face].length) {
        throw new Error('mountProductInteraction: missing validated ' + face + '-face feature copy.');
      }
    });

    var mains = Array.isArray(data.mains) ? data.mains : [];
    var summary = mains.find(function (item) { return item && item.id === 2; }) || mains[0] || null;
    var lead = mains.find(function (item) { return item && item.id === 1; }) || summary;
    var assetBase = data.assetBase || data.__assetBase || defaultAssetBase;
    if (typeof assetBase !== 'string') assetBase = defaultAssetBase;
    assetBase = assetBase.charAt(assetBase.length - 1) === '/' ? assetBase : assetBase + '/';

    return {
      groups: groups,
      summaryTitle: summary && summary.title ? summary.title : groups.I[0].title,
      accessibleTitle: lead && lead.title ? lead.title : summary && summary.title ? summary.title : groups.I[0].title,
      assetBase: assetBase
    };
  }

  function buildFaceTab(instanceId, face, group) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fetrex-pi__tab';
    button.id = instanceId + '-tab-' + face;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', instanceId + '-panel');
    button.setAttribute('aria-label', group[0].title);
    button.dataset.face = face;

    var letter = document.createElement('span');
    letter.className = 'fetrex-pi__tab-letter';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = face;

    var copy = document.createElement('span');
    copy.className = 'fetrex-pi__tab-copy';
    copy.setAttribute('aria-hidden', 'true');

    var name = document.createElement('span');
    name.className = 'fetrex-pi__tab-name';
    name.textContent = group[0].shortTitle;

    var count = document.createElement('span');
    count.className = 'fetrex-pi__tab-count';
    count.textContent = String(group.length).padStart(2, '0');

    copy.appendChild(name);
    copy.appendChild(count);
    button.appendChild(letter);
    button.appendChild(copy);
    return button;
  }

  function createSkeleton(instanceId, normalized) {
    var root = document.createElement('section');
    root.className = 'fetrex-pi';
    root.lang = 'zh-CN';
    root.dataset.face = 'I';
    root.setAttribute('aria-label', normalized.accessibleTitle);
    root.innerHTML =
      '<div class="fetrex-pi__texture" aria-hidden="true"></div>' +
      '<header class="fetrex-pi__header">' +
        '<span class="fetrex-pi__wordmark">FETREX <strong>3X</strong></span>' +
        '<span class="fetrex-pi__summary" data-role="summary"></span>' +
      '</header>' +
      '<div class="fetrex-pi__body">' +
        '<nav class="fetrex-pi__rail">' +
          '<div class="fetrex-pi__tabs" role="tablist" data-role="tabs"></div>' +
          '<div class="fetrex-pi__rail-mark" aria-hidden="true"><span data-role="rail-index">01</span><i></i><span>03</span></div>' +
        '</nav>' +
        '<div class="fetrex-pi__stage">' +
          '<div class="fetrex-pi__halo" aria-hidden="true"></div>' +
          '<div class="fetrex-pi__orbit fetrex-pi__orbit--one" aria-hidden="true"></div>' +
          '<div class="fetrex-pi__orbit fetrex-pi__orbit--two" aria-hidden="true"></div>' +
          '<span class="fetrex-pi__face-ghost" aria-hidden="true" data-role="face-ghost">I</span>' +
          '<figure class="fetrex-pi__proof" aria-hidden="true"><img data-role="proof" alt="" decoding="async"></figure>' +
          '<div class="fetrex-pi__product-wrap">' +
            '<img class="fetrex-pi__product" data-role="product" alt="" decoding="async">' +
            '<span class="fetrex-pi__product-shadow" aria-hidden="true"></span>' +
          '</div>' +
        '</div>' +
        '<div class="fetrex-pi__panel" id="' + instanceId + '-panel" role="tabpanel" tabindex="0" aria-live="polite" data-role="panel">' +
          '<div class="fetrex-pi__panel-top">' +
            '<span class="fetrex-pi__sequence" data-role="sequence"></span>' +
            '<span class="fetrex-pi__hairline" aria-hidden="true"></span>' +
          '</div>' +
          '<h2 class="fetrex-pi__title" data-role="title"></h2>' +
          '<p class="fetrex-pi__description" data-role="body"></p>' +
          '<p class="fetrex-pi__note" data-role="note"></p>' +
          '<div class="fetrex-pi__features" data-role="features"></div>' +
        '</div>' +
      '</div>';
    return root;
  }

  function mountProductInteraction(container, data) {
    container = resolveContainer(container);
    var normalized = normalizeData(data);

    if (container[INSTANCE_KEY] && typeof container[INSTANCE_KEY].destroy === 'function') {
      container[INSTANCE_KEY].destroy();
    }

    var instanceId = 'fetrex-pi-' + (++instanceSequence);
    var root = createSkeleton(instanceId, normalized);
    var refs = {
      summary: root.querySelector('[data-role="summary"]'),
      tabs: root.querySelector('[data-role="tabs"]'),
      railIndex: root.querySelector('[data-role="rail-index"]'),
      faceGhost: root.querySelector('[data-role="face-ghost"]'),
      proof: root.querySelector('[data-role="proof"]'),
      product: root.querySelector('[data-role="product"]'),
      panel: root.querySelector('[data-role="panel"]'),
      sequence: root.querySelector('[data-role="sequence"]'),
      title: root.querySelector('[data-role="title"]'),
      body: root.querySelector('[data-role="body"]'),
      note: root.querySelector('[data-role="note"]'),
      features: root.querySelector('[data-role="features"]')
    };

    refs.summary.textContent = normalized.summaryTitle;
    var activeFace = 'I';
    var selectedByFace = Object.create(null);
    FACE_ORDER.forEach(function (face) {
      var tab = buildFaceTab(instanceId, face, normalized.groups[face]);
      refs.tabs.appendChild(tab);
      selectedByFace[face] = normalized.groups[face][0].key;
    });

    function assetUrl(fileName) {
      return resolveUrl(fileName, normalized.assetBase);
    }

    function findFeatureIndex(group, selector) {
      var byKey = group.findIndex(function (item) { return item.key === String(selector); });
      if (byKey !== -1) return byKey;
      var byId = group.findIndex(function (item) { return String(item.id) === String(selector); });
      if (byId !== -1) return byId;
      if (typeof selector === 'number' && Number.isFinite(selector)) {
        return Math.max(0, Math.min(group.length - 1, Math.trunc(selector)));
      }
      var byTitle = group.findIndex(function (item) { return item.title === selector || item.shortTitle === selector; });
      return byTitle === -1 ? 0 : byTitle;
    }

    function emit(name, detail) {
      root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail }));
    }

    function renderFeature(face, featureIndex, options) {
      options = options || {};
      var group = normalized.groups[face];
      featureIndex = Math.max(0, Math.min(group.length - 1, featureIndex));
      var feature = group[featureIndex];
      selectedByFace[face] = feature.key;

      refs.sequence.textContent = String(featureIndex + 1).padStart(2, '0') + ' / ' + String(group.length).padStart(2, '0');
      refs.title.textContent = feature.shortTitle;
      refs.body.textContent = feature.body;
      refs.note.textContent = feature.note;
      refs.note.hidden = !feature.note;

      var imageSource = assetUrl(feature.image);
      if (refs.product.getAttribute('src') !== imageSource) {
        refs.product.dataset.fallback = '';
        refs.product.src = imageSource;
        refs.product.classList.remove('is-entering');
        void refs.product.offsetWidth;
        refs.product.classList.add('is-entering');
      }
      refs.product.alt = feature.title;
      refs.proof.src = assetUrl('realuse/' + feature.photo);
      refs.proof.alt = feature.title;
      refs.panel.setAttribute('aria-labelledby', instanceId + '-tab-' + face);

      var featureButtons = group.map(function (item, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'fetrex-pi__feature';
        button.textContent = item.shortTitle;
        button.setAttribute('aria-pressed', index === featureIndex ? 'true' : 'false');
        button.setAttribute('aria-label', item.accessibleLabel);
        button.dataset.featureId = String(item.id);
        button.dataset.evidence = item.evidence.join(' ');
        button.addEventListener('click', function () {
          renderFeature(face, index, { source: 'feature' });
        });
        return button;
      });
      refs.features.replaceChildren();
      featureButtons.forEach(function (button) {
        refs.features.appendChild(button);
      });

      if (options.source === 'feature') {
        emit('fetrex:featurechange', { face: face, feature: feature, index: featureIndex });
      }
    }

    function renderFace(face, options) {
      options = options || {};
      if (FACE_ORDER.indexOf(face) === -1) face = activeFace;
      activeFace = face;
      root.dataset.face = face;
      refs.faceGhost.textContent = face;
      refs.railIndex.textContent = String(FACE_ORDER.indexOf(face) + 1).padStart(2, '0');

      var tabs = Array.prototype.slice.call(refs.tabs.querySelectorAll('[role="tab"]'));
      tabs.forEach(function (tab) {
        var isActive = tab.dataset.face === face;
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.tabIndex = isActive ? 0 : -1;
      });

      var group = normalized.groups[face];
      var featureIndex = findFeatureIndex(group, selectedByFace[face]);
      renderFeature(face, featureIndex, { source: 'face' });

      if (options.focusTab) {
        var activeTab = refs.tabs.querySelector('[data-face="' + face + '"]');
        if (activeTab) activeTab.focus();
      }
      emit('fetrex:facechange', { face: face, feature: group[featureIndex], index: featureIndex });
    }

    refs.tabs.addEventListener('keydown', function (event) {
      var key = event.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(key) === -1) return;
      event.preventDefault();
      var current = FACE_ORDER.indexOf(activeFace);
      var next = current;
      if (key === 'ArrowRight' || key === 'ArrowDown') next = (current + 1) % FACE_ORDER.length;
      if (key === 'ArrowLeft' || key === 'ArrowUp') next = (current - 1 + FACE_ORDER.length) % FACE_ORDER.length;
      if (key === 'Home') next = 0;
      if (key === 'End') next = FACE_ORDER.length - 1;
      renderFace(FACE_ORDER[next], { focusTab: true });
    });

    refs.tabs.addEventListener('click', function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (!tab || !refs.tabs.contains(tab)) return;
      renderFace(tab.dataset.face, { focusTab: false });
    });

    refs.product.addEventListener('error', function () {
      if (refs.product.dataset.fallback === '1') return;
      refs.product.dataset.fallback = '1';
      refs.product.src = assetUrl(FALLBACK_IMAGE);
    });

    function selectFace(face, options) {
      renderFace(String(face || '').toUpperCase(), options);
    }

    function selectFeature(selector) {
      renderFeature(activeFace, findFeatureIndex(normalized.groups[activeFace], selector), { source: 'api' });
    }

    function getState() {
      var group = normalized.groups[activeFace];
      var featureIndex = findFeatureIndex(group, selectedByFace[activeFace]);
      return { face: activeFace, featureIndex: featureIndex, feature: group[featureIndex] };
    }

    function destroy() {
      root.remove();
      if (container[INSTANCE_KEY] === api) delete container[INSTANCE_KEY];
    }

    container.replaceChildren(root);
    renderFace('I', { focusTab: false });

    var api = Object.freeze({
      element: root,
      selectFace: selectFace,
      selectFeature: selectFeature,
      getState: getState,
      destroy: destroy
    });
    container[INSTANCE_KEY] = api;
    return api;
  }

  global.mountProductInteraction = mountProductInteraction;
  global.FetrexProductInteraction = Object.freeze({ mount: mountProductInteraction });
})(window, document);
