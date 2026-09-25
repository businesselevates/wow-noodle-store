/* ==========================================================================
   HLT One - cart drawer cross-sell ("Picked just for you").

   WHY THIS IS WRITTEN THE WAY IT IS
   ---------------------------------
   The cart drawer is re-rendered from the server on every cart change, and each
   of the three paths throws away the DOM this script writes into:

     1. CartDrawer.renderContents()      -> #CartDrawer.innerHTML = ...
        (used by hlt-home.js addToCart, i.e. every "+ Add" in here)
     2. CartDrawerItems.updateQuantity() -> .drawer__inner.innerHTML = ...
        (quantity steppers and the remove button)
     3. CartDrawerItems.onCartUpdate()   -> replaceWith() on `cart-drawer-items`
        and `.cart-drawer__footer` (a cartUpdate published by another section,
        e.g. a product form)

   The Liquid block lives inside `.cart-drawer__footer`, which is the only spot
   that is rebuilt by ALL THREE paths. So after any cart change the block comes
   back from the server with a freshly rendered config (current cart line item
   ids, current seed product) - but with no event listeners and an empty track.

   A one-shot DOMContentLoaded would therefore populate the carousel exactly
   once and never again. Instead a MutationObserver watches the <cart-drawer>
   element (which is never itself replaced) and re-runs init on any block it has
   not initialised yet. Each freshly rendered block is a brand new element, so
   the `__hltUpsellInit` expando is absent and it gets initialised; the block we
   just populated still carries the flag, so our own writes cannot loop.

   The "+ Add" buttons need no re-binding at all: they carry `data-hlt-variant`,
   which assets/hlt-home.js already handles with a single document-level
   delegated listener that outlives every re-render. That handler calls
   window.HLT.addToCart(), which posts to /cart/add.js and calls renderContents,
   so the new line item and the totals refresh themselves.
   ========================================================================== */
