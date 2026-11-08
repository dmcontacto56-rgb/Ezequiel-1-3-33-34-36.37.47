import { setClickSound, click, beat, cheer, fanfare, sparkle, oops, setMuted, isMuted } from './audio.js?v=8';
import { confettiFrom, shake, ripple } from './effects.js?v=8';
import { initCursor } from './cursor.js?v=8';

const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = a => [...a].sort(() => Math.random() - .5);
const U = encodeURI;
const inits = {};
const sections = [...document.querySelectorAll('main section')];
let cur = 0;

function mkTF(id, items, labels) {
  const box = $(id); box.innerHTML = '';
  items.forEach((q, i) => {
    const row = h('div', 'card tf tone' + (i % 5), `<div><b>${q.s}</b><p class="rev"></p></div><div><button data-v="1">${labels[0]}</button> <button data-v="0" class="ghost">${labels[1]}</button></div>`);
    const p = $('p', row);
    row.querySelectorAll('button').forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === '1') === q.a;
      row.classList.remove('ok', 'no'); row.classList.add(ok ? 'ok' : 'no'); p.classList.add('on');
      if (ok) { p.textContent = '✅ ' + q.e; confettiFrom(b, 60); cheer(); }
      else { p.textContent = '❌ ¡Casi! Piénsalo otra vez.'; shake(row); oops(); }
    });
    box.append(row);
  });
}

