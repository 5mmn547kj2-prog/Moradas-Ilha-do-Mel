// CT Assault - CS 1.6 inspired, mobile browser. Requires three.js (loaded in index.html)
const $ = id => document.getElementById(id);
const R = new THREE.WebGLRenderer({ canvas: $('c') });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
const S = new THREE.Scene();
S.background = new THREE.Color(0x9fb4c8);
S.fog = new THREE.Fog(0x9fb4c8, 12, 75);
const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
cam.rotation.order = 'YXZ';
S.add(cam);
function resize() { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
S.add(new THREE.HemisphereLight(0xffffff, 0x555555, 0.95));
const sun = new THREE.DirectionalLight(0xffffff, 0.5); sun.position.set(10, 20, 5); S.add(sun);

// ---------- Map (warehouse inspired by cs_assault: T spawn north, hostage room south) ----------
const walls = [], wallMeshes = [];
function box(x, z, w, d, h, col) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col }));
  m.position.set(x, h / 2, z); S.add(m); wallMeshes.push(m);
  walls.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), new THREE.MeshLambertMaterial({ color: 0x6b655a }));
floor.rotation.x = -Math.PI / 2; S.add(floor); wallMeshes.push(floor);
const WC = 0x8a8f94, CR = 0x9a6b35, CR2 = 0x5d7a4a;
box(0, -40, 60, 1, 7, WC); box(0, 40, 60, 1, 7, WC); box(-30, 0, 1, 80, 7, WC); box(30, 0, 1, 80, 7, WC);
// hostage room
box(-10, 33, 1, 14, 5, 0x9d9486); box(10, 33, 1, 14, 5, 0x9d9486);
box(-6.5, 26, 8, 1, 5, 0x9d9486); box(6.5, 26, 8, 1, 5, 0x9d9486);
// crates and cover
[[-18, 12, 3, 3, 2.4, CR], [-8, 8, 2, 2, 1.2, CR2], [8, 10, 3, 3, 2.4, CR], [18, 14, 2, 2, 1.2, CR2],
 [0, 2, 4, 2, 1.2, CR], [-20, -6, 3, 3, 2.4, CR2], [20, -4, 3, 3, 2.4, CR], [-6, -10, 2, 2, 1.2, CR],
 [7, -14, 2, 2, 1.2, CR2], [0, -22, 6, 1.5, 2.4, WC], [-16, -26, 4, 4, 3, CR], [16, -26, 4, 4, 3, CR2],
 [-24, 22, 2, 8, 2.4, CR], [24, 22, 2, 8, 2.4, CR2], [-12, 20, 2, 2, 1.2, CR], [13, 21, 2, 2, 1.2, CR]
].forEach(b => box(...b));
function ground(x, z, feet) { let g = 0; for (const b of walls) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.h <= feet + 0.5 && b.h > g) g = b.h; return g; }
function push(p, r) {
  for (const b of walls) {
    if (p.y >= b.h - 0.1) continue;
    const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1));
    let dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < r) {
      if (d < 1e-4) { dx = 1; dz = 0; d = 1; }
      p.x = cx + dx / d * r; p.z = cz + dz / d * r;
    }
  }
}
function los(a, b, hgt = 1.2) {
  const dx = b.x - a.x, dz = b.z - a.z, n = Math.ceil(Math.hypot(dx, dz) / 0.8);
  for (let i = 1; i < n; i++) {
    const x = a.x + dx * i / n, z = a.z + dz * i / n;
    for (const w of walls) if (w.h > hgt && x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return false;
  }
  return true;
}

// ---------- Audio (synthesised) ----------
let AC;
function snd(vol, dur, freq, type) {
  if (!AC) return;
  const t = AC.currentTime, g = AC.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  let s;
  if (type === 'tone') { s = AC.createOscillator(); s.frequency.value = freq; }
  else {
    const buf = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    s = AC.createBufferSource(); s.buffer = buf;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; s.connect(f); f.connect(g);
    g.connect(AC.destination); s.start(t); return;
  }
  s.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + dur);
}

