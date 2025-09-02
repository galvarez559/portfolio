// Tiny enhancement: current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

(function () {
  const roots = Array.from(document.querySelectorAll('.slideshow'));
  if (!roots.length) return;

  // Encode each path segment exactly once (avoids %2520 double-encoding)
  const encodePath = (p) =>
    p.split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/');

  for (const root of roots) {
    const rawMan    = root.getAttribute('data-manifest');
    const rawBase   = root.getAttribute('data-base') || 'assets';
    const slidesWrap= root.querySelector('.slides');
    const prevBtn   = root.querySelector('.nav.prev');
    const nextBtn   = root.querySelector('.nav.next');
    const dotsWrap  = root.querySelector('.dots');

    if (rawMan) {
      const manifestUrl = encodePath(rawMan);

      fetch(manifestUrl)
        .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.statusText} @ ${manifestUrl}`); return r.json(); })
        .then(files => {
          slidesWrap.innerHTML = '';
          dotsWrap && (dotsWrap.innerHTML = '');

          const base = encodePath(rawBase);

          files.forEach(name => {
            const img = document.createElement('img');
            img.src = `${base}/${encodeURIComponent(name)}`; // filenames encoded once
            img.alt = name;
            img.loading = 'lazy';
            img.className = 'slide';
            img.onerror = () => console.error('[SLIDESHOW] image 404:', img.src);
            slidesWrap.appendChild(img);
          });

          initSlideshow(root);
        })
        .catch(err => {
          console.error('[SLIDESHOW] manifest error:', err);
          const p = document.createElement('p');
          p.textContent = `Could not load photos right now. (${err.message})`;
          p.style.color = 'var(--muted)';
          slidesWrap.replaceChildren(p);
        });
    } else {
      if (root.querySelector('.slide')) initSlideshow(root);
    }
  }

  function initSlideshow(root) {
    const slides   = Array.from(root.querySelectorAll('.slide'));
    if (!slides.length) return;

    const prevBtn  = root.querySelector('.nav.prev');
    const nextBtn  = root.querySelector('.nav.next');
    const dotsWrap = root.querySelector('.dots');

    dotsWrap && (dotsWrap.innerHTML = '');
    slides.forEach((_, i) => {
      if (!dotsWrap) return;
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
    });

    let index = 0;
    const AUTO_MS = 10000;
    const FADE_MS = 1500;

    function render() {
      slides.forEach((img, i) => img.classList.toggle('is-active', i === index));
      if (dotsWrap) dotsWrap.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === index));
    }

    let timer = null;
    const clearTimer   = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const scheduleNext = (delay = AUTO_MS) => { clearTimer(); timer = setTimeout(() => next(false), delay); };

    let isBusy = false;
    function go(i, userTriggered = false) {
      if (isBusy) return;
      isBusy = true;
      index = (i + slides.length) % slides.length;
      render();
      setTimeout(() => { isBusy = false; }, FADE_MS + 50);
      scheduleNext(AUTO_MS);
    }
    const next = (u) => go(index + 1, u);
    const prev = (u) => go(index - 1, u);

    prevBtn && prevBtn.addEventListener('click', () => prev(true));
    nextBtn && nextBtn.addEventListener('click', () => next(true));

    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  prev(true);
      if (e.key === 'ArrowRight') next(true);
    });

    let x0 = null;
    root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend',   () => (x0 = null));
    root.addEventListener('touchmove', (e) => {
      if (x0 === null) return;
      const dx = e.touches[0].clientX - x0;
      if (Math.abs(dx) > 40) { (dx < 0 ? next(true) : prev(true)); x0 = null; }
    }, { passive: true });

    root.addEventListener('mouseenter', () => clearTimer());
    root.addEventListener('mouseleave', () => scheduleNext());
    root.addEventListener('focusin',   () => clearTimer());
    root.addEventListener('focusout',  () => scheduleNext());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimer(); else scheduleNext();
    });

    render();
    scheduleNext();
  }
})();