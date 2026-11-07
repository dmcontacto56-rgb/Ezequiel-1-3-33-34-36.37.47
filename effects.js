const canvas = document.getElementById('fx');
const g = canvas.getContext('2d');
const COLORS = ['#0887F5', '#24B5EF', '#7CB8F0', '#C97BF0', '#9589EB', '#ffd54a'];
let parts = [], rings = [], running = false;
const calm = () => document.body.classList.contains('calm') || matchMedia('(prefers-reduced-motion:reduce)').matches;
function resize() { const d = devicePixelRatio || 1; canvas.width = innerWidth * d; canvas.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', resize); resize();
function frame() {
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 20);
  for (const p of parts) {
    p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr; p.life--;
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life / 25);
    g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); g.restore();
  }
  rings = rings.filter(r => r.a > 0.02);
  for (const r of rings) { r.r += r.v; r.a *= 0.93; g.globalAlpha = r.a; g.strokeStyle = r.c; g.lineWidth = 3; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 6.28); g.stroke(); }
  g.globalAlpha = 1;
  if (parts.length || rings.length) requestAnimationFrame(frame); else running = false;
}
const go = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
export function confetti(x, y, n = 45) {
  if (calm()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], life: 70 + Math.random() * 40 });
  }
  go();
}
/* Ondas de agua: tres anillos que se expanden donde se toca */
export function ripple(x, y) {
  if (calm()) return;
  [0, 1, 2].forEach(i => setTimeout(() => { rings.push({ x, y, r: 6, v: 2.6 + i * .5, a: .75, c: i % 2 ? '#C97BF0' : '#24B5EF' }); go(); }, i * 110));
}
export const confettiFrom = (el, n) => { const b = el.getBoundingClientRect(); confetti(b.left + b.width / 2, b.top + b.height / 2, n); };
export function shake(el) {
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}