// ---------- Weapons (CS 1.6 style stats) ----------
const WP = [
  { n: 'USP .45', dmg: 34, rof: 0.17, mag: 12, res: 100, spr: 0.012, rec: 0.025, auto: false, snd: [0.35, 0.12, 2500], col: 0x333333 },
  { n: 'M4A1', dmg: 33, rof: 0.09, mag: 30, res: 90, spr: 0.02, rec: 0.018, auto: true, snd: [0.5, 0.14, 3500], col: 0x222222 },
  { n: 'AWP', dmg: 115, rof: 1.45, mag: 10, res: 30, spr: 0.002, rec: 0.07, auto: false, snd: [0.9, 0.4, 1800], col: 0x2a3a25 }
];
const P = { x: 0, y: 0, z: 36, vy: 0, yaw: 0, pitch: 0, hp: 100, w: 1, cd: 0, rl: 0, zoom: false, semi: true, kick: 0 };
WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), new THREE.MeshLambertMaterial({ color: 0x222222 }));
gun.position.set(0.22, -0.2, -0.5); cam.add(gun);
const flash = new THREE.PointLight(0xffcc66, 0, 6); flash.position.set(0.22, -0.1, -1); cam.add(flash);

// ---------- Hostages and Terrorists ----------
const hostages = [];
[[-6, 36], [-2, 37], [2, 36], [6, 37]].forEach(([x, z]) => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.35), new THREE.MeshLambertMaterial({ color: 0x4a6fa5 })); b.position.y = 0.65;
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshLambertMaterial({ color: 0xe0b894 })); h.position.y = 1.4;
  g.add(b, h); g.position.set(x, 0, z); S.add(g);
  hostages.push({ g, x, z, hp: 100, alive: true });
});
let bots = [], queue = 0, spawnT = 0, round = 0, state = 'menu';
const botMat = new THREE.MeshLambertMaterial({ color: 0x7a4a2a }), headMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
function spawnBot() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.4), botMat); b.position.y = 0.75;
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), headMat); h.position.y = 1.5;
  g.add(b, h);
  const bot = { g, x: (Math.random() - 0.5) * 40, y: 0, z: -36, hp: 100, cd: 1 + Math.random(), ph: Math.random() * 6 };
  b.userData.bot = bot; h.userData.bot = bot; h.userData.head = true;
  bot.parts = [b, h]; g.position.set(bot.x, 0, bot.z); S.add(g); bots.push(bot);
}