(function () {
  'use strict';

  var ROOT_SELECTOR = '[data-hlt-upsell]';
  var TRACK_SELECTOR = '[data-hlt-upsell-track]';
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Recommendation responses are cached for the life of the page, keyed by
     seed product + intent, so re-rendering the drawer does not re-hit the API.
     Exclusion is re-applied on every render against the current cart. */
  var recommendationCache = {};

  /* ---------------- Helpers ---------------- */

  function readConfig(root) {
    var el = root.querySelector('[data-hlt-upsell-config]');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  /* Mirrors Shopify's formatMoney so prices coming from the recommendations
     JSON (which are integer cents) match the ones Liquid rendered. */
  function formatMoney(cents, format) {
    var formatString = format || '${{amount}}';
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;

    if (typeof cents === 'string') cents = cents.replace('.', '');
    var amount = Number(cents);
    if (isNaN(amount)) return '';

    function withDelimiters(precision, thousands, decimal) {
      thousands = thousands === undefined ? ',' : thousands;
      decimal = decimal === undefined ? '.' : decimal;
      var number = (amount / 100.0).toFixed(precision);
      var parts = number.split('.');
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      return whole + (parts[1] ? decimal + parts[1] : '');
    }

    var match = formatString.match(placeholder);
    var value;
    switch (match && match[1]) {
      case 'amount_no_decimals':
        value = withDelimiters(0);
        break;
      case 'amount_with_comma_separator':
        value = withDelimiters(2, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        value = withDelimiters(2, "'", '.');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = withDelimiters(0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = withDelimiters(0, ' ');
        break;
      case 'amount_with_space_separator':
        value = withDelimiters(2, ' ', ',');
        break;
      case 'amount_with_period_and_space_separator':
        value = withDelimiters(2, ' ', '.');
        break;
      default:
        value = withDelimiters(2);
    }
    return formatString.replace(placeholder, value);
  }

  function sizedImage(url, width) {
    if (!url) return '';
    if (url.indexOf('//') === 0) url = 'https:' + url;
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'width=' + width;
  }

  /* "add the first available variant, and don't show a product that has no
     purchasable variant" */
  function firstAvailableVariant(product) {
    var variants = product && product.variants;
    if (!variants || !variants.length) return null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i] && variants[i].available) return variants[i];
    }
    return null;
  }

  /* Turns a product from /recommendations/products.json into the same shape the
     Liquid fallback already emits. Returns null when nothing is purchasable. */
  function normalise(product, moneyFormat) {
    var variant = firstAvailableVariant(product);
    if (!variant) return null;

    var subtitle = '';
    if (product.variants.length > 1 && variant.title && variant.title !== 'Default Title') {
      subtitle = variant.title;
    } else if (product.type) {
      subtitle = product.type;
    }

    var image = '';
    if (variant.featured_image && variant.featured_image.src) image = variant.featured_image.src;
    else if (typeof product.featured_image === 'string') image = product.featured_image;
    else if (product.featured_image && product.featured_image.src) image = product.featured_image.src;
    else if (product.images && product.images.length) image = product.images[0];

    return {
      id: product.id,
      title: product.title,
      subtitle: subtitle,
      price: formatMoney(variant.price, moneyFormat),
      image: sizedImage(image, 240),
      url: product.url || '/products/' + product.handle,
      variantId: variant.id
    };
  }

  /* ---------------- Step 1: Shopify's recommendations ---------------- */

  function fetchRecommendations(config, intent) {
    var key = config.seedId + '|' + intent;
    if (recommendationCache[key]) return recommendationCache[key];

    var base = config.recUrl || '/recommendations/products';
    var url =
      base + '.json?product_id=' + encodeURIComponent(config.seedId) + '&intent=' + intent + '&limit=' + config.limit;

    var request = fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        return (data && data.products) || [];
      })
      .catch(function () {
        return [];
      });

    recommendationCache[key] = request;
    return request;
  }

  /* ---------------- Steps 2-4: exclude, cap, decide ---------------- */

  function usableCards(products, config) {
    var out = [];
    var seen = {};
    for (var i = 0; i < products.length && out.length < config.limit; i++) {
      var card = normalise(products[i], config.moneyFormat);
      if (!card) continue;
      if (config.cartIds.indexOf(card.id) !== -1) continue; // already in the cart
      if (seen[card.id]) continue;
      seen[card.id] = true;
      out.push(card);
    }
    return out;
  }

  /* The collection fallback is rendered by Liquid, so its prices and image URLs
     are already correct; it only needs the same exclude-and-cap treatment. */
  function fallbackCards(config) {
    var out = [];
    var list = config.fallback || [];
    for (var i = 0; i < list.length && out.length < config.limit; i++) {
      if (config.cartIds.indexOf(list[i].id) !== -1) continue;
      out.push(list[i]);
    }
    return out;
  }

  function chooseCards(config) {
    if (!config.seedId) return Promise.resolve(fallbackCards(config));

    return fetchRecommendations(config, 'complementary').then(function (complementary) {
      var cards = usableCards(complementary, config);
      if (cards.length) return cards;

      // Nothing usable - retry once with the broader intent.
      return fetchRecommendations(config, 'related').then(function (related) {
        var relatedCards = usableCards(related, config);
        return relatedCards.length ? relatedCards : fallbackCards(config);
      });
    });
  }

  /* ---------------- Rendering ---------------- */

  function plusIcon(root) {
    var template = root.querySelector('[data-hlt-upsell-plus]');
    if (template && template.content && template.content.firstElementChild) {
      return template.content.firstElementChild.cloneNode(true);
    }
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = '+';
    return span;
  }

  function buildCard(card, config, root) {
    var item = document.createElement('li');
    item.className = 'hlt-upsell__card';

    if (card.image) {
      var media = document.createElement('a');
      media.className = 'hlt-upsell__media';
      media.href = card.url;
      media.tabIndex = -1;
      media.setAttribute('aria-hidden', 'true');

      var img = document.createElement('img');
      img.src = card.image;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 122;
      img.height = 122;
      media.appendChild(img);
      item.appendChild(media);
    }

    var name = document.createElement('a');
    name.className = 'hlt-upsell__name';
    name.href = card.url;
    name.textContent = card.title;
    item.appendChild(name);

    if (card.subtitle) {
      var sub = document.createElement('span');
      sub.className = 'hlt-upsell__sub';
      sub.textContent = card.subtitle;
      item.appendChild(sub);
    }

    var price = document.createElement('span');
    price.className = 'hlt-upsell__price';
    price.textContent = card.price;
    item.appendChild(price);

    /* hlt-home.js looks for the error element as a SIBLING of the button
       (btn.parentElement.querySelector('[data-hlt-error]')), so both live in
       this wrapper. */
    var actions = document.createElement('div');
    actions.className = 'hlt-upsell__actions';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'hlt-upsell__add';
    button.setAttribute('data-hlt-variant', card.variantId);
    button.setAttribute('aria-label', config.addLabel + ' ' + card.title);
    button.appendChild(plusIcon(root));

    var label = document.createElement('span');
    label.textContent = config.addLabel;
    button.appendChild(label);
    actions.appendChild(button);

    var error = document.createElement('p');
    error.className = 'hlt-upsell__error';
    error.setAttribute('data-hlt-error', '');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    actions.appendChild(error);

    item.appendChild(actions);
    return item;
  }

  /* ---------------- Carousel ---------------- */

  function syncArrows(track) {
    var root = track.closest ? track.closest(ROOT_SELECTOR) : null;
    if (!root) return;
    var prev = root.querySelector('[data-hlt-upsell-prev]');
    var next = root.querySelector('[data-hlt-upsell-next]');
    var max = track.scrollWidth - track.clientWidth - 2;
    var scrollable = max > 0;
    if (prev) prev.disabled = !scrollable || track.scrollLeft <= 2;
    if (next) next.disabled = !scrollable || track.scrollLeft >= max;
  }

  function stepSize(track) {
    var card = track.querySelector('.hlt-upsell__card');
    if (!card) return track.clientWidth;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap);
    if (isNaN(gap)) gap = 10;
    return card.getBoundingClientRect().width + gap;
  }

  function scrollTrack(track, direction) {
    var left = stepSize(track) * direction;
    if (track.scrollBy) track.scrollBy({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
    else track.scrollLeft += left;
  }

  function wireCarousel(root, track) {
    var prev = root.querySelector('[data-hlt-upsell-prev]');
    var next = root.querySelector('[data-hlt-upsell-next]');

    if (prev) {
      prev.addEventListener('click', function () {
        scrollTrack(track, -1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        scrollTrack(track, 1);
      });
    }

    /* Bound to the track, which is discarded along with the rest of the block
       on the next render, so these never accumulate. */
    track.addEventListener(
      'scroll',
      function () {
        window.requestAnimationFrame(function () {
          syncArrows(track);
        });
      },
      { passive: true }
    );
  }

  /* ---------------- Init ---------------- */

  function init(root) {
    var config = readConfig(root);
    if (!config || !config.enabled) return;

    var track = root.querySelector(TRACK_SELECTOR);
    if (!track) return;

    config.cartIds = config.cartIds || [];
    config.limit = config.limit || 4;
    config.addLabel = config.addLabel || 'Add';

    chooseCards(config).then(function (cards) {
      // Nothing to show: leave the block hidden rather than render an empty
      // heading or a skeleton.
      if (!cards.length) return;
      // The drawer may have been re-rendered while the request was in flight;
      // the replacement block runs its own init (served from the cache).
      if (root.isConnected === false) return;

      var fragment = document.createDocumentFragment();
      cards.forEach(function (card) {
        fragment.appendChild(buildCard(card, config, root));
      });

      track.innerHTML = '';
      track.appendChild(fragment);
      root.hidden = false;

      wireCarousel(root, track);
      window.requestAnimationFrame(function () {
        syncArrows(track);
      });
    });
  }

  /* ---------------- Re-render handling ---------------- */

  var scanQueued = false;

  function scan() {
    scanQueued = false;
    var roots = document.querySelectorAll(ROOT_SELECTOR);
    for (var i = 0; i < roots.length; i++) {
      if (roots[i].__hltUpsellInit) continue;
      roots[i].__hltUpsellInit = true;
      init(roots[i]);
    }
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(scan, 0);
  }

  function observeDrawer() {
    var drawer = document.querySelector('cart-drawer');
    if (!drawer) return false;
    // <cart-drawer> itself is never replaced - only its contents - so one
    // observer on it covers all three re-render paths.
    new MutationObserver(queueScan).observe(drawer, { childList: true, subtree: true });
    return true;
  }

  function boot() {
    if (!observeDrawer()) {
      var watcher = new MutationObserver(function () {
        if (observeDrawer()) {
          watcher.disconnect();
          queueScan();
        }
      });
      watcher.observe(document.documentElement, { childList: true, subtree: true });
    }
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* One listener for the life of the page, resolving the current track each
     time, so repeated re-renders cannot leak resize handlers. */
  window.addEventListener('resize', function () {
    var tracks = document.querySelectorAll(TRACK_SELECTOR);
    for (var i = 0; i < tracks.length; i++) syncArrows(tracks[i]);
  });
})();
