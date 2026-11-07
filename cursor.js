/* Cursor "gota" en JavaScript puro: crece y cambia de color sobre lo tocable,
   respira y suelta burbujas cuando se queda quieto, y salpica al hacer clic. */
export function initCursor(o = {}) {
  const opt = { color: '#3B82F6', size: 44, trail: 16, lag: 0.55, splashCount: 13, splashSpeed: 0.5, splashSize: 0.5, ...o };
  if (matchMedia('(pointer:coarse)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'blob-cursor'; c.style.opacity = 0; document.body.append(c);
  const x = c.getContext('2d');
  let m = { x: -100, y: -100 }, pts = Array.from({ length: opt.trail }, () => ({ x: -100, y: -100 })), sp = [], bub = [];
  let grow = 1, growT = 1, hue = 0, hueT = 0, lastMove = Date.now(), tick = 0;
  const HOT = 'button,a,.rv,.opt,.chip,.dots i,[role=button]';
  const resize = () => { const d = devicePixelRatio || 1; c.width = innerWidth * d; c.height = innerHeight * d; x.setTransform(d, 0, 0, d, 0, 0); };
  addEventListener('resize', resize); resize();
  const native = t => !!(t && t.closest && t.closest('video,iframe,input,select,textarea'));
  const hide = on => { c.style.opacity = on ? 0 : 1; document.body.classList.toggle('blob-off', on); };
  addEventListener('pointermove', e => {
    if (!document.body.classList.contains('has-blob')) { document.body.classList.add('has-blob'); pts.forEach(p => { p.x = e.clientX; p.y = e.clientY; }); }
    m = { x: e.clientX, y: e.clientY }; lastMove = Date.now(); hide(native(e.target));
    const hot = !!(e.target.closest && e.target.closest(HOT)); growT = hot ? 1.6 : 1; hueT = hot ? 1 : 0;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { c.style.opacity = 0; });
  document.addEventListener('pointerout', e => { if (!e.relatedTarget || e.relatedTarget.tagName === 'IFRAME') hide(true); });
  addEventListener('pointerdown', e => {
    if (native(e.target)) return;
    growT = 0.7; setTimeout(() => { growT = 1; }, 160);
    for (let i = 0; i < opt.splashCount; i++) {
      const a = Math.random() * 6.28, v = (2 + Math.random() * 4) * (opt.splashSpeed * 2);
      sp.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: opt.size * opt.splashSize * (.3 + Math.random() * .5), life: 1 });
    }
  });
  function loop() {
    try {
      tick++; x.clearRect(0, 0, innerWidth, innerHeight);
      const idle = Date.now() - lastMove > 2500;
      grow += (growT - grow) * .18; hue += (hueT - hue) * .15;
      const pulse = idle ? 1 + Math.sin(tick / 9) * .22 : 1;
      if (idle && tick % 14 === 0 && m.x > 0) bub.push({ x: m.x + (Math.random() - .5) * 26, y: m.y, r: 3 + Math.random() * 6, v: 1 + Math.random() * 1.4, life: 1 });
      const k = 1 - opt.lag;
      pts.forEach((p, i) => { const t = i ? pts[i - 1] : m; p.x += (t.x - p.x) * k; p.y += (t.y - p.y) * k; });
      const rgb = hue > .5 ? '201,123,240' : '59,130,246';
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i], r = Math.max(1, (opt.size / 2) * grow * pulse * (1 - (i / pts.length) * 0.65));
        const gr = x.createRadialGradient(p.x - r * .35, p.y - r * .35, r * .1, p.x, p.y, r);
        gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(.45, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},.22)`);
        x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, r, 0, 6.28); x.fill();
        if (i === 0) { x.strokeStyle = `rgba(${rgb},.85)`; x.lineWidth = 2; x.stroke(); }
      }
      bub.forEach(b => { b.y -= b.v; b.x += Math.sin(b.y / 12) * .6; b.life -= 0.012; });
      bub = bub.filter(b => b.life > 0);
      bub.forEach(b => { x.globalAlpha = b.life * .7; x.strokeStyle = '#24B5EF'; x.lineWidth = 1.5; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 6.28); x.stroke(); });
      sp.forEach(s => { s.x += s.vx; s.y += s.vy; s.life -= 0.03; });
      sp = sp.filter(s => s.life > 0);
      sp.forEach(s => { x.globalAlpha = s.life * .55; x.fillStyle = opt.color; x.beginPath(); x.arc(s.x, s.y, Math.max(0.1, s.r * s.life), 0, 6.28); x.fill(); });
      x.globalAlpha = 1;
    } catch (e) { /* un fotograma fallido no debe detener el cursor */ }
    requestAnimationFrame(loop);
  }
  loop();
}