// ---------- Input (touch, free-fire style) ----------
const ts = {}; const mv = { x: 0, y: 0 }; let firing = false;
const jb = $('jb'), jk = $('jk');
function act(a, down) {
  if (state !== 'play') return;
  if (a === 'fire') { firing = down; if (down) P.semi = true; }
  else if (!down) return;
  else if (a === 'jump') { if (P.y <= ground(P.x, P.z, P.y) + 0.01) P.vy = 7; }
  else if (a === 'reload') reload();
  else if (a === 'swap') { P.w = (P.w + 1) % WP.length; P.rl = 0; P.zoom = false; setW(); }
  else if (a === 'scope') { P.zoom = !P.zoom; cam.fov = P.zoom ? 22 : 75; cam.updateProjectionMatrix(); }
}
function setW() {
  gun.material.color.setHex(WP[P.w].col); $('scope').style.display = P.w === 2 ? 'flex' : 'none';
  cam.fov = 75; P.zoom = false; cam.updateProjectionMatrix();
}
function look(dx, dy) {
  const s = P.zoom ? 0.0018 : 0.0045;
  P.yaw -= dx * s; P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - dy * s));
}
addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    const a = t.target.dataset && t.target.dataset.a;
    if (a) { ts[t.identifier] = { k: a, x: t.clientX, y: t.clientY }; act(a, true); }
    else if (t.clientX < innerWidth / 2) {
      ts[t.identifier] = { k: 'joy', x: t.clientX, y: t.clientY };
      jb.style.cssText = jk.style.cssText = ''; jb.style.display = jk.style.display = 'block';
      jb.style.left = jk.style.left = t.clientX + 'px'; jb.style.top = jk.style.top = t.clientY + 'px';
    } else ts[t.identifier] = { k: 'look', x: t.clientX, y: t.clientY };
  }
  if (e.target.tagName !== 'BUTTON') e.preventDefault();
}, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    const s = ts[t.identifier]; if (!s) continue;
    if (s.k === 'joy') {
      let dx = t.clientX - s.x, dy = t.clientY - s.y; const d = Math.hypot(dx, dy), m = 55;
      if (d > m) { dx = dx / d * m; dy = dy / d * m; }
      mv.x = dx / m; mv.y = dy / m; jk.style.left = s.x + dx + 'px'; jk.style.top = s.y + dy + 'px';
    } else if (s.k === 'look' || s.k === 'fire') { look(t.clientX - s.x, t.clientY - s.y); s.x = t.clientX; s.y = t.clientY; }
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
function reload() {
  const w = WP[P.w];
  if (P.rl > 0 || w.ammo === w.mag || w.reserve <= 0) return;
  P.rl = w.n === 'AWP' ? 2.9 : 2.2; snd(0.2, 0.08, 900, 'tone');
}
function shoot() {
  const w = WP[P.w];
  if (P.cd > 0 || P.rl > 0) return;
  if (w.ammo <= 0) { snd(0.2, 0.05, 300, 'tone'); P.cd = 0.3; reload(); return; }
  if (!w.auto && !P.semi) return;
  P.semi = false; w.ammo--; P.cd = w.rof; P.kick = 0.12;
  const sp = w.spr * (P.zoom || P.w !== 2 ? 1 : 12) * (P.vy !== 0 || P.y > 0.01 ? 5 : 1) * (1 + Math.hypot(mv.x, mv.y) * 2);
  ray.setFromCamera({ x: (Math.random() - 0.5) * sp * 6, y: (Math.random() - 0.5) * sp * 6 }, cam);
  const hits = ray.intersectObjects(wallMeshes.concat(...bots.map(b => b.parts)), false);
  if (hits.length) {
    const u = hits[0].object.userData;
    if (u.bot) {
      const b = u.bot, dmg = w.dmg * (u.head ? 4 : 1);
      b.hp -= dmg; $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 120);
      if (b.hp <= 0) killBot(b);
    }
  }
  P.pitch += w.rec * (0.6 + Math.random() * 0.8); P.yaw += (Math.random() - 0.5) * w.rec;
  snd(...w.snd, 'noise'); flash.intensity = 2; setTimeout(() => flash.intensity = 0, 40);
  if (w.ammo === 0) reload();
}
function killBot(b) { S.remove(b.g); bots = bots.filter(x => x !== b); }
function hurt(n) {
  P.hp -= n; $('dmg').style.opacity = 1; setTimeout(() => $('dmg').style.opacity = 0, 150);
  if (P.hp <= 0) over(false, 'You were killed.');
}

// ---------- Rounds ----------
function newRound() {
  round++; queue = Math.min(3 + round * 2, 14); spawnT = 1; bots.forEach(b => S.remove(b.g)); bots = [];
  P.hp = 100; WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
  P.x = 0; P.z = 34; P.y = 0; P.yaw = 0; P.pitch = 0; P.rl = 0;
  hostages.forEach(h => { h.hp = 100; h.alive = true; h.g.rotation.x = 0; h.g.position.y = 0; });
  setW();
}
function over(win, msg) {
  state = 'over'; firing = false;
  $('ovt').textContent = win ? 'MISSION COMPLETE' : 'MISSION FAILED';
  $('ovp').textContent = msg + ' You reached round ' + round + '.'; $('go').textContent = 'Play again';
  $('ov').style.display = 'flex'; if (!win) round = 0;
}
$('go').addEventListener('click', () => {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) { }
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); screen.orientation.lock('landscape').catch(() => { }); } catch (e) { }
  $('ov').style.display = 'none'; $('hp').style.display = 'block'; state = 'play'; newRound();
});

