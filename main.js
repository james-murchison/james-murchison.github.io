/* ==========================================================================
   THE CARBONLESS SET — behaviour
   One authored motion: the highlighter wipes across the passages someone
   already marked. Everything else is state.
   ========================================================================== */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------------------
     The highlighter. The text is legible with or without it, so a failed
     observer costs the reader nothing but the gesture.
     ---------------------------------------------------------------------- */

  if (!reduced.matches && 'IntersectionObserver' in window) {
    var marked = [];
    document.querySelectorAll('mark').forEach(function (m) {
      var host = m.closest('p, span, .item-lede');
      if (host && marked.indexOf(host) === -1) { host.classList.add('js-mark'); marked.push(host); }
    });

    var markObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-marked');
          markObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.55, rootMargin: '0px 0px -10% 0px' });

    marked.forEach(function (h) { markObserver.observe(h); });

    /* If nothing has been marked shortly after load — a print job, a headless
       render, an observer that never fires — put the highlighter down anyway. */
    window.setTimeout(function () {
      marked.forEach(function (h) { h.classList.add('is-marked'); });
    }, 3000);
  }

  /* ----------------------------------------------------------------------
     The priorities — expanding items
     ---------------------------------------------------------------------- */

  document.querySelectorAll('.agenda__head').forEach(function (head) {
    var panel = document.getElementById(head.getAttribute('aria-controls'));
    if (!panel) return;

    head.addEventListener('click', function () {
      var open = head.getAttribute('aria-expanded') === 'true';

      if (open) {
        head.setAttribute('aria-expanded', 'false');
        if (reduced.matches) { panel.hidden = true; return; }
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(function () {
          panel.style.transition = 'height 320ms cubic-bezier(0.16,1,0.3,1)';
          panel.style.height = '0px';
        });
        panel.addEventListener('transitionend', function done() {
          panel.removeEventListener('transitionend', done);
          panel.hidden = true;
          panel.style.transition = panel.style.height = '';
        });
      } else {
        panel.hidden = false;
        head.setAttribute('aria-expanded', 'true');
        if (reduced.matches) return;
        var target = panel.scrollHeight;
        panel.style.height = '0px';
        requestAnimationFrame(function () {
          panel.style.transition = 'height 380ms cubic-bezier(0.16,1,0.3,1)';
          panel.style.height = target + 'px';
        });
        panel.addEventListener('transitionend', function done() {
          panel.removeEventListener('transitionend', done);
          panel.style.transition = panel.style.height = '';
        });
      }
    });
  });

  /* ----------------------------------------------------------------------
     Page tracking — the file tabs and the mobile page bar
     ---------------------------------------------------------------------- */

  var pages = Array.prototype.slice.call(document.querySelectorAll('[data-page]'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var barName = document.querySelector('[data-pgname]');

  if (pages.length) {
    var ticking = false;

    function setPage() {
      ticking = false;
      var mark = window.scrollY + window.innerHeight * 0.35;
      var current = pages[0];

      for (var i = 0; i < pages.length; i++) {
        if (pages[i].offsetTop <= mark) current = pages[i];
      }

      tabs.forEach(function (a) {
        if (a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });

      if (barName) barName.textContent = current.getAttribute('data-name');
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(setPage); }
    }, { passive: true });
    window.addEventListener('resize', setPage, { passive: true });
    setPage();
  }

  /* ----------------------------------------------------------------------
     Mobile contents
     ---------------------------------------------------------------------- */

  var toggle = document.querySelector('.pagebar__toggle');
  var index = document.getElementById('page-index');

  if (toggle && index) {
    function closeIndex() {
      index.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      index.hidden = open;
      toggle.setAttribute('aria-expanded', String(!open));
    });

    index.addEventListener('click', function (e) { if (e.target.closest('a')) closeIndex(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeIndex(); toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.target.closest('.pagebar')) return;
      closeIndex();
    });
  }

})();
