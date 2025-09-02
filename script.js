// Tiny enhancement: current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
// ----- Simple slideshow (clean, single definitions) -----
(function () {
  const root = document.getElementById('family-slideshow');
  if (!root) return;

  const slides   = Array.from(root.querySelectorAll('.slide'));
  const prevBtn  = root.querySelector('.nav.prev');
  const nextBtn  = root.querySelector('.nav.next');
  const dotsWrap = root.querySelector('.dots');

  let index = 0;

  // Tune these to taste
  const AUTO_MS = 10000;   // 10s per slide
  const FADE_MS = 1500;    // must match your CSS fade duration

  // Build dots once
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to slide ${i + 1}`);
    b.addEventListener('click', () => go(i, true));
    dotsWrap.appendChild(b);
  });

  // Render active slide + dot
  function render() {
    slides.forEach((img, i) => img.classList.toggle('is-active', i === index));
    dotsWrap.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  // --- Autoplay handled by a single timeout ---
  let timer = null;
  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }
  function scheduleNext(delay = AUTO_MS) {
    clearTimer();
    timer = setTimeout(() => { next(false); }, delay);
  }

  // Cooldown to ignore spam clicks while fading
  let isBusy = false;

  function go(i, userTriggered = false) {
    if (isBusy) return;
    isBusy = true;

    index = (i + slides.length) % slides.length;
    render();

    // After a user action, wait a full AUTO_MS before advancing again
    // After an auto advance, also wait AUTO_MS.
    const delay = AUTO_MS;

    // unlock after fade finishes
    setTimeout(() => { isBusy = false; }, FADE_MS + 50);

    // reschedule the next auto-advance
    scheduleNext(delay);
  }

  function next(userTriggered) { go(index + 1, userTriggered); }
  function prev(userTriggered) { go(index - 1, userTriggered); }

  // Pause/resume on hover/focus with safe scheduling
  root.addEventListener('mouseenter', () => clearTimer());
  root.addEventListener('mouseleave', () => scheduleNext());
  root.addEventListener('focusin',   () => clearTimer());
  root.addEventListener('focusout',  () => scheduleNext());

  // Buttons & keyboard
  prevBtn.addEventListener('click', () => go(index - 1, true));
  nextBtn.addEventListener('click', () => go(index + 1, true));
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  go(index - 1, true);
    if (e.key === 'ArrowRight') go(index + 1, true);
  });

  // Touch swipe
  let x0 = null;
  root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  root.addEventListener('touchend',   () => (x0 = null));
  root.addEventListener('touchmove', (e) => {
    if (x0 === null) return;
    const dx = e.touches[0].clientX - x0;
    if (Math.abs(dx) > 40) {
      go(index + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }
  }, { passive: true });

  // Pause when tab hidden; resume with a full interval when visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimer();
    else scheduleNext();
  });

  // Init
  render();
  scheduleNext();
})();