// ---------- Main loop ----------
const tgt = { x: 0, z: 0 }; let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play') update(dt);
  R.render(S, cam);
}
function update(dt) {
  // player
  const sp = 5.5 * (P.zoom ? 0.5 : 1), s = Math.sin(P.yaw), c = Math.cos(P.yaw);
  const fwd = -mv.y, str = mv.x;
  P.x += (-s * fwd + c * str) * sp * dt; P.z += (-c * fwd - s * str) * sp * dt;
  P.vy -= 20 * dt; P.y += P.vy * dt;
  push(P, 0.4);
  const g = ground(P.x, P.z, P.y); if (P.y <= g) { P.y = g; P.vy = 0; }
  P.x = Math.max(-29.4, Math.min(29.4, P.x)); P.z = Math.max(-39.4, Math.min(39.4, P.z));
  P.kick *= Math.pow(0.001, dt);
  cam.position.set(P.x, P.y + 1.6, P.z); cam.rotation.set(P.pitch, P.yaw, 0);
  gun.position.z = -0.5 + P.kick; gun.visible = !P.zoom;
  P.cd -= dt;
  const w = WP[P.w];
  if (P.rl > 0) { P.rl -= dt; if (P.rl <= 0) { const n = Math.min(w.mag - w.ammo, w.reserve); w.ammo += n; w.reserve -= n; } }
  if (firing) shoot();

  // spawning
  spawnT -= dt; if (queue > 0 && spawnT <= 0) { spawnBot(); queue--; spawnT = 2.2; }
  // bots
  for (const b of bots) {
    b.ph += dt;
    let t = null, best = 1e9;
    const dp = Math.hypot(P.x - b.x, P.z - b.z);
    if (dp < 22 && los(b, P)) { t = P; best = dp; }
    else for (const h of hostages) if (h.alive) { const d = Math.hypot(h.x - b.x, h.z - b.z); if (d < best) { best = d; t = h; } }
    if (!t) continue;
    const dx = t.x - b.x, dz = t.z - b.z, d = Math.hypot(dx, dz) || 1;
    if (d > 9) { b.x += dx / d * 3.2 * dt; b.z += dz / d * 3.2 * dt; }
    b.x += -dz / d * Math.sin(b.ph * 1.5) * 1.5 * dt; b.z += dx / d * Math.sin(b.ph * 1.5) * 1.5 * dt;
    push(b, 0.45); b.g.position.set(b.x, 0, b.z); b.g.rotation.y = Math.atan2(dx, dz);
    b.cd -= dt;
    if (b.cd <= 0 && d < 30 && los(b, t)) {
      b.cd = 0.5 + Math.random() * 0.7;
      const vol = Math.max(0.03, 0.25 - d * 0.008); snd(vol, 0.1, 2800, 'noise');
      if (t === P) { if (Math.random() < Math.max(0.12, 0.55 - d / 55)) hurt(8 + Math.random() * 6); }
      else if (Math.random() < 0.6) {
        t.hp -= 12;
        if (t.hp <= 0) { t.alive = false; t.g.rotation.x = -Math.PI / 2; t.g.position.y = 0.2; }
      }
    }
  }
  const alive = hostages.filter(h => h.alive).length;
  $('tl').textContent = 'Round ' + round + '\nHostages ' + alive + '/4';
  $('tl').innerHTML = 'Round ' + round + '<br>Hostages ' + alive + '/4<br>Terrorists ' + (bots.length + queue);
  $('tr').innerHTML = w.n + '<br>' + (P.rl > 0 ? 'Reloading' : w.ammo + ' / ' + w.reserve);
  $('hp').textContent = 'HP ' + Math.max(0, Math.ceil(P.hp));
  if (alive <= 2) over(false, 'Two hostages were lost.');
  else if (!bots.length && !queue) { state = 'over'; setTimeout(() => { if (state === 'over') { state = 'play'; newRound(); } }, 2500); $('tl').innerHTML += '<br>Round cleared'; }
}
requestAnimationFrame(loop);
