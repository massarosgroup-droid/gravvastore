/* Gravva — interacciones de las secciones propias */
(function () {
  if (window.__gvLoaded) return;
  window.__gvLoaded = true;

  function initReveal(root) {
    var els = (root || document).querySelectorAll('.gv-reveal:not(.is-in), .gv-hero:not(.is-in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function money(cents, format) {
    var value = (cents / 100).toFixed(2).replace('.', ',');
    return (format || '{{amount_with_comma_separator}} €').replace(/\{\{\s*\w+\s*\}\}/, value);
  }

  function initProduct(root) {
    var dataEl = root.querySelector('[data-gv-variants]');
    var variants = dataEl ? JSON.parse(dataEl.textContent) : [];
    var moneyFormat = root.getAttribute('data-money-format');
    var idInput = root.querySelector('[data-gv-id]');
    var priceEl = root.querySelector('[data-gv-price]');
    var stickyPrice = document.querySelector('[data-gv-sticky-price]');
    var addBtns = document.querySelectorAll('[data-gv-add]');
    var mainImg = root.querySelector('[data-gv-main] img');
    var thumbs = root.querySelectorAll('[data-gv-thumb]');

    function showImage(src, mediaId) {
      if (!mainImg || !src || mainImg.getAttribute('src') === src) return;
      mainImg.classList.add('is-fading');
      var pre = new Image();
      pre.onload = function () { mainImg.src = src; mainImg.removeAttribute('srcset'); mainImg.classList.remove('is-fading'); };
      pre.src = src;
      thumbs.forEach(function (t) { t.classList.toggle('is-active', mediaId ? t.getAttribute('data-media-id') === String(mediaId) : t.getAttribute('data-full') === src); });
    }

    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { showImage(t.getAttribute('data-full'), t.getAttribute('data-media-id')); });
    });

    function selected() {
      var opts = [];
      root.querySelectorAll('[data-gv-option]').forEach(function (group) {
        var sel = group.querySelector('.is-selected');
        opts.push(sel ? sel.getAttribute('data-value') : null);
      });
      return opts;
    }

    function update() {
      var opts = selected();
      var v = variants.find(function (x) { return x.options.every(function (o, i) { return o === opts[i]; }); });
      if (!v) return;
      idInput.value = v.id;
      var html = (v.compare && v.compare > v.price ? '<s>' + money(v.compare, moneyFormat) + '</s>' : '') + money(v.price, moneyFormat);
      if (priceEl) priceEl.innerHTML = html;
      if (stickyPrice) stickyPrice.textContent = money(v.price, moneyFormat);
      addBtns.forEach(function (b) {
        b.disabled = !v.available;
        b.textContent = v.available ? b.getAttribute('data-label') : b.getAttribute('data-soldout');
      });
      if (v.image) showImage(v.image, v.media);
      var url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url.toString());
    }

    root.querySelectorAll('[data-gv-option]').forEach(function (group) {
      var label = group.parentNode.querySelector('[data-gv-option-value]');
      group.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); });
          btn.classList.add('is-selected');
          btn.setAttribute('aria-pressed', 'true');
          if (label) label.textContent = btn.getAttribute('data-value');
          var box = root.querySelector('[data-gv-preview-box]');
          if (box && btn.getAttribute('data-hex')) box.style.backgroundColor = btn.getAttribute('data-hex');
          update();
        });
      });
    });

    // Nombre a grabar + vista previa
    var engrave = root.querySelector('[data-gv-engrave]');
    if (engrave) {
      var input = engrave.querySelector('input');
      var preview = engrave.querySelector('[data-gv-preview]');
      var count = engrave.querySelector('[data-gv-count]');
      var placeholder = preview ? preview.textContent : '';
      var refresh = function () {
        var val = input.value.trim();
        if (preview) preview.textContent = val || placeholder;
        if (count) count.textContent = input.value.length;
        if (val) engrave.classList.remove('has-error');
      };
      input.addEventListener('input', refresh);
      refresh();
      var form = root.querySelector('form[action*="/cart/add"]');
      if (form) {
        form.addEventListener('submit', function (e) {
          if (input.required && !input.value.trim()) {
            e.preventDefault();
            engrave.classList.add('has-error');
            input.focus();
            engrave.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }

    // Grabado dorado o plateado
    root.querySelectorAll('[data-metal]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var strong = root.querySelector('[data-gv-preview]');
        if (strong && radio.checked) strong.style.color = radio.getAttribute('data-metal');
      });
    });

    // Cantidad
    root.querySelectorAll('[data-gv-qty]').forEach(function (q) {
      var field = q.querySelector('input');
      q.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var n = parseInt(field.value, 10) || 1;
          n += b.getAttribute('data-step') === '-1' ? -1 : 1;
          field.value = Math.max(1, n);
        });
      });
    });

    // Barra fija en móvil
    var sticky = document.querySelector('[data-gv-sticky]');
    var mainAdd = root.querySelector('.gv-buy__add');
    if (sticky && mainAdd && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        sticky.classList.toggle('is-on', !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
      }).observe(mainAdd);
      sticky.querySelector('[data-gv-add]').addEventListener('click', function () {
        if (engrave && !engrave.querySelector('input').value.trim()) {
          engrave.scrollIntoView({ behavior: 'smooth', block: 'center' });
          engrave.classList.add('has-error');
          return;
        }
        mainAdd.click();
      });
    }
  }

  function boot(root) {
    initReveal(root);
    (root || document).querySelectorAll('[data-gv-product]').forEach(function (el) {
      if (el.dataset.gvReady) return;
      el.dataset.gvReady = '1';
      initProduct(el);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
  else boot();
  document.addEventListener('shopify:section:load', function (e) { boot(e.target); });
})();
