// Tiny enhancement: current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

// ----- Multi-slideshow init (JSON manifest driven) -----
(function () {
  const roots = Array.from(document.querySelectorAll('.slideshow[data-manifest]'));
  if (!roots.length) return;

  for (const root of roots) boot(root);

  function boot(root) {
    const rawBase   = root.getAttribute('data-base') || 'assets/Family and Friends Event';
    const rawMan    = root.getAttribute('data-manifest');
    const slidesWrap= root.querySelector('.slides');
    const prevBtn   = root.querySelector('.nav.prev');
    const nextBtn   = root.querySelector('.nav.next');
    const dotsWrap  = root.querySelector('.dots');

    // Encode the manifest path by segments so spaces work
    const manifestUrl = rawMan.split('/').map(encodeURIComponent).join('/');

    fetch(manifestUrl)
      .then(r => {
        if (!r.ok) throw new Error(`Manifest fetch failed: ${r.status} ${r.statusText} @ ${manifestUrl}`);
        return r.json();
      })
      .then(files => {
        // Clear and build slide <img> tags
        slidesWrap.innerHTML = '';
        dotsWrap.innerHTML = '';

        const base = rawBase.split('/').map(encodeURIComponent).join('/');

        files.forEach(name => {
          const img = document.createElement('img');
          const url = `${base}/${encodeURIComponent(name)}`;
          img.src = url;
          img.alt = name;
          img.loading = 'lazy';
          img.className = 'slide';
          img.onerror = () => console.error('[SLIDESHOW] image 404:', url);
          slidesWrap.appendChild(img);
        });

        initSlideshow(root, dotsWrap);
      })
      .catch(err => {
        console.error('[SLIDESHOW] manifest error:', err);
        const p = document.createElement('p');
        p.textContent = `Could not load photos right now. (${err.message})`;
        p.style.color = 'var(--muted)';
        slidesWrap.replaceChildren(p);
      });
  }

  function initSlideshow(root, dotsWrap) {
    const slides = Array.from(root.querySelectorAll('.slide'));
    if (!slides.length) return;

    let index = 0;
    const AUTO_MS = 10000; // 10s per slide
    const FADE_MS = 1500;  // must match your CSS transition

    // Dots
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
    });

    function render() {
      slides.forEach((img, i) => img.classList.toggle('is-active', i === index));
      dotsWrap.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === index));
    }

    // Single-timeout autoplay (prevents stacked timers)
    let timer = null;
    const clearTimer   = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const scheduleNext = (delay = AUTO_MS) => { clearTimer(); timer = setTimeout(() => next(false), delay); };

    // Cooldown during fade to ignore spam clicks
    let isBusy = false;
    function go(i, userTriggered = false) {
      if (isBusy) return;
      isBusy = true;

      index = (i + slides.length) % slides.length;
      render();

      setTimeout(() => { isBusy = false; }, FADE_MS + 50);
      scheduleNext(AUTO_MS); // always wait the full interval after any change
    }

    const next = (u) => go(index + 1, u);
    const prev = (u) => go(index - 1, u);

    // Controls
    root.querySelector('.nav.prev')?.addEventListener('click', () => prev(true));
    root.querySelector('.nav.next')?.addEventListener('click', () => next(true));

    // Keyboard
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  prev(true);
      if (e.key === 'ArrowRight') next(true);
    });

    // Touch
    let x0 = null;
    root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend',   () => (x0 = null));
    root.addEventListener('touchmove', (e) => {
      if (x0 === null) return;
      const dx = e.touches[0].clientX - x0;
      if (Math.abs(dx) > 40) { (dx < 0 ? next(true) : prev(true)); x0 = null; }
    }, { passive: true });

    // Pause/resume
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
