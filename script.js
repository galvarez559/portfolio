// Tiny enhancement: current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
// ----- Simple slideshow -----
(function () {
  const root = document.getElementById('family-slideshow');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.slide'));
  const prevBtn = root.querySelector('.nav.prev');
  const nextBtn = root.querySelector('.nav.next');
  const dotsWrap = root.querySelector('.dots');

  let index = 0;
  let timer = null;
  const AUTO_MS = 10000;

  // Build dots
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

  function go(i, user = false) {
    index = (i + slides.length) % slides.length;
    render();
    if (user) restart(); // if user interacts, restart the autoplay timer
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  // Autoplay with pause on hover/focus
  function start() { timer = setInterval(next, AUTO_MS); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  // Buttons
  prevBtn.addEventListener('click', () => go(index - 1, true));
  nextBtn.addEventListener('click', () => go(index + 1, true));

  // Keyboard
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1, true);
    if (e.key === 'ArrowRight') go(index + 1, true);
  });

  // Touch swipe
  let x0 = null;
  root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  root.addEventListener('touchmove', (e) => {
    if (x0 === null) return;
    const dx = e.touches[0].clientX - x0;
    if (Math.abs(dx) > 40) {
      go(index + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }
  }, { passive: true });
  root.addEventListener('touchend', () => (x0 = null));

  // Init
  render();
  start();
})();