// ---- Corazón de arcilla: la masa se transforma (morfología de puntos) en un corazón que late y derrama luz ----
const HT = [...Array(16)].map((_, k) => k / 16 * Math.PI * 2);
const circ = r => HT.map(t => [100 + r * Math.sin(t), 155 - r * Math.cos(t)]);
const HEART = [[96, 80], [120, 80], [145, 92], [160, 112], [166, 140], [158, 170], [142, 196], [120, 218], [98, 238], [76, 225], [54, 205], [40, 180], [34, 150], [38, 122], [48, 102], [68, 86]];
const mix = (a, b, k) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
const RR = [50, 64, 48, 68, 54, 62, 46, 66, 52, 60, 47, 65, 55, 63, 49, 61];
const LUMP = HT.map((t, i) => [100 + RR[i] * Math.sin(t), 155 - RR[i] * Math.cos(t)]);
const SH = [LUMP, mix(LUMP, circ(62), .75), mix(circ(66), HEART, .55), HEART, HEART];
const FILL = ['#a9784f', '#b98558', '#b8654a', '#b3443f', '#d0213f'];
const pathD = P => { const n = P.length; let d = `M${P[0][0]},${P[0][1]}`; for (let i = 0; i < n; i++) { const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], e = P[(i + 2) % n]; d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`; } return d + 'Z'; };
let hs = 0, hShape = SH[0], hRaf = 0, hTimer = 0;
const paint = s => { $('#hpath').setAttribute('d', pathD(hShape)); $('#hpath').style.fill = FILL[s]; $('#hpath').style.opacity = s >= 4 ? 0 : 1; $('#hreal').style.opacity = s >= 4 ? 1 : 0; };
function morph(to, s) {
  const from = hShape, t0 = performance.now(); cancelAnimationFrame(hRaf);
  (function step(t) { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); hShape = mix(from, to, e); paint(s); if (k < 1) hRaf = requestAnimationFrame(step); })(t0);
}
function glow() {
  const box = $('#hbox'), g = h('span', 'glow', '<i class="gold"></i><i class="ring"></i>'); box.append(g); setTimeout(() => g.remove(), 1600);
}

async function boot() {
  let D;
  try { D = await (await fetch('content.json')).json(); }
  catch (e) { $('#stage').innerHTML = '<p class="card">No se pudo cargar content.json. Abre la página desde GitHub Pages o un servidor local (python servir.py), no con doble clic.</p>'; return; }
  window.__app = 8;
  const M = D.meta;
  setClickSound(U(M.clickSound));
  document.addEventListener('click', click);
  addEventListener('pointerdown', e => ripple(e.clientX, e.clientY));
  initCursor();
  $('#logoEnd').onerror = e => { e.target.hidden = true; }; $('#logoEnd').src = U(M.logo);
  $('#coverImg').src = U(M.cover); $('#rioImg').src = U(M.rio); $('#ezqImg').src = U(M.ezequiel);
  initNav(); initTimer(); initControls(); initNudge(); initPan();
  $('#goBtn').onclick = e => { confettiFrom(e.currentTarget, 120); fanfare(); setTimeout(() => show(1), 600); };

  // Misión de lectura: el texto borroso se cambia por la instrucción
  inits['s-cards'] = () => {
    const box = $('#cards'); box.innerHTML = '';
    D.cards.forEach((k, i) => {
      const b = h('button', 'opt tone' + (i % 5), `<h3 class="c${i % 4 + 1}">${k.ref}</h3><b>${k.title}</b><span class="blurtxt">«${k.verse}»</span><span class="rev">✏️ Busca <mark>${k.ref}</mark> en tus Escrituras y subráyalo.<span class="qbox">${k.q}</span></span>`);
      b.onclick = () => { if (b.classList.contains('open')) return; b.classList.add('open', 'seen'); confettiFrom(b, 30); sparkle(); };
      box.append(b);
    });
  };

  // Ezequiel 1 (respuesta oculta) y Ezequiel 2
  inits['s-ezq'] = () => {
    const c = $('#ezqChips'), d = $('#ezqDet'); c.innerHTML = ''; d.className = 'card rev';
    D.ezq.forEach((x, i) => {
      const b = h('button', 'chip', x.ref);
      b.onclick = () => {
        c.querySelectorAll('.chip').forEach(y => y.classList.remove('on')); b.classList.add('on'); d.className = 'card rev on tone' + (i + 3);
        d.innerHTML = x.msg
          ? `<h3>${x.ref}</h3><div class="hid" tabindex="0" role="button" aria-label="Revelar el mensaje"><p class="blurtxt">${x.t}</p><p class="msg">📖 ${x.msg}</p></div><p class="note hint">👆 Toca el texto borroso</p>`
          : `<h3>${x.ref}</h3><p>${x.t}</p><p class="note">💭 ${x.q}</p>`;
        const hd = $('.hid', d);
        if (hd) {
          const open = () => { if (hd.classList.contains('open')) return; hd.classList.add('open'); const t = $('.hint', d); if (t) t.remove(); confettiFrom(hd, 50); sparkle(); };
          hd.onclick = open; hd.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
        }
        sparkle(); confettiFrom(b, 20);
      };
      c.append(b);
    });
  };

  inits['s-tf'] = () => mkTF('#tf', D.tf, ['Verdadero', 'Falso']);

  inits['s-match'] = () => {
    const L = $('#mL'), R = $('#mR'); L.innerHTML = R.innerHTML = ''; L.className = R.className = 'pair';
    let sel = null, done = 0; const total = D.match.length; $('#matchCount').textContent = `0/${total}`;
    D.match.forEach((m, i) => { const b = h('button', '', m[0]); b.dataset.k = i; b.onclick = () => { L.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; }; L.append(b); });
    shuffle(D.match.map((m, i) => [m[1], i])).forEach(([t, i]) => {
      const b = h('button', '', t); b.dataset.k = i;
      b.onclick = () => {
        if (!sel) return;
        if (sel.dataset.k === b.dataset.k) { const ico = D.match[i][0].split(' ')[0]; sel.classList.remove('sel'); sel.classList.add('done'); b.classList.add('done'); b.innerHTML = '<span class="ic">' + ico + '</span> ' + b.textContent; confettiFrom(b, 50); cheer(); sel = null; done++; $('#matchCount').textContent = `${done}/${total}` + (done === total ? ' 🎉' : ''); if (done === total) fanfare(); }
        else { b.classList.add('bad'); shake(b); oops(); setTimeout(() => b.classList.remove('bad'), 600); }
      };
      R.append(b);
    });
  };

  inits['s-apply'] = () => {
    const box = $('#apply'); box.innerHTML = '';
    D.apply.forEach((a, k) => {
      const d = h('div', 'card tone' + [0, 4, 1][k % 3], `<b>${a.s}</b><div class="grid"></div><div class="reflect card rev"></div>`);
      const g = $('.grid', d), r = $('.reflect', d);
      a.o.forEach((o, i) => {
        const b = h('button', 'opt o' + i, o.t);
        b.onclick = () => { g.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); r.className = 'reflect card rev on tone' + i; r.innerHTML = `<span class="note">💭 ${o.r}</span>`; sparkle(); };
        g.append(b);
      });
      box.append(d);
    });
    $('#refOut').textContent = '';
  };
  $('#refBtn').onclick = e => { const t = $('#refTxt').value.trim(); if (!t) return; $('#refOut').textContent = '💗 ' + t; confettiFrom(e.currentTarget, 80); fanfare(); };

  inits['s-week'] = () => {
    const box = $('#week'); box.innerHTML = ''; let saved = [];
    try { saved = JSON.parse(localStorage.getItem('valientes-ezequiel-week') || '[]'); } catch (e) { /* sin almacenamiento */ }
    const upd = () => { const n = box.querySelectorAll('.lit').length; $('#weekCount').textContent = `Misiones iluminadas: ${n}/${D.week.length}` + (n === D.week.length ? ' 🏆' : ''); try { localStorage.setItem('valientes-ezequiel-week', JSON.stringify([...box.children].map(x => x.classList.contains('lit')))); } catch (e) { /* ok */ } };
    D.week.forEach((w, i) => {
      const [day, ...rest] = w.split(': ');
      const b = h('button', 'card week tone' + (i % 5), `<span class="spark">✨</span><span><b>${day}</b><br>${rest.join(': ')}</span>`);
      b.classList.toggle('lit', !!saved[i]);
      b.onclick = () => { const on = b.classList.toggle('lit'); if (on) { confettiFrom(b, 50); cheer(); } upd(); if (box.querySelectorAll('.lit').length === D.week.length) fanfare(); };
      box.append(b);
    });
    upd();
  };

  // Ezequiel 36:23 y 36:26: la arcilla se vuelve corazón
  inits['s-heart'] = () => {
    clearInterval(hTimer); cancelAnimationFrame(hRaf); hs = 0; hShape = SH[0];
    const box = $('#hbox'); box.classList.remove('alive'); box.querySelectorAll('.glow').forEach(x => x.remove());
    paint(0); $('#hcap').textContent = D.heart[0];
  };
  const tapHeart = () => {
    const box = $('#hbox'); box.classList.add('squash'); setTimeout(() => box.classList.remove('squash'), 520);
    if (hs < 4) {
      hs++; morph(SH[hs], hs); $('#hcap').textContent = D.heart[hs]; sparkle(); confettiFrom(box, 14 + hs * 12);
      if (hs === 4) { fanfare(); box.classList.add('alive'); glow(); beat(); hTimer = setInterval(() => { if (sections[cur].id === 's-heart') { glow(); beat(); } }, 1200); }
    } else { glow(); sparkle(); confettiFrom(box, 40); }
  };
  $('#hbox').onclick = tapHeart; $('#hbox').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapHeart(); } };

  // Ezequiel 37 (lo subrayado) + imagen misional con blur
  inits['s-ez37'] = () => {
    let prev = 0, out = '';
    D.ez37.forEach(v => { if (prev && v.v !== prev + 1) out += '<p class="gap">⋯</p>'; out += `<p class="vs"><b>${v.v}</b><span class="ul">${v.t}</span></p>`; prev = v.v; });
    $('#v37').innerHTML = `<div class="card tone0 read"><h3>Ezequiel 37</h3><p class="note">Lee con atención los versículos subrayados.</p>${out}</div>`;
    $('#misBox').classList.remove('unblur'); $('#misCap').classList.remove('on');
  };
  $('#misImg').src = U(M.mision);
  const showMis = () => { const b = $('#misBox'); if (b.classList.contains('unblur')) return; b.classList.add('unblur'); $('#misCap').classList.add('on'); confettiFrom(b, 100); fanfare(); };
  $('#misBox').onclick = showMis; $('#misBox').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showMis(); } };

  Object.values(inits).forEach(f => f());
  document.querySelectorAll('.rs').forEach(b => b.onclick = () => {
    const s = b.closest('section');
    s.querySelectorAll('.rev.on').forEach(x => x.classList.remove('on')); s.querySelectorAll('.sel,.seen,.open').forEach(x => x.classList.remove('sel', 'seen', 'open'));
    if (s.id === 's-week') { try { localStorage.removeItem('valientes-ezequiel-week'); } catch (e) { /* ok */ } }
    inits[s.id]?.(); sparkle();
  });
  show(0);
}

function show(n) {
  cur = Math.max(0, Math.min(sections.length - 1, n));
  sections.forEach((s, i) => {
    s.classList.toggle('on', i === cur);
    s.querySelectorAll('iframe[data-src]').forEach(f => { const want = i === cur ? f.dataset.src : ''; if (f.getAttribute('src') !== want) f.setAttribute('src', want); }); // el video se detiene al salir
  });
  document.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i === cur));
  $('#bar').style.width = ((cur + 1) / sections.length * 100) + '%';
  const s = sections[cur]; $('#label').textContent = `${cur + 1}/${sections.length} · ${s.dataset.title} · ${s.dataset.time}`;
  $('#stage').scrollTop = 0;
}
function initNav() {
  sections.forEach((s, i) => { const d = h('i'); d.title = s.dataset.title; d.onclick = () => show(i); $('#dots').append(d); });
  $('#prev').onclick = () => show(cur - 1);
  $('#next').onclick = e => { show(cur + 1); confettiFrom(e.currentTarget, 14); };
  addEventListener('keydown', e => { if (e.target.tagName === 'TEXTAREA') return; if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
}
// La imagen del río (fondo de las tarjetas) se mueve con el cursor, o sola suavemente si no hay movimiento
function initPan() {
  const box = $('#panBox'), img = $('#rioImg'); let tx = 0, ty = 0, gx = 0, gy = 0, last = 0;
  addEventListener('pointermove', e => { last = Date.now(); gx = -(e.clientX / innerWidth - .5) * 2; gy = -(e.clientY / innerHeight - .5) * 2; }, { passive: true });
  (function loop(t) {
    if (!document.body.classList.contains('calm') && sections[cur].id === 's-cards') {
      if (Date.now() - last > 2500) { gx = Math.sin(t / 1800); gy = Math.cos(t / 2300) * .6; }
      tx += (gx - tx) * .06; ty += (gy - ty) * .06;
      const w = box.clientWidth * .07, hh = box.clientHeight * .07;
      img.style.transform = `translate(${(tx * w).toFixed(1)}px,${(ty * hh).toFixed(1)}px) scale(${1 + Math.abs(tx) * .02})`;
    }
    requestAnimationFrame(loop);
  })(0);
}
// Si los niños se quedan quietos 6 s, la próxima cosa por tocar "se menea" para llamar su atención
function initNudge() {
  let t; const wake = () => { document.querySelectorAll('.nudge').forEach(x => x.classList.remove('nudge')); clearTimeout(t); t = setTimeout(() => { (sections[cur].querySelector('.opt:not(.open):not(.seen), .tf:not(.ok), button.week:not(.lit), .chip:not(.on)') || $('#next')).classList.add('nudge'); }, 6000); };
  ['pointermove', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, wake, { passive: true })); wake();
}
function initTimer() {
  let sec = 0, run = false; const t = $('#timer'), go = $('#tStart');
  const fmt = () => { t.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); t.classList.toggle('late', sec > 1800); };
  setInterval(() => { if (run) { sec++; fmt(); } }, 1000);
  go.onclick = () => { run = !run; go.textContent = run ? '⏸' : '▶'; };
  $('#tReset').onclick = () => { if (confirm('¿Reiniciar el cronómetro?')) { sec = 0; run = false; go.textContent = '▶'; fmt(); } };
}
function initControls() {
  $('#btnSound').onclick = e => { setMuted(!isMuted()); e.currentTarget.textContent = isMuted() ? '🔇' : '🔊'; };
  $('#btnMotion').onclick = () => document.body.classList.toggle('calm');
}
boot();
