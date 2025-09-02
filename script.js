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
    const basePath   = root.getAttribute('data-base') || 'assets/Family and Freinds Event';
    const manifest   = root.getAttribute('data-manifest');
    const slidesWrap = root.querySelector('.slides');
    const prevBtn    = root.querySelector('.nav.prev');
    const nextBtn    = root.querySelector('.nav.next');
    const dotsWrap   = root.querySelector('.dots');

    fetch(manifest)
      .then(r => {
        if (!r.ok) throw new Error(`Manifest fetch failed: ${r.status} ${r.statusText} @ ${manifest}`);
        return r.json();
      })
      .then(files => {
        // ... same as before
      })
      .catch(err => {
        console.error('Slideshow manifest load error:', err);
        const p = document.createElement('p');
        p.textContent = `Could not load photos right now. (${err.message})`;
        p.style.color = 'var(--muted)';
        slidesWrap.replaceChildren(p);
      });

        initSlideshow(root);
      })
      .catch(err => {
        console.error(err);
        const p = document.createElement('p');
        p.textContent = 'Could not load photos right now.';
        p.style.color = 'var(--muted)';
        slidesWrap.replaceChildren(p);
      });

    function initSlideshow(root) {
      const slides = Array.from(root.querySelectorAll('.slide'));
      if (!slides.length) return;

      let index = 0;
      const AUTO_MS = 10000;  // your 10s per slide
      const FADE_MS = 1500;   // match CSS

      // build dots
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

      // single-timeout autoplay (no stacking)
      let timer = null;
      const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
      const scheduleNext = (delay = AUTO_MS) => { clearTimer(); timer = setTimeout(() => next(false), delay); };

      // cooldown during fade
      let isBusy = false;
      function go(i, userTriggered = false) {
        if (isBusy) return;
        isBusy = true;

        index = (i + slides.length) % slides.length;
        render();

        setTimeout(() => { isBusy = false; }, FADE_MS + 50);
        scheduleNext(AUTO_MS); // full pause after any change
      }
      function next(user){ go(index + 1, user); }
      function prev(user){ go(index - 1, user); }

      // controls
      prevBtn?.addEventListener('click', () => prev(true));
      nextBtn?.addEventListener('click', () => next(true));

      // keyboard
      root.tabIndex = 0;
      root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  prev(true);
        if (e.key === 'ArrowRight') next(true);
      });

      // touch
      let x0 = null;
      root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
      root.addEventListener('touchend',   () => (x0 = null));
      root.addEventListener('touchmove', (e) => {
        if (x0 === null) return;
        const dx = e.touches[0].clientX - x0;
        if (Math.abs(dx) > 40) { (dx < 0 ? next(true) : prev(true)); x0 = null; }
      }, { passive: true });

      // pause/resume
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
  }
})();
