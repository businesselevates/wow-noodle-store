/* Dr. Hauschka Singapore: behaviour for the dh-* sections. No dependencies. */
(function () {
  'use strict';
  if (window.__dhLoaded) return;
  window.__dhLoaded = true;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cart ---------- */
  // Adds lines the way Horizon's own product form does: announce a CartLinesUpdateEvent,
  // post to the AJAX cart with the cart drawer's sections, then resolve the event so the cart
  // icon and drawer update, and open the drawer. (Shopify.actions.updateCart is not used: it
  // fails on this store's en-SG locale.) Without Horizon's events module it falls back to /cart.
  // Horizon's events module comes from an inline module script in snippets/dh-brand.liquid
  // (assets are minified to classic scripts, which cannot import it themselves).
  var events = null;
  function loadEvents() {
    if (!events) {
      events = new Promise(function (resolve) {
        if (window.DHEvents) return resolve(window.DHEvents);
        window.addEventListener('dh:events', function () { resolve(window.DHEvents); }, { once: true });
        window.setTimeout(function () { resolve(window.DHEvents || null); }, 4000);
      });
    }
    return events;
  }
  loadEvents();

  function cartRoot() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  function addLines(lines, source) {
    var sectionIds = Array.prototype.map
      .call(document.querySelectorAll('cart-items-component'), function (el) { return el.dataset.sectionId; })
      .filter(Boolean);
    var items = lines.map(function (l) {
      var item = { id: Number(l.id), quantity: l.quantity || 1 };
      if (l.attributes) {
        item.properties = {};
        l.attributes.forEach(function (a) { item.properties[a.key] = a.value; });
      }
      return item;
    });
    var body = { items: items };
    if (sectionIds.length) body.sections = sectionIds.join(',');

    return loadEvents().then(function (mod) {
      var Ev = mod && mod.CartLinesUpdateEvent;
      var deferred = Ev && Ev.createPromise ? Ev.createPromise() : null;
      if (Ev && deferred) {
        (source || document).dispatchEvent(
          new Ev({
            action: 'add',
            context: 'product',
            lines: lines.map(function (l) { return { merchandiseId: String(l.id), quantity: l.quantity || 1 }; }),
            promise: deferred.promise,
          })
        );
      }
      return fetch(cartRoot() + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
        .then(function (res) {
          if (!res.ok || res.json.status) {
            var err = new Error(res.json.description || res.json.message || 'Could not add to cart');
            if (deferred) deferred.reject(err);
            throw err;
          }
          if (!deferred) { window.location.href = cartRoot() + 'cart'; return; }
          return fetch(cartRoot() + 'cart.js', { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (cart) {
              deferred.resolve({
                cart: Ev.createCartFromAjaxResponse ? Ev.createCartFromAjaxResponse(cart) : cart,
                detail: { items: cart.items, source: 'dh-sections', sections: res.json.sections, didError: false },
              });
              var drawer = document.querySelector('theme-drawer#cart-drawer');
              if (drawer && typeof drawer.open === 'function') {
                window.setTimeout(function () { if (!drawer.isOpen) drawer.open(); }, 50);
              } else if (!document.querySelector('cart-items-component')) {
                // The cart page's own cart re-renders from the event above, so only leave other pages.
                window.location.href = cartRoot() + 'cart';
              }
            });
        });
    });
  }

  function withLoading(button, promise, errorEl) {
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    if (errorEl) errorEl.hidden = true;
    return promise
      .catch(function (e) {
        if (errorEl) { errorEl.textContent = e.message || 'Sorry, something went wrong. Please try again.'; errorEl.hidden = false; }
        else window.alert(e.message || 'Sorry, something went wrong.');
      })
      .finally(function () { button.classList.remove('is-loading'); button.removeAttribute('aria-busy'); });
  }

  /* ---------- Scheduled content (Singapore time) ---------- */
  // Elements with data-dh-start / data-dh-end ("2026-11-11T00:00") show only inside that window.
  // Preview another date with ?dh_date=2026-11-12 in the URL.
  function sgTime(value) {
    if (!value) return null;
    var v = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += 'T00:00';
    var t = Date.parse(v + ':00+08:00');
    return isNaN(t) ? null : t;
  }
  function inWindow(el, now) {
    var s = sgTime(el.getAttribute('data-dh-start'));
    var e = sgTime(el.getAttribute('data-dh-end'));
    if (s !== null && now < s) return false;
    if (e !== null && now > e + 59999) return false;
    return true;
  }
  function applySchedules(root) {
    var now = Date.now();
    var forced = new URLSearchParams(window.location.search).get('dh_date');
    if (forced) { var f = sgTime(forced); if (f !== null) now = f; }
    root.querySelectorAll('[data-dh-scheduled]').forEach(function (el) { el.hidden = !inWindow(el, now); });
    // A group shows its first visible member only (e.g. the buy box total).
    root.querySelectorAll('[data-dh-one-of]').forEach(function (group) {
      var shown = false;
      group.querySelectorAll(':scope > [data-dh-scheduled]').forEach(function (el) {
        if (!el.hidden && !shown) { shown = true; } else { el.hidden = true; }
      });
    });
  }

  /* ---------- Announcement bar ---------- */
  // Dated messages take over while they are live, so the 11.11 line swaps in and back on its
  // own. When no dated message is live, the everyday messages rotate, one at a time. Pauses on
  // hover and on focus; no rotation under reduced motion. Runs after applySchedules.
  function initAnnounce(bar) {
    if (bar.dataset.dhReady) return;
    bar.dataset.dhReady = '1';
    var all = Array.prototype.slice.call(bar.querySelectorAll(':scope > [data-dh-scheduled]'));
    var live = all.filter(function (p) { return !p.hidden; });
    var dated = live.filter(function (p) { return p.hasAttribute('data-dh-dated'); });
    var show = dated.length ? dated : live;
    all.forEach(function (p) { p.hidden = show.indexOf(p) === -1; });
    if (show.length < 2) return;
    var index = 0;
    var timer = null;
    var hovering = false;
    var delay = Math.max(4000, Number(bar.getAttribute('data-delay')) || 7000);

    function go(i) {
      index = (i + show.length) % show.length;
      show.forEach(function (p, n) { p.hidden = n !== index; });
      restart();
    }
    function restart() {
      window.clearTimeout(timer);
      if (!reduceMotion && !hovering) timer = window.setTimeout(function () { go(index + 1); }, delay);
    }
    bar.addEventListener('mouseenter', function () { hovering = true; window.clearTimeout(timer); });
    bar.addEventListener('mouseleave', function () { hovering = false; restart(); });
    bar.addEventListener('focusin', function () { hovering = true; window.clearTimeout(timer); });
    bar.addEventListener('focusout', function () { hovering = false; restart(); });
    go(0);
  }

  /* ---------- Product page buy box ---------- */
  function initBuyBox(root) {
    var form = root.querySelector('[data-dh-buy]');
    if (!form || form.dataset.dhReady) return;
    form.dataset.dhReady = '1';
    var radios = form.querySelectorAll('input[name="dh-option"]');
    var priceEl = root.querySelectorAll('[data-dh-price]');
    var labelEl = root.querySelectorAll('[data-dh-price-label]');
    var errorEl = form.querySelector('[data-dh-error]');
    var atc = form.querySelector('[data-dh-atc]');
    var sticky = root.querySelector('[data-dh-sticky]');
    var gallery = root.querySelector('.dh-gallery');
    var count = root.querySelector('[data-dh-gallery-count]');

    function current() { var r = form.querySelector('input[name="dh-option"]:checked'); return r ? r.closest('[data-dh-option]') : null; }

    function updateCount() {
      if (!gallery || !count) return;
      var items = Array.prototype.filter.call(gallery.children, function (c) { return !c.hidden; });
      var step = items[0] ? items[0].getBoundingClientRect().width + 8 : gallery.clientWidth;
      var i = Math.round(gallery.scrollLeft / Math.max(1, step));
      count.textContent = Math.min(i + 1, items.length) + ' / ' + items.length;
    }

    function sync() {
      var opt = current();
      if (!opt) return;
      var key = opt.getAttribute('data-dh-option');
      priceEl.forEach(function (el) { el.textContent = opt.getAttribute('data-price'); });
      labelEl.forEach(function (el) { el.textContent = opt.getAttribute('data-name'); });
      root.querySelectorAll('[data-dh-for]').forEach(function (el) {
        var keys = el.getAttribute('data-dh-for').split(',');
        el.hidden = keys.indexOf('all') === -1 && keys.indexOf(key) === -1;
      });
      var available = opt.getAttribute('data-available') === 'true';
      [atc, sticky && sticky.querySelector('[data-dh-sticky-atc]')].forEach(function (b) {
        if (!b) return;
        b.disabled = !available;
        b.textContent = available ? b.getAttribute('data-label') : b.getAttribute('data-soldout');
      });
      updateCount();
    }

    function add(button) {
      var opt = current();
      if (!opt) return;
      withLoading(button, addLines(JSON.parse(opt.getAttribute('data-lines') || '[]'), button), errorEl);
    }

    radios.forEach(function (r) { r.addEventListener('change', sync); });
    atc && atc.addEventListener('click', function (e) { e.preventDefault(); add(atc); });

    // Preselect from the URL: ?set=gift | giftbody | face
    var wanted = new URLSearchParams(window.location.search).get('set');
    if (wanted) {
      var match = form.querySelector('[data-dh-option="' + wanted.replace(/[^a-z0-9_-]/gi, '') + '"] input');
      if (match) match.checked = true;
    }

    gallery && gallery.addEventListener('scroll', function () { window.requestAnimationFrame(updateCount); }, { passive: true });

    // Sticky add to cart on phones, once the buy box button scrolls out of view
    if (sticky && atc && 'IntersectionObserver' in window) {
      var stickyBtn = sticky.querySelector('[data-dh-sticky-atc]');
      stickyBtn && stickyBtn.addEventListener('click', function (e) { e.preventDefault(); add(stickyBtn); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var past = !en.isIntersecting && en.boundingClientRect.top < 0;
          sticky.classList.toggle('is-visible', past);
          sticky.setAttribute('aria-hidden', past ? 'false' : 'true');
          if (stickyBtn) stickyBtn.tabIndex = past ? 0 : -1;
        });
      });
      io.observe(atc);
    }

    sync();
  }

  /* ---------- Add-to-cart buttons on product cards ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-dh-add]');
    if (!btn) return;
    e.preventDefault();
    withLoading(btn, addLines([{ id: btn.getAttribute('data-dh-add'), quantity: 1 }], btn));
  });

  /* ---------- Buttons that scroll to the buy box ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#dh-buybox"]');
    if (!a) return;
    var target = document.getElementById('dh-buybox');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    var first = target.querySelector('input[name="dh-option"]:checked');
    if (first) first.focus({ preventScroll: true });
  });

  /* ---------- Hero slideshow ---------- */
  function initHero(root) {
    var hero = root.matches && root.matches('[data-dh-hero]') ? root : root.querySelector('[data-dh-hero]');
    if (!hero || hero.dataset.dhReady) return;
    hero.dataset.dhReady = '1';
    var slides = Array.prototype.filter.call(hero.querySelectorAll('[data-dh-slide]'), function (s) { return !s.hidden; });
    var dotsWrap = hero.querySelector('[data-dh-dots]');
    var controls = hero.querySelector('[data-dh-controls]');
    if (slides.length < 2) {
      if (controls) controls.hidden = true;
      if (slides[0]) slides[0].classList.add('is-active');
      return;
    }
    var index = 0;
    var timer = null;
    var paused = reduceMotion;
    var hovering = false;
    var delay = Math.max(7000, Number(hero.getAttribute('data-delay') || 7000));
    var pauseBtn = hero.querySelector('[data-dh-pause]');

    dotsWrap.innerHTML = '';
    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'dh-hero__dot';
      d.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(d);
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.querySelectorAll('a, button').forEach(function (el) { el.tabIndex = on ? 0 : -1; });
      });
      dotsWrap.querySelectorAll('button').forEach(function (d, n) { d.setAttribute('aria-current', n === index ? 'true' : 'false'); });
      restart();
    }
    function restart() {
      window.clearTimeout(timer);
      if (!paused && !hovering) timer = window.setTimeout(function () { go(index + 1); }, delay);
    }
    function setPaused(p) {
      paused = p;
      if (pauseBtn) pauseBtn.textContent = p ? pauseBtn.getAttribute('data-play') : pauseBtn.getAttribute('data-pause');
      restart();
    }
    hero.querySelector('[data-dh-prev]').addEventListener('click', function () { go(index - 1); });
    hero.querySelector('[data-dh-next]').addEventListener('click', function () { go(index + 1); });
    pauseBtn && pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    hero.addEventListener('mouseenter', function () { hovering = true; window.clearTimeout(timer); });
    hero.addEventListener('mouseleave', function () { hovering = false; restart(); });
    hero.addEventListener('focusin', function () { hovering = true; window.clearTimeout(timer); });
    hero.addEventListener('focusout', function () { hovering = false; restart(); });
    hero.addEventListener('touchstart', function () { setPaused(true); }, { passive: true });
    if (reduceMotion && pauseBtn) pauseBtn.hidden = true;
    go(0);
  }

  /* ---------- Gift set picker tabs ---------- */
  function initTabs(root) {
    root.querySelectorAll('[data-dh-tabs]').forEach(function (wrap) {
      if (wrap.dataset.dhReady) return;
      wrap.dataset.dhReady = '1';
      var tabs = wrap.querySelectorAll('[role="tab"]');
      function select(tab) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          (t.getAttribute('aria-controls') || '').split(' ').forEach(function (id) {
            var p = id && document.getElementById(id);
            if (p) p.hidden = !on;
          });
        });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          next.focus();
          select(next);
        });
      });
    });
  }

  function init(root) {
    root = root || document;
    applySchedules(root);
    if (root.matches && root.matches('[data-dh-announce]')) initAnnounce(root);
    root.querySelectorAll('[data-dh-announce]').forEach(initAnnounce);
    if (root.matches && root.matches('[data-dh-pdp]')) initBuyBox(root);
    root.querySelectorAll('[data-dh-pdp]').forEach(initBuyBox);
    if (root.matches && root.matches('[data-dh-hero]')) initHero(root);
    root.querySelectorAll('[data-dh-hero]').forEach(initHero);
    initTabs(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);

  // Theme editor: re-run when a section is re-rendered
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
