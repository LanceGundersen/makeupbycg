(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $('#yr').textContent = new Date().getFullYear();

  /* ---- custom cursor ---- */
  if (fine) {
    const c = $('.cursor');
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    (function loop() {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      c.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(loop);
    })();
    $$('a,button,.rows li').forEach(el => {
      el.addEventListener('pointerenter', () => c.classList.add('big'));
      el.addEventListener('pointerleave', () => c.classList.remove('big'));
    });
  }

  /* ---- manifesto: word-by-word light-up tied to scroll ---- */
  const words = $('[data-words]');
  let wordEls = [];
  if (words) {
    const hot = new Set(['experience.', 'Skin', 'Light']);
    wordEls = words.textContent.trim().split(/\s+/).map(t => {
      const s = document.createElement('span');
      s.className = 'w' + (hot.has(t) ? ' hot' : '');
      s.textContent = t + ' ';
      return s;
    });
    words.textContent = '';
    wordEls.forEach(s => words.appendChild(s));
  }
  function lightWords() {
    if (!words) return;
    const r = words.getBoundingClientRect();
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * wordEls.length);
    wordEls.forEach((w, i) => w.classList.toggle('lit', reduce || i < n));
  }

  /* ---- parallax ---- */
  const par = $$('[data-parallax]');
  function parallax() {
    if (reduce) return;
    const vh = innerHeight;
    par.forEach(el => {
      const host = el.parentElement;
      const r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = parseFloat(el.dataset.parallax) || 0.2;
      const mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0,${(-mid * k).toFixed(1)}px,0)`;
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { lightWords(); parallax(); ticking = false; });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- in-view toggles ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.3 });
  $$('.panel,[data-reveal]').forEach(el => io.observe(el));

  /* ---- menu rows: image follows cursor ---- */
  if (fine) {
    const peek = $('.peek');
    let px = 0, py = 0, tpx = 0, tpy = 0, raf;
    const move = () => {
      px += (tpx - px) * 0.14; py += (tpy - py) * 0.14;
      peek.style.left = px + 'px'; peek.style.top = py + 'px';
      raf = requestAnimationFrame(move);
    };
    $$('.rows li').forEach(li => {
      li.addEventListener('pointerenter', e => {
        peek.style.backgroundImage = `url(${li.dataset.img})`;
        peek.classList.add('show');
        px = tpx = e.clientX; py = tpy = e.clientY;
        cancelAnimationFrame(raf); move();
      });
      li.addEventListener('pointermove', e => { tpx = e.clientX + 120; tpy = e.clientY; });
      li.addEventListener('pointerleave', () => { peek.classList.remove('show'); cancelAnimationFrame(raf); });
    });
  }

  /* ---- contact form ---- */
  const form = $('#form');
  const status = $('#status');
  const btn = $('.send', form);
  const say = (msg, cls) => { status.textContent = msg; status.className = 'status ' + (cls || ''); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    let bad = false;
    ['name', 'email', 'project', 'message'].forEach(k => {
      const el = form.elements[k];
      const v = (data.get(k) || '').toString().trim();
      const ok = k === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) : v.length > 0;
      el.classList.toggle('invalid', !ok);
      if (!ok) bad = true;
    });
    if (bad) { say('Please fill in the highlighted fields.', 'err'); return; }

    btn.disabled = true; say('Sending…');
    try {
      const res = await fetch(form.action, { method: 'POST', body: data });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Something went wrong.');
      form.reset();
      if (window.turnstile) try { turnstile.reset(); } catch (_) {}
      say('Received. If the dates work, you will hear back personally.', 'ok');
    } catch (err) {
      say(err.message + ' You can also email cg@makeupbycg.com directly.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
