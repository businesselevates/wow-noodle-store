/* HLT One homepage behaviour: scroll reveal, parallax, sliders, accordions, buy box, sticky bar, cross-sells.
   No dependencies. Re-initialises when sections are added or edited in the theme editor. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var designMode = !!(window.Shopify && window.Shopify.designMode);

  root.classList.add('hlt-js');

  /* ---------------- Scroll reveal ---------------- */
  var revealObserver = null;
  function initReveal(scope) {
    var items = scope.querySelectorAll('[data-hlt-reveal]:not(.is-in)');
    scope.querySelectorAll('[data-hlt-stagger]').forEach(function (group) {
      Array.prototype.forEach.call(group.querySelectorAll(':scope > [data-hlt-reveal]'), function (el, i) {
        el.style.setProperty('--hlt-i', i);
      });
    });
    if (reduceMotion || designMode || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    }
    items.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------- Parallax ---------------- */
  var parallaxEls = [];
  var ticking = false;
  function updateParallax() {
    ticking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var host = el.parentElement || el;
      var rect = host.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute('data-hlt-parallax')) || 0.12;
      var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (progress * speed * -100).toFixed(2) + 'px,0)';
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateParallax); }
  }
  function initParallax() {
    if (reduceMotion) return;
    parallaxEls = Array.prototype.slice.call(doc.querySelectorAll('[data-hlt-parallax]'));
    updateParallax();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------------- Sliders ---------------- */
  function initSliders(scope) {
    scope.querySelectorAll('[data-hlt-slider]').forEach(function (slider) {
      if (slider.__hlt) return;
      slider.__hlt = true;
      var track = slider.querySelector('.hlt-slider__track');
      var prev = slider.querySelector('[data-hlt-prev]');
      var next = slider.querySelector('[data-hlt-next]');
      if (!track) return;
      function step() {
        var first = Array.prototype.find.call(track.children, function (c) { return !c.hidden; });
        return first ? first.getBoundingClientRect().width + 16 : track.clientWidth;
      }
      function sync() {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max;
      }
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
      track.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
      slider.hltSync = sync;
    });
  }

  /* ---------------- Gallery (main swipe track + thumbnails) ---------------- */
  function initGalleries(scope) {
    scope.querySelectorAll('[data-hlt-gallery]').forEach(function (gallery) {
      if (gallery.__hlt) return;
      gallery.__hlt = true;
      var track = gallery.querySelector('[data-hlt-gallery-track]');
      if (!track) return;
      var thumbs = gallery.querySelectorAll('[data-hlt-thumb]');
      var dots = gallery.querySelector('[data-hlt-dots]');
      var strip = gallery.querySelector('.hlt-bb__thumbs');
      var painted = null;
      /* Swiping the main image drags the thumbnail strip along, so the marked
         thumbnail never ends up off screen. */
      function keepThumbInView(thumb) {
        if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;
        var t = thumb.getBoundingClientRect();
        var box = strip.getBoundingClientRect();
        if (t.left < box.left) strip.scrollBy({ left: t.left - box.left - 8, behavior: 'smooth' });
        else if (t.right > box.right) strip.scrollBy({ left: t.right - box.right + 8, behavior: 'smooth' });
      }
      function visibleSlides() {
        return Array.prototype.filter.call(track.children, function (s) { return !s.hidden; });
      }
      function current() {
        var slides = visibleSlides();
        var left = track.scrollLeft;
        var idx = 0;
        slides.forEach(function (s, i) { if (Math.abs(s.offsetLeft - track.offsetLeft - left) < s.clientWidth / 2) idx = i; });
        return slides[idx];
      }
      function paint() {
        var active = current();
        var id = active ? active.getAttribute('data-hlt-slide') : null;
        var moved = id !== painted;
        painted = id;
        thumbs.forEach(function (t) {
          var on = t.getAttribute('data-hlt-thumb') === id;
          t.setAttribute('aria-current', on ? 'true' : 'false');
          if (on && moved) keepThumbInView(t);
        });
        if (dots) {
          var slides = visibleSlides();
          dots.innerHTML = slides.map(function (s) {
            return '<span class="hlt-dot' + (s === active ? ' is-active' : '') + '"></span>';
          }).join('');
        }
      }
      thumbs.forEach(function (t) {
        t.addEventListener('click', function () {
          var slide = track.querySelector('[data-hlt-slide="' + t.getAttribute('data-hlt-thumb') + '"]');
          if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
        });
      });
      var viewAll = gallery.querySelector('[data-hlt-view-all]');
      if (viewAll) {
        viewAll.addEventListener('click', function () {
          var open = !gallery.classList.contains('is-expanded');
          gallery.classList.toggle('is-expanded', open);
          viewAll.setAttribute('aria-expanded', open ? 'true' : 'false');
          var lbl = viewAll.querySelector('[data-hlt-view-all-label]');
          if (lbl) lbl.textContent = viewAll.getAttribute(open ? 'data-hlt-label-less' : 'data-hlt-label-more') || lbl.textContent;
          if (!open) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      track.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
      gallery.hltReset = function () {
        track.scrollTo({ left: 0 });
        if (strip) strip.scrollTo({ left: 0 });
        painted = null;
        paint();
      };
      paint();
    });
  }

  /* ---------------- Accordions (smooth height) ---------------- */
  function initAccordions(scope) {
    scope.querySelectorAll('details.hlt-acc').forEach(function (d) {
      if (d.__hlt) return;
      d.__hlt = true;
      var summary = d.querySelector('summary');
      var body = d.querySelector('.hlt-acc__body');
      if (!summary || !body || reduceMotion) return;
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) {
          body.style.height = body.scrollHeight + 'px';
          requestAnimationFrame(function () {
            body.style.transition = 'height .4s cubic-bezier(.22,1,.36,1)';
            body.style.height = '0px';
          });
          setTimeout(function () { d.open = false; body.style.cssText = ''; }, 400);
        } else {
          d.open = true;
          var h = body.scrollHeight;
          body.style.height = '0px';
          requestAnimationFrame(function () {
            body.style.transition = 'height .45s cubic-bezier(.22,1,.36,1)';
            body.style.height = h + 'px';
          });
          setTimeout(function () { body.style.cssText = ''; }, 460);
        }
      });
    });
  }

  /* ---------------- Smooth scroll to buy box ---------------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('[data-hlt-scroll-to]');
    if (!link) return;
    var target = doc.querySelector(link.getAttribute('data-hlt-scroll-to'));
    if (!target) return;
    e.preventDefault();
    var header = doc.querySelector('.section-header');
    var offset = header ? header.offsetHeight + 16 : 16;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: reduceMotion ? 'auto' : 'smooth' });
    var focusEl = target.querySelector('[data-hlt-age][aria-pressed="true"]') || target;
    setTimeout(function () { focusEl.focus({ preventScroll: true }); }, 600);
  });

  /* ---------------- Cart ---------------- */
  function cartElement() {
    return doc.querySelector('cart-drawer') || doc.querySelector('cart-notification');
  }
  function addToCart(variantId, button, errorEl) {
    if (!variantId) return Promise.resolve();
    var cart = cartElement();
    var body = { id: Number(variantId), quantity: 1 };
    if (cart && typeof cart.getSectionsToRender === 'function') {
      body.sections = cart.getSectionsToRender().map(function (s) { return s.id; });
      body.sections_url = window.location.pathname;
    }
    if (button) { button.setAttribute('aria-busy', 'true'); button.classList.add('is-loading'); }
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
    var url = ((window.routes && window.routes.cart_add_url) || '/cart/add') + '.js';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.status) {
          if (errorEl) { errorEl.textContent = res.description || res.message; errorEl.hidden = false; }
          return;
        }
        if (cart && typeof cart.renderContents === 'function') {
          if (cart.classList.contains('is-empty')) cart.classList.remove('is-empty');
          cart.renderContents(res);
          var drawerEmpty = cart.querySelector('.drawer__inner-empty');
          if (drawerEmpty) cart.querySelector('.drawer__inner').classList.remove('is-empty');
        } else {
          window.location.href = (window.routes && window.routes.cart_url) || '/cart';
        }
        doc.dispatchEvent(new CustomEvent('hlt:cart-added', { detail: res }));
      })
      .catch(function () {
        if (errorEl) { errorEl.textContent = 'Something went wrong. Please try again.'; errorEl.hidden = false; }
      })
      .finally(function () {
        if (button) { button.removeAttribute('aria-busy'); button.classList.remove('is-loading'); }
      });
  }
  window.HLT = window.HLT || {};
  window.HLT.addToCart = addToCart;

  /* ---------------- Buy box ---------------- */
  function applyVisibility(state) {
    doc.querySelectorAll('[data-hlt-age-only]').forEach(function (el) {
      el.hidden = el.getAttribute('data-hlt-age-only').split(',').indexOf(state.age) === -1;
    });
    doc.querySelectorAll('[data-hlt-size-only]').forEach(function (el) {
      var match = el.getAttribute('data-hlt-size-only') === state.size;
      var ageOk = !el.hasAttribute('data-hlt-age-only') || el.getAttribute('data-hlt-age-only').split(',').indexOf(state.age) !== -1;
      el.hidden = !(match && ageOk);
    });
    doc.querySelectorAll('[data-hlt-text-age]').forEach(function (el) {
      var map = el.__map || (el.__map = JSON.parse(el.getAttribute('data-hlt-text-age')));
      if (map[state.age] != null) el.textContent = map[state.age];
    });
  }

  function initBuyBox(box) {
    if (box.__hlt) return;
    box.__hlt = true;
    var dataEl = box.querySelector('[data-hlt-bundle-data]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var ages = data.ages || [];
    if (!ages.length) return;
    var state = { age: ages[0].key, size: 'standard' };
    var addBtn = box.querySelector('[data-hlt-add-bundle]');
    /* Single-product mode prints the price twice, on its own line and on the
       button, so every copy is updated rather than only the first. */
    var priceEls = box.querySelectorAll('[data-hlt-btn-price]');
    var compareEls = box.querySelectorAll('[data-hlt-compare]');
    var compareWraps = box.querySelectorAll('[data-hlt-compare-wrap]');
    var saveEls = box.querySelectorAll('[data-hlt-save]');
    var saveWraps = box.querySelectorAll('[data-hlt-save-wrap]');
    var errorEl = box.querySelector('[data-hlt-error]');
    var gallery = box.querySelector('[data-hlt-gallery]');

    function ageData(key) { return ages.filter(function (a) { return a.key === key; })[0] || ages[0]; }
    function nextAge(key) {
      var i = ages.map(function (a) { return a.key; }).indexOf(key);
      return i > -1 && i < ages.length - 1 ? ages[i + 1] : null;
    }

    function render(silent) {
      var a = ageData(state.age);
      var v = a[state.size] || {};
      box.querySelectorAll('[data-hlt-age]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-hlt-age') === state.age ? 'true' : 'false');
      });
      box.querySelectorAll('[data-hlt-size]').forEach(function (b) {
        var on = b.getAttribute('data-hlt-size') === state.size;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.classList.toggle('is-selected', on);
      });
      applyVisibility(state);
      priceEls.forEach(function (el) { el.textContent = v.price || ''; });
      compareEls.forEach(function (el) { el.textContent = v.compare || ''; });
      compareWraps.forEach(function (el) { el.hidden = !v.compare; });
      saveEls.forEach(function (el) { el.textContent = v.save || ''; });
      saveWraps.forEach(function (el) { el.hidden = !v.save; });
      if (addBtn) {
        var unavailable = !v.id || v.available === false;
        addBtn.disabled = unavailable;
        addBtn.setAttribute('data-variant-id', v.id || '');
        var label = addBtn.querySelector('[data-hlt-btn-label]');
        if (label) label.textContent = unavailable ? (data.soldOutLabel || 'Sold out') : (data.addLabel || 'Add to cart');
        var wrap = addBtn.querySelector('[data-hlt-price-wrap]');
        if (wrap) wrap.hidden = unavailable;
      }
      var next = nextAge(state.age);
      doc.querySelectorAll('[data-hlt-add-next]').forEach(function (b) {
        b.setAttribute('data-hlt-variant', next && next.standard && next.standard.id ? next.standard.id : '');
        var card = b.closest('[data-hlt-next-card]');
        if (card) card.hidden = !next;
      });
      if (gallery && gallery.hltReset && !silent) gallery.hltReset();
      doc.querySelectorAll('[data-hlt-slider]').forEach(function (s) { if (s.hltSync) s.hltSync(); });
      doc.dispatchEvent(new CustomEvent('hlt:bundle-change', { detail: { age: state.age, size: state.size, variant: v, ages: ages } }));
    }

    box.addEventListener('click', function (e) {
      var ageBtn = e.target.closest('[data-hlt-age]');
      var sizeBtn = e.target.closest('[data-hlt-size]');
      if (ageBtn) { state.age = ageBtn.getAttribute('data-hlt-age'); render(); }
      if (sizeBtn) { state.size = sizeBtn.getAttribute('data-hlt-size'); render(); }
    });
    box.addEventListener('keydown', function (e) {
      var sizeBtn = e.target.closest('[data-hlt-size]');
      if (sizeBtn && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); sizeBtn.click(); }
    });
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addToCart(addBtn.getAttribute('data-variant-id'), addBtn, errorEl);
      });
    }

    box.hltSet = function (age, size) {
      if (age) state.age = age;
      if (size) state.size = size;
      render();
    };
    box.hltState = function () { return { age: state.age, size: state.size, variant: ageData(state.age)[state.size] }; };
    render(true);
  }

  /* ---------------- Cross-sell add buttons ---------------- */
  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-hlt-variant]');
    if (!btn || btn.closest('[data-hlt-buy-box]')) return;
    e.preventDefault();
    var err = btn.parentElement.querySelector('[data-hlt-error]');
    addToCart(btn.getAttribute('data-hlt-variant'), btn, err);
  });

  /* ---------------- Reviews: lead with the age-matched review ---------------- */
  doc.addEventListener('hlt:bundle-change', function (e) {
    doc.querySelectorAll('[data-hlt-reviews]').forEach(function (wrap) {
      var track = wrap.querySelector('.hlt-slider__track');
      if (!track) return;
      var ages = e.detail.ages || [];
      var position = ages.map(function (a) { return a.key; }).indexOf(e.detail.age) + 1;
      var lead = position > 0 ? track.querySelector('[data-lead-for="' + position + '"]') : null;
      var cards = Array.prototype.slice.call(track.children).sort(function (a, b) {
        return Number(a.getAttribute('data-order')) - Number(b.getAttribute('data-order'));
      });
      cards.forEach(function (c) { track.appendChild(c); });
      if (lead) track.insertBefore(lead, track.firstChild);
    });
  });

  /* ---------------- Boot ---------------- */
  function init(scope) {
    scope = scope || doc;
    initSliders(scope);
    initGalleries(scope);
    initAccordions(scope);
    scope.querySelectorAll('[data-hlt-buy-box]').forEach(initBuyBox);
    initReveal(scope);
    initParallax();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(doc); });
  else init(doc);

  doc.addEventListener('shopify:section:load', function (e) { init(e.target); });
  doc.addEventListener('shopify:section:reorder', function () { initParallax(); });
})();
