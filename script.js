// Tiny enhancement: current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
(function () {
  const roots = Array.from(document.querySelectorAll('.slideshow'));
  if (!roots.length) return;

  const encodePath = p => p.split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/');

  for (const root of roots) {
    const rawMan  = root.getAttribute('data-manifest');
    const rawBase = root.getAttribute('data-base') || 'assets';
    const slidesWrap = root.querySelector('.slides');
    const dotsWrap   = root.querySelector('.dots');

    if (rawMan) {
      const manifestUrl = encodePath(rawMan);
      fetch(manifestUrl)
        .then(r => {
          if (!r.ok) throw new Error(`${r.status} ${r.statusText} @ ${manifestUrl}`);
          return r.json();
        })
        .then(files => {
          slidesWrap.innerHTML = '';
          dotsWrap && (dotsWrap.innerHTML = '');
          const base = encodePath(rawBase);

          console.log('[SLIDESHOW] manifest OK:', manifestUrl, files);
          files.forEach(name => {
            const url = `${base}/${encodeURIComponent(name)}`;
            const img = document.createElement('img');
            img.src = url;
            img.alt = name;
            img.className = 'slide';
            img.loading = 'lazy';
            img.onerror = () => console.error('[SLIDESHOW] image 404:', img.src);
            slidesWrap.appendChild(img);
          });

          // 👈 Make absolutely sure the first slide is visible before we init
          const first = slidesWrap.querySelector('.slide');
          if (first) first.classList.add('is-active');

          console.log('[SLIDESHOW] slides appended:', slidesWrap.children.length);
          initSlideshow(root);
        })
        .catch(err => {
          console.error('[SLIDESHOW] manifest error:', err);
          slidesWrap.textContent = `Could not load photos. (${err.message})`;
        });
    } else if (root.querySelector('.slide')) {
      // Manual mode: ensure first is visible
      const first = root.querySelector('.slide');
      if (first) first.classList.add('is-active');
      initSlideshow(root);
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
      b.addEventListener('click', () => go(i, true));
      b.setAttribute('aria-label', `Go to slide ${i+1}`);
      dotsWrap.appendChild(b);
    });

    let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-active'))); // 👈 start on visible
    if (index < 0) index = 0;

    const AUTO_MS = 10000, FADE_MS = 1500;

    function render() {
      slides.forEach((el, i) => el.classList.toggle('is-active', i === index));
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach((d,i)=>
          d.classList.toggle('is-active', i===index)
        );
      }
    }

    let t=null, busy=false;
    const schedule = () => { clearTimeout(t); t=setTimeout(()=>go(index+1), AUTO_MS); };
    function go(i){
      if (busy) return;
      busy = true;
      index = (i + slides.length) % slides.length;
      render();
      setTimeout(() => busy = false, FADE_MS + 50);
      schedule();
    }

    prevBtn && prevBtn.addEventListener('click', ()=>go(index-1));
    nextBtn && nextBtn.addEventListener('click', ()=>go(index+1));
    root.addEventListener('mouseenter', ()=>clearTimeout(t));
    root.addEventListener('mouseleave', schedule);

    render();
    schedule();
  }
})();
