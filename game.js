// CT Assault - CS 1.6 inspired FPS for mobile browsers. Needs three.js r128 (loaded in index.html).
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const R = new THREE.WebGLRenderer({ canvas: $('c') });
R.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const S = new THREE.Scene();
S.background = new THREE.Color(0x20252a);
S.fog = new THREE.Fog(0x20252a, 14, 80);
const cam = new THREE.PerspectiveCamera(75, 1, 0.05, 100);
cam.rotation.order = 'YXZ'; S.add(cam);
function resize() { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
S.add(new THREE.HemisphereLight(0xffffff, 0x4a4a4a, 0.85));
[[0, 6, -14], [0, 6, 10], [0, 6, 33]].forEach(p => { const l = new THREE.PointLight(0xfff0cc, 0.55, 45); l.position.set(...p); S.add(l); });

// ---------- Procedural textures (90s-style pixel look) ----------
function tex(f) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); f(x);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.anisotropy = 4; return t;
}
function grain(x, n, a) { for (let i = 0; i < n; i++) { x.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; x.fillRect(rnd(0, 128) | 0, rnd(0, 128) | 0, 2, 2); } }
function cont(col) {
  return tex(x => {
    x.fillStyle = col; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.1)'; x.fillRect(i * 8, 0, 4, 128); }
    for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(70,35,10,.25)'; x.fillRect(rnd(0, 128), rnd(0, 60), rnd(2, 6), rnd(30, 70)); }
    x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, 128, 4); x.fillRect(0, 124, 128, 4); grain(x, 1200, 0.15);
  });
}
const TX = {
  concrete: tex(x => {
    x.fillStyle = '#8c8e8a'; x.fillRect(0, 0, 128, 128); grain(x, 1800, 0.12);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, 128, 2); x.fillRect(0, 0, 2, 128); x.fillRect(0, 64, 128, 1);
    for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(40,35,25,.12)'; x.fillRect(rnd(0, 128), rnd(0, 40), rnd(3, 9), rnd(30, 80)); }
  }),
  brick: tex(x => {
    x.fillStyle = '#6d665e'; x.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) { x.fillStyle = `hsl(${rnd(10, 22)},${rnd(35, 50)}%,${rnd(30, 40)}%)`; x.fillRect(c * 32 + (r % 2 ? 16 : 0) + 1, r * 16 + 1, 30, 14); }
    grain(x, 1200, 0.15);
  }),
  crate: tex(x => {
    x.fillStyle = '#a47c42'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(60,35,10,${rnd(0.1, 0.25)})`; x.fillRect(0, i * 16, 128, 2); }
    x.strokeStyle = '#5e4120'; x.lineWidth = 8; x.strokeRect(4, 4, 120, 120); x.lineWidth = 6; x.beginPath();
    x.moveTo(8, 8); x.lineTo(120, 120); x.moveTo(120, 8); x.lineTo(8, 120); x.stroke(); grain(x, 1500, 0.14);
  }),
  contR: cont('#8a3b2b'), contB: cont('#2f566b'),
  floor: tex(x => {
    x.fillStyle = '#6a6860'; x.fillRect(0, 0, 128, 128); grain(x, 2200, 0.1);
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, 0, 128, 2); x.fillRect(0, 0, 2, 128); x.fillRect(0, 64, 128, 1); x.fillRect(64, 0, 1, 128);
    for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(30,25,15,.12)'; x.beginPath(); x.arc(rnd(0, 128), rnd(0, 128), rnd(6, 18), 0, 7); x.fill(); }
  }),
  ceil: tex(x => { x.fillStyle = '#3a3d40'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 0, 128, 3); x.fillRect(0, 0, 3, 128); grain(x, 900, 0.1); })
};
const MT = {}; for (const k in TX) MT[k] = new THREE.MeshLambertMaterial({ map: TX[k] });

// ---------- Map: warehouse inspired by cs_assault (T spawn north, hostage room south) ----------
const walls = [], wallMeshes = [];
function box(x, z, w, d, h, k) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * sz[f][0] / 2, uv.getY(j) * sz[f][1] / 2); }
  const m = new THREE.Mesh(g, MT[k]); m.position.set(x, h / 2, z); S.add(m); wallMeshes.push(m);
  walls.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
TX.floor.repeat.set(15, 20); TX.ceil.repeat.set(15, 20);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.floor); fl.rotation.x = -Math.PI / 2; S.add(fl); wallMeshes.push(fl);
const ce = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = 7; S.add(ce);
const lampM = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
for (let z = -32; z <= 36; z += 17) for (const x of [-15, 0, 15]) { const l = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.6), lampM); l.position.set(x, 6.9, z); S.add(l); }
box(0, -40.5, 62, 1, 7, 'brick'); box(0, 40.5, 62, 1, 7, 'brick'); box(-30.5, 0, 1, 82, 7, 'brick'); box(30.5, 0, 1, 82, 7, 'brick');
box(-22, -28, 16, 1, 5, 'concrete'); box(0, -28, 16, 1, 5, 'concrete'); box(22, -28, 16, 1, 5, 'concrete'); // T spawn wall, doorways at x=+-11
box(-11, 33, 1, 14, 4.5, 'brick'); box(11, 33, 1, 14, 4.5, 'brick'); box(-6.5, 26, 9, 1, 4.5, 'brick'); box(6.5, 26, 9, 1, 4.5, 'brick'); // hostage room
[[-19, -12, 3, 10, 2.8, 'contR'], [19, -12, 3, 10, 2.8, 'contB'], [0, -16, 10, 3, 2.8, 'contB'], [-20, 6, 10, 3, 2.8, 'contR'], [20, 8, 10, 3, 2.8, 'contR'],
 [-6, -4, 2.4, 2.4, 2.4, 'crate'], [6, -2, 2.4, 2.4, 2.4, 'crate'], [-3, 2, 1.4, 1.4, 1, 'crate'], [9, 12, 2, 2, 2, 'crate'], [-10, 13, 2, 2, 2, 'crate'],
 [0, 11, 2.4, 2.4, 2.4, 'crate'], [14, 21, 2, 2, 2, 'crate'], [-15, 20, 2, 2, 2, 'crate'], [-26, -18, 3, 3, 3, 'crate'], [26, -20, 3, 3, 3, 'crate'],
 [-8, -22, 2, 2, 2, 'crate'], [8, -23, 2, 2, 2, 'crate']].forEach(b => box(...b));
function ground(x, z, feet) { let g = 0; for (const b of walls) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.h <= feet + 0.5 && b.h > g) g = b.h; return g; }
function push(p, r) {
  for (const b of walls) {
    if (p.y >= b.h - 0.1) continue;
    const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1));
    let dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < r) { if (d < 1e-4) { dx = 1; dz = 0; d = 1; } p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
  }
}
function los(a, b, hgt = 1.2) {
  const dx = b.x - a.x, dz = b.z - a.z, n = Math.ceil(Math.hypot(dx, dz) / 0.7);
  for (let i = 1; i < n; i++) { const x = a.x + dx * i / n, z = a.z + dz * i / n; for (const w of walls) if (w.h > hgt && x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return false; }
  return true;
}

// ---------- Audio (synthesised in the browser) ----------
let AC, NB;
function snd(vol, dur, freq, type, pan = 0) {
  if (!AC) return;
  const t = AC.currentTime, g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(AC.destination); } else g.connect(AC.destination);
  if (type === 'tone') { const o = AC.createOscillator(); o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.3), t + dur); o.connect(g); o.start(t); o.stop(t + dur); }
  else {
    if (!NB) { NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = AC.createBufferSource(); s.buffer = NB; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5, dur);
  }
}
function gunSnd(w, pan, k = 1) { snd(w.snd[0] * k, w.snd[1], w.snd[2], 'noise', pan); snd(w.snd[0] * 0.8 * k, 0.12, 180, 'tone', pan); }
function panTo(x, z) { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz) || 1; return (dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / d; }

// ---------- Weapons (CS 1.6 style stats) ----------
const WP = [
  { n: 'USP .45', dmg: 34, rof: 0.17, mag: 12, res: 100, spr: 0.012, rec: 0.025, auto: false, snd: [0.35, 0.12, 2500] },
  { n: 'M4A1', dmg: 33, rof: 0.09, mag: 30, res: 90, spr: 0.02, rec: 0.018, auto: true, snd: [0.5, 0.14, 3500] },
  { n: 'AWP', dmg: 115, rof: 1.45, mag: 10, res: 30, spr: 0.002, rec: 0.07, auto: false, snd: [0.9, 0.4, 1800] }
];
const P = { x: 0, y: 0, z: 31, vy: 0, yaw: 0, pitch: 0, hp: 100, w: 1, cd: 0, rl: 0, rlT: 1, zoom: false, semi: true, kick: 0, draw: 0, walk: 0, step: 0 };
WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
function bx(w, h, d, col, x, y, z, p) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); p.add(m); return m; }
const mzTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffd060'); g.addColorStop(1, 'rgba(255,120,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function mkGun(i) {
  const g = new THREE.Group(), D = 0x1c1c1e, G = 0x4a4d50, SK = 0xc99a74, SL = 0x2c3e60; let mz;
  if (i === 0) { bx(.05, .07, .3, G, 0, 0, -.05, g); bx(.045, .05, .22, D, 0, -.05, 0, g); bx(.04, .11, .06, D, 0, -.1, .1, g).rotation.x = .2; mz = -.22; }
  else if (i === 1) { bx(.06, .09, .45, D, 0, 0, 0, g); bx(.025, .025, .35, G, 0, .01, -.4, g); bx(.05, .06, .3, D, 0, -.01, -.3, g); bx(.05, .08, .22, D, 0, -.02, .33, g); bx(.04, .15, .07, G, 0, -.11, -.02, g).rotation.x = .15; bx(.03, .04, .14, D, 0, .065, .05, g); bx(.04, .1, .06, D, 0, -.09, .15, g).rotation.x = .3; mz = -.6; }
  else { bx(.06, .09, .7, 0x2f3d2a, 0, 0, 0, g); bx(.025, .025, .55, D, 0, .01, -.6, g); bx(.05, .05, .3, D, 0, .08, -.05, g); bx(.07, .07, .04, D, 0, .08, .1, g); bx(.07, .07, .04, D, 0, .08, -.2, g); bx(.05, .1, .25, 0x2f3d2a, 0, -.03, .45, g); mz = -.9; }
  bx(.08, .08, .5, SL, .08, -.17, .3, g).rotation.x = -.15; bx(.07, .07, .1, SK, .05, -.1, .08, g);
  if (i > 0) { bx(.08, .08, .5, SL, -.14, -.2, -.05, g).rotation.set(-.1, .3, 0); bx(.07, .07, .1, SK, -.02, -.06, -.28, g); }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), new THREE.MeshBasicMaterial({ map: mzTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  f.position.set(0, 0.01, mz); f.visible = false; g.add(f); g.userData.mz = f; g.visible = false; cam.add(g); return g;
}
const guns = [0, 1, 2].map(mkGun);
const flash = new THREE.PointLight(0xffcc66, 0, 8); flash.position.set(0.2, -0.1, -1); cam.add(flash);

// ---------- Characters ----------
function human(c) {
  const g = new THREE.Group(), parts = [];
  const mk = (w, h, d, col, x, y, z) => { const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, -h / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); g.add(m); parts.push(m); return m; };
  const legL = mk(.2, .8, .22, c.pants, -.14, .8, 0), legR = mk(.2, .8, .22, c.pants, .14, .8, 0);
  mk(.5, .62, .28, c.shirt, 0, 1.42, 0);
  const armL = mk(.14, .6, .16, c.shirt, -.34, 1.4, 0), armR = mk(.14, .6, .16, c.shirt, .34, 1.4, 0);
  const head = mk(.26, .28, .26, c.skin, 0, 1.72, 0); head.userData.head = true;
  return { g, parts, legL, legR, armL, armR };
}
const hostages = [];
[[-6, 36], [-2, 37], [2, 36], [6, 37]].forEach(([x, z], i) => {
  const h = human({ shirt: 0xd8d8d0, pants: 0x4a5a7a, skin: 0xd9b08c }); h.armL.rotation.x = h.armR.rotation.x = -0.7;
  h.g.position.set(x, 0, z); h.g.rotation.y = Math.PI; S.add(h.g); Object.assign(h, { x, z, hp: 100, alive: true, i }); hostages.push(h);
});
let bots = [], corpses = [], queue = 0, spawnT = 0, round = 0, clearT = 0, state = 'menu', time = 0;
function spawnBot() {
  const h = human({ shirt: [0x5a4a2e, 0x3d4a35, 0x4a3a3a][Math.random() * 3 | 0], pants: 0x3a3a2c, skin: 0x1f1f1f });
  bx(.2, .05, .02, 0xd0a080, 0, 1.6, .135, h.g);
  bx(.06, .08, .5, 0x222222, .12, 1.0, .35, h.g);
  h.armL.rotation.x = -1.2; h.armR.rotation.x = -1.4;
  Object.assign(h, { x: rnd(-22, 22), z: -36, y: 0, hp: 100, cd: 1 + Math.random(), ph: Math.random() * 6, w: 0, dead: false, t: 0 });
  h.parts.forEach(p => p.userData.bot = h); h.g.position.set(h.x, 0, h.z); S.add(h.g); h.g.updateMatrixWorld(true); bots.push(h);
}

// ---------- Effects ----------
const decals = [], fx = [], DG = new THREE.PlaneGeometry(.14, .14), DM = new THREE.MeshBasicMaterial({ color: 0x0c0c0c, transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
function decal(p, n) { const m = new THREE.Mesh(DG, DM); m.position.copy(p).addScaledVector(n, .01); m.lookAt(p.clone().add(n)); S.add(m); decals.push(m); if (decals.length > 40) S.remove(decals.shift()); }
const PG = new THREE.BoxGeometry(.05, .05, .05), PM = {};
function burst(p, col, n) {
  PM[col] = PM[col] || new THREE.MeshBasicMaterial({ color: col });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(PG, PM[col]); m.position.copy(p); S.add(m); fx.push({ m, v: new THREE.Vector3(rnd(-2, 2), rnd(0, 3), rnd(-2, 2)), l: 0.5 }); }
}
function feed(t) { const d = document.createElement('div'); d.textContent = t; $('feed').appendChild(d); setTimeout(() => d.remove(), 4000); }
function ban(t) { const b = $('ban'); b.textContent = t; b.style.opacity = 1; setTimeout(() => b.style.opacity = 0, 2200); }

// ---------- Input (touch, free-fire style) ----------
const ts = {}, mv = { x: 0, y: 0 }; let firing = false; const jb = $('jb'), jk = $('jk');
function setW() {
  guns.forEach((g, i) => g.visible = i === P.w); P.zoom = false; P.draw = 1; cam.fov = 75; cam.updateProjectionMatrix();
  $('scope').style.display = P.w === 2 ? 'flex' : 'none'; $('sc').style.display = 'none';
}
function act(a, down) {
  if (state !== 'play') return;
  if (a === 'fire') { firing = down; if (down) P.semi = true; }
  else if (!down) return;
  else if (a === 'jump') { if (P.y <= ground(P.x, P.z, P.y) + 0.01) P.vy = 7; }
  else if (a === 'reload') reload();
  else if (a === 'swap') { P.w = (P.w + 1) % WP.length; P.rl = 0; setW(); }
  else if (a === 'scope') { P.zoom = !P.zoom; cam.fov = P.zoom ? 22 : 75; cam.updateProjectionMatrix(); $('sc').style.display = P.zoom ? 'block' : 'none'; }
}
function look(dx, dy) { const s = P.zoom ? 0.0018 : 0.0045; P.yaw -= dx * s; P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - dy * s)); }
addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    const a = t.target.dataset && t.target.dataset.a;
    if (a) { ts[t.identifier] = { k: a, x: t.clientX, y: t.clientY }; act(a, true); }
    else if (t.clientX < innerWidth / 2) {
      ts[t.identifier] = { k: 'joy', x: t.clientX, y: t.clientY }; jb.style.display = jk.style.display = 'block';
      jb.style.left = jk.style.left = t.clientX + 'px'; jb.style.top = jk.style.top = t.clientY + 'px';
    } else ts[t.identifier] = { k: 'look', x: t.clientX, y: t.clientY };
  }
  if (e.target.tagName !== 'BUTTON') e.preventDefault();
}, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    const s = ts[t.identifier]; if (!s) continue;
    if (s.k === 'joy') { let dx = t.clientX - s.x, dy = t.clientY - s.y; const d = Math.hypot(dx, dy), m = 55; if (d > m) { dx = dx / d * m; dy = dy / d * m; } mv.x = dx / m; mv.y = dy / m; jk.style.left = s.x + dx + 'px'; jk.style.top = s.y + dy + 'px'; }
    else if (s.k === 'look' || s.k === 'fire') { look(t.clientX - s.x, t.clientY - s.y); s.x = t.clientX; s.y = t.clientY; }
  }
  e.preventDefault();
}, { passive: false });
function end(e) {
  for (const t of e.changedTouches) {
    const s = ts[t.identifier]; if (!s) continue;
    if (s.k === 'joy') { mv.x = mv.y = 0; jb.style.display = jk.style.display = 'none'; }
    if (s.k === 'fire') act('fire', false);
    delete ts[t.identifier];
  }
}
addEventListener('touchend', end); addEventListener('touchcancel', end);

// ---------- Combat ----------
const ray = new THREE.Raycaster(); ray.far = 80;
function reload() { const w = WP[P.w]; if (P.rl > 0 || w.ammo === w.mag || w.reserve <= 0) return; P.rlT = P.w === 2 ? 2.9 : 2.2; P.rl = P.rlT; snd(0.2, 0.08, 900, 'tone'); }
function shoot() {
  const w = WP[P.w];
  if (P.cd > 0 || P.rl > 0 || P.draw > 0.5) return;
  if (w.ammo <= 0) { snd(0.2, 0.05, 300, 'tone'); P.cd = 0.3; reload(); return; }
  if (!w.auto && !P.semi) return;
  P.semi = false; w.ammo--; P.cd = w.rof; P.kick = 0.1;
  const sp = w.spr * (P.zoom || P.w !== 2 ? 1 : 12) * (P.y > 0.01 ? 5 : 1) * (1 + Math.hypot(mv.x, mv.y) * 2);
  ray.setFromCamera({ x: (Math.random() - 0.5) * sp * 6, y: (Math.random() - 0.5) * sp * 6 }, cam);
  const hits = ray.intersectObjects(wallMeshes.concat(...bots.map(b => b.parts)), false);
  if (hits.length) {
    const h = hits[0], u = h.object.userData;
    if (u.bot) {
      const b = u.bot; b.hp -= w.dmg * (u.head ? 4 : 1); burst(h.point, 0xaa0000, 6);
      $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 120);
      if (b.hp <= 0) { feed('You killed a Terrorist' + (u.head ? ' (headshot)' : '')); b.dead = true; bots = bots.filter(x => x !== b); corpses.push(b); }
    } else { decal(h.point, h.face.normal.clone().transformDirection(h.object.matrixWorld)); burst(h.point, 0x9a9488, 4); }
  }
  P.pitch += w.rec * (0.6 + Math.random() * 0.8); P.yaw += (Math.random() - 0.5) * w.rec;
  gunSnd(w, 0); guns[P.w].userData.mz.visible = true; guns[P.w].userData.mz.rotation.z = rnd(0, 6); flash.intensity = 2;
  setTimeout(() => { guns[P.w].userData.mz.visible = false; flash.intensity = 0; }, 45);
  if (w.ammo === 0) reload();
}
function hurt(n, x, z) { P.hp -= n; $('dmg').style.opacity = 1; setTimeout(() => $('dmg').style.opacity = 0, 150); snd(0.3, 0.12, 120, 'tone'); if (P.hp <= 0) over('You were killed.'); }

// ---------- Rounds ----------
function newRound() {
  round++; queue = Math.min(3 + round * 2, 14); spawnT = 2; clearT = 0;
  bots.concat(corpses).forEach(b => S.remove(b.g)); bots = []; corpses = [];
  P.hp = 100; WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
  Object.assign(P, { x: 0, z: 31, y: 0, vy: 0, yaw: 0, pitch: 0, rl: 0 });
  hostages.forEach(h => { h.hp = 100; h.alive = true; h.g.rotation.x = 0; h.g.position.y = 0; });
  setW(); ban('ROUND ' + round + ' - Defend the hostages'); snd(0.25, 0.15, 800, 'tone');
}
function over(msg) {
  state = 'over'; firing = false; $('sc').style.display = 'none';
  $('ovt').textContent = 'MISSION FAILED'; $('ovp').textContent = msg + ' You reached round ' + round + '.'; $('go').textContent = 'Play again';
  $('ov').style.display = 'flex'; round = 0;
}
$('go').addEventListener('click', () => {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) { }
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); screen.orientation.lock('landscape').catch(() => { }); } catch (e) { }
  $('ov').style.display = 'none'; $('hp').style.display = 'block'; state = 'play'; newRound();
});

// ---------- Main loop ----------
const rc = $('rad').getContext('2d'); let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  if (state === 'play') update(dt);
  R.render(S, cam);
}
function radar() {
  rc.clearRect(0, 0, 100, 100); rc.fillStyle = 'rgba(0,0,0,.45)'; rc.beginPath(); rc.arc(50, 50, 50, 0, 7); rc.fill();
  const s = Math.sin(P.yaw), c = Math.cos(P.yaw), dot = (o, col) => {
    const dx = o.x - P.x, dz = o.z - P.z, rx = (dx * c - dz * s) * 1.2, fy = (-dx * s - dz * c) * 1.2;
    if (Math.hypot(rx, fy) > 46) return; rc.fillStyle = col; rc.fillRect(50 + rx - 2, 50 - fy - 2, 4, 4);
  };
  hostages.forEach(h => h.alive && dot(h, '#4da6ff')); bots.forEach(b => los(b, P) && dot(b, '#ff3b2f'));
  rc.fillStyle = '#fff'; rc.beginPath(); rc.moveTo(50, 44); rc.lineTo(46, 54); rc.lineTo(54, 54); rc.fill();
}
const tgtP = { x: 0, z: 0 };
function update(dt) {
  // player movement
  const sp = 5.5 * (P.zoom ? 0.5 : 1), s = Math.sin(P.yaw), c = Math.cos(P.yaw), fwd = -mv.y, str = mv.x;
  P.x += (-s * fwd + c * str) * sp * dt; P.z += (-c * fwd - s * str) * sp * dt;
  P.vy -= 20 * dt; P.y += P.vy * dt; push(P, 0.4);
  const g = ground(P.x, P.z, P.y); if (P.y <= g) { P.y = g; P.vy = 0; }
  P.x = Math.max(-29.4, Math.min(29.4, P.x)); P.z = Math.max(-39.4, Math.min(39.4, P.z));
  const spd = Math.hypot(mv.x, mv.y) * (P.y <= g + 0.01 ? 1 : 0);
  P.walk += dt * 9 * spd; P.step -= dt * spd; if (P.step <= 0 && spd > 0.3) { P.step = 0.38; snd(0.05, 0.05, 500, 'noise', 0); }
  P.kick *= Math.pow(0.001, dt); P.cd -= dt; P.draw = Math.max(0, P.draw - dt * 3);
  cam.position.set(P.x, P.y + 1.6 + Math.sin(P.walk) * 0.03 * spd, P.z); cam.rotation.set(P.pitch, P.yaw, 0);
  const gn = guns[P.w], rp = P.rl > 0 ? Math.sin((1 - P.rl / P.rlT) * Math.PI) : 0;
  gn.position.set(0.18 + Math.cos(P.walk * 0.5) * 0.012 * spd, -0.2 + Math.sin(P.walk) * 0.012 * spd - P.draw * 0.4 - rp * 0.15, -0.4 + P.kick);
  gn.rotation.x = -rp * 0.6 + P.kick * 0.5; gn.visible = !P.zoom;
  const w = WP[P.w];
  if (P.rl > 0) { P.rl -= dt; if (P.rl <= 0) { const n = Math.min(w.mag - w.ammo, w.reserve); w.ammo += n; w.reserve -= n; } }
  if (firing) shoot();

  // spawning and bots
  spawnT -= dt; if (queue > 0 && spawnT <= 0) { spawnBot(); queue--; spawnT = 2.2; }
  for (const b of bots) {
    b.ph += dt; let t = null, best = 1e9;
    const dp = Math.hypot(P.x - b.x, P.z - b.z);
    if (dp < 24 && los(b, P)) { t = P; best = dp; }
    else for (const h of hostages) if (h.alive) { const d = Math.hypot(h.x - b.x, h.z - b.z); if (d < best) { best = d; t = h; } }
    if (!t) continue;
    const seen = los(b, t), td = Math.hypot(t.x - b.x, t.z - b.z) || 1; let wx = t.x, wz = t.z;
    if (b.z < -27 && t.z > -27) { wx = b.x < 0 ? -11 : 11; wz = -25; }
    else if (t.z > 27 && b.z < 26.5) { wx = 0; wz = Math.abs(b.x) < 1.6 ? 30 : 23; }
    const dx = wx - b.x, dz = wz - b.z, dd = Math.hypot(dx, dz) || 1, mvg = !(seen && td < 10);
    if (mvg) { b.x += dx / dd * 3.4 * dt; b.z += dz / dd * 3.4 * dt; b.w += dt * 8; }
    else { b.x += -(t.z - b.z) / td * Math.sin(b.ph * 1.3) * 1.8 * dt; b.z += (t.x - b.x) / td * Math.sin(b.ph * 1.3) * 1.8 * dt; }
    push(b, 0.45); b.g.position.set(b.x, 0, b.z); b.g.rotation.y = Math.atan2(t.x - b.x, t.z - b.z);
    b.legL.rotation.x = Math.sin(b.w) * 0.7 * (mvg ? 1 : 0); b.legR.rotation.x = -b.legL.rotation.x;
    b.cd -= dt;
    if (b.cd <= 0 && td < 30 && seen) {
      b.cd = 0.5 + Math.random() * 0.7; gunSnd(WP[1], panTo(b.x, b.z), Math.max(0.12, 0.6 - td * 0.02));
      if (t === P) { if (Math.random() < Math.max(0.12, 0.55 - td / 55)) hurt(8 + Math.random() * 6); }
      else if (Math.random() < 0.6) { t.hp -= 12; if (t.hp <= 0) { t.alive = false; t.g.rotation.x = Math.PI / 2; t.g.position.y = 0.2; feed('Terrorist killed a Hostage'); } }
    }
  }
  corpses = corpses.filter(b => { b.t += dt; b.g.rotation.x = -Math.min(1, b.t * 3) * Math.PI / 2; b.g.position.y = Math.min(1, b.t * 3) * 0.15; if (b.t > 5) { S.remove(b.g); return false; } return true; });
  hostages.forEach(h => { if (h.alive) h.g.rotation.y = Math.PI + Math.sin(time * 0.8 + h.i) * 0.3; });
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.v.y -= 9 * dt; f.m.position.addScaledVector(f.v, dt); if ((f.l -= dt) <= 0) { S.remove(f.m); fx.splice(i, 1); } }

  // HUD
  const alive = hostages.filter(h => h.alive).length;
  $('tl').innerHTML = 'Round ' + round + '<br>Hostages ' + alive + '/4<br>Terrorists ' + (bots.length + queue);
  $('tr').innerHTML = w.n + '<br>' + (P.rl > 0 ? 'Reloading' : w.ammo + ' / ' + w.reserve);
  $('hp').textContent = 'HP ' + Math.max(0, Math.ceil(P.hp)); radar();
  if (alive <= 2) over('Two hostages were lost.');
  else if (!bots.length && !queue) { if (!clearT) { clearT = 3; ban('ROUND CLEARED'); } else if ((clearT -= dt) <= 0) newRound(); }
}
requestAnimationFrame(loop);
