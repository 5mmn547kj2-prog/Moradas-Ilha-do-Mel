// CT Assault — CS-inspired FPS. Senior polish: CS-style Ts, death falls, readable combat.
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 2.5));
R.outputEncoding = THREE.sRGBEncoding;
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.12;
R.physicallyCorrectLights = true;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;

const S = new THREE.Scene();
S.background = new THREE.Color(0x3d454c);
S.fog = new THREE.FogExp2(0x3d454c, 0.0078);
const cam = new THREE.PerspectiveCamera(75, 1, 0.05, 160);
cam.rotation.order = 'YXZ';
S.add(cam);
function resize() {
  R.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

S.add(new THREE.HemisphereLight(0xd8e4f0, 0x2a2e28, 0.85));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(-20, 30, -8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
sun.shadow.camera.top = 46; sun.shadow.camera.bottom = -46;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.025;
S.add(sun);
[[0, 5.2, -14], [0, 5.2, 10], [0, 5.2, 33], [-14, 3.8, 6], [14, 3.8, 6]].forEach(p => {
  const l = new THREE.PointLight(0xffefd0, 0.42, 36);
  l.position.set(...p); S.add(l);
});

// ---------- High-res procedural surfaces ----------
function tex(fn, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); fn(x, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = Math.min(16, R.capabilities.getMaxAnisotropy());
  t.encoding = THREE.sRGBEncoding;
  return t;
}
function grain(x, n, a, s) {
  for (let i = 0; i < n; i++) {
    x.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    x.fillRect(rnd(0, s) | 0, rnd(0, s) | 0, 1 + (Math.random() * 2 | 0), 1 + (Math.random() * 2 | 0));
  }
}
function cont(col) {
  return tex((x, s) => {
    x.fillStyle = col; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? 'rgba(0,0,0,.26)' : 'rgba(255,255,255,.08)';
      x.fillRect(i * (s / 16), 0, s / 32, s);
    }
    for (let i = 0; i < 12; i++) {
      x.fillStyle = 'rgba(60,30,8,.2)';
      x.fillRect(rnd(0, s), rnd(0, s * 0.45), rnd(3, 9), rnd(35, 90));
    }
    x.fillStyle = 'rgba(0,0,0,.38)'; x.fillRect(0, 0, s, 5); x.fillRect(0, s - 5, s, 5);
    grain(x, 3000, 0.11, s);
  }, 256);
}
const TX = {
  concrete: tex((x, s) => {
    x.fillStyle = '#858780'; x.fillRect(0, 0, s, s); grain(x, 4800, 0.1, s);
    x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(0, 0, s, 3); x.fillRect(0, 0, 3, s); x.fillRect(0, s / 2, s, 2);
    for (let i = 0; i < 16; i++) {
      x.fillStyle = 'rgba(30,28,22,.12)';
      x.fillRect(rnd(0, s), rnd(0, s * 0.4), rnd(4, 14), rnd(40, 120));
    }
  }, 512),
  brick: tex((x, s) => {
    x.fillStyle = '#4e4840'; x.fillRect(0, 0, s, s);
    const rh = s / 8, rw = s / 4;
    for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
      x.fillStyle = `hsl(${rnd(8, 18)},${rnd(25, 42)}%,${rnd(26, 40)}%)`;
      x.fillRect(c * rw + (r % 2 ? rw / 2 : 0) + 1, r * rh + 1, rw - 2, rh - 2);
    }
    grain(x, 3500, 0.12, s);
  }, 512),
  crate: tex((x, s) => {
    x.fillStyle = '#9a7034'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 10; i++) {
      x.fillStyle = `rgba(50,28,6,${rnd(0.08, 0.2)})`;
      x.fillRect(0, i * (s / 10), s, 2);
    }
    x.strokeStyle = '#3f2a12'; x.lineWidth = Math.max(5, s / 18);
    x.strokeRect(s * 0.04, s * 0.04, s * 0.92, s * 0.92);
    x.lineWidth = Math.max(3, s / 28); x.beginPath();
    x.moveTo(s * 0.06, s * 0.06); x.lineTo(s * 0.94, s * 0.94);
    x.moveTo(s * 0.94, s * 0.06); x.lineTo(s * 0.06, s * 0.94); x.stroke();
    grain(x, 3800, 0.11, s);
  }, 512),
  contR: cont('#7a3528'), contB: cont('#2a4e62'),
  floor: tex((x, s) => {
    x.fillStyle = '#5e5c55'; x.fillRect(0, 0, s, s); grain(x, 5500, 0.08, s);
    x.fillStyle = 'rgba(0,0,0,.26)';
    x.fillRect(0, 0, s, 3); x.fillRect(0, 0, 3, s);
    x.fillRect(0, s / 2, s, 2); x.fillRect(s / 2, 0, 2, s);
    for (let i = 0; i < 10; i++) {
      x.fillStyle = 'rgba(22,20,14,.1)';
      x.beginPath(); x.arc(rnd(0, s), rnd(0, s), rnd(8, 30), 0, 7); x.fill();
    }
  }, 512),
  ceil: tex((x, s) => {
    x.fillStyle = '#323538'; x.fillRect(0, 0, s, s);
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, 0, s, 4); x.fillRect(0, 0, 4, s);
    grain(x, 2400, 0.08, s);
  }, 256)
};
const MT = {};
for (const k in TX) {
  MT[k] = new THREE.MeshStandardMaterial({
    map: TX[k],
    roughness: k === 'crate' ? 0.75 : 0.88,
    metalness: k.startsWith('cont') ? 0.2 : 0.03
  });
}

// ---------- Map (cs_assault-inspired warehouse) ----------
const walls = [], wallMeshes = [];
function box(x, z, w, d, h, k) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const j = f * 4 + i;
    uv.setXY(j, uv.getX(j) * sz[f][0] / 2, uv.getY(j) * sz[f][1] / 2);
  }
  const m = new THREE.Mesh(g, MT[k]);
  m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true;
  S.add(m); wallMeshes.push(m);
  walls.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
TX.floor.repeat.set(15, 20); TX.ceil.repeat.set(15, 20);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.floor);
fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; S.add(fl); wallMeshes.push(fl);
const ce = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.ceil);
ce.rotation.x = Math.PI / 2; ce.position.y = 7; S.add(ce);
const lampM = new THREE.MeshBasicMaterial({ color: 0xffe6ad });
for (let z = -32; z <= 36; z += 17) for (const x of [-15, 0, 15]) {
  const l = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.6), lampM);
  l.position.set(x, 6.9, z); S.add(l);
}
box(0, -40.5, 62, 1, 7, 'brick'); box(0, 40.5, 62, 1, 7, 'brick');
box(-30.5, 0, 1, 82, 7, 'brick'); box(30.5, 0, 1, 82, 7, 'brick');
box(-22, -28, 16, 1, 5, 'concrete'); box(0, -28, 16, 1, 5, 'concrete'); box(22, -28, 16, 1, 5, 'concrete');
box(-11, 33, 1, 14, 4.5, 'brick'); box(11, 33, 1, 14, 4.5, 'brick');
box(-6.5, 26, 9, 1, 4.5, 'brick'); box(6.5, 26, 9, 1, 4.5, 'brick');
[
  [-19, -12, 3, 10, 2.8, 'contR'], [19, -12, 3, 10, 2.8, 'contB'], [0, -16, 10, 3, 2.8, 'contB'],
  [-20, 6, 10, 3, 2.8, 'contR'], [20, 8, 10, 3, 2.8, 'contR'],
  [-6, -4, 2.4, 2.4, 2.4, 'crate'], [6, -2, 2.4, 2.4, 2.4, 'crate'], [-3, 2, 1.4, 1.4, 1, 'crate'],
  [9, 12, 2, 2, 2, 'crate'], [-10, 13, 2, 2, 2, 'crate'], [0, 11, 2.4, 2.4, 2.4, 'crate'],
  [14, 21, 2, 2, 2, 'crate'], [-15, 20, 2, 2, 2, 'crate'], [-26, -18, 3, 3, 3, 'crate'],
  [26, -20, 3, 3, 3, 'crate'], [-8, -22, 2, 2, 2, 'crate'], [8, -23, 2, 2, 2, 'crate']
].forEach(b => box(...b));

function ground(x, z, feet) {
  let g = 0;
  for (const b of walls) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.h <= feet + 0.5 && b.h > g) g = b.h;
  return g;
}
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
  const dx = b.x - a.x, dz = b.z - a.z, n = Math.ceil(Math.hypot(dx, dz) / 0.7);
  for (let i = 1; i < n; i++) {
    const x = a.x + dx * i / n, z = a.z + dz * i / n;
    for (const w of walls) if (w.h > hgt && x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return false;
  }
  return true;
}

// ---------- Audio ----------
let AC, NB;
function snd(vol, dur, freq, type, pan = 0) {
  if (!AC) return;
  const t = AC.currentTime, g = AC.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  if (AC.createStereoPanner) {
    const p = AC.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p); p.connect(AC.destination);
  } else g.connect(AC.destination);
  if (type === 'tone') {
    const o = AC.createOscillator();
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.3), t + dur);
    o.connect(g); o.start(t); o.stop(t + dur);
  } else {
    if (!NB) {
      NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = NB.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = AC.createBufferSource(); s.buffer = NB;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5, dur);
  }
}
function panTo(x, z) {
  const dx = x - P.x, dz = z - P.z;
  return Math.sin(Math.atan2(dx, dz) - P.yaw) * Math.min(1, Math.hypot(dx, dz) / 25);
}
function gunSnd(w, pan, k = 1) {
  snd(w.snd[0] * k, w.snd[1], w.snd[2], 'noise', pan);
  snd(w.snd[0] * 0.75 * k, 0.1, 160, 'tone', pan);
}

const WP = [
  { n: 'USP .45', dmg: 36, rof: 0.16, mag: 12, res: 100, spr: 0.005, rec: 0.007, auto: false, snd: [0.35, 0.11, 2400] },
  { n: 'M4A1', dmg: 34, rof: 0.085, mag: 30, res: 90, spr: 0.008, rec: 0.0045, auto: true, snd: [0.48, 0.13, 3400] },
  { n: 'AWP', dmg: 120, rof: 1.4, mag: 10, res: 30, spr: 0.0008, rec: 0.022, auto: false, snd: [0.9, 0.38, 1700] }
];
WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
const P = { x: 0, y: 0, z: 31, vy: 0, yaw: 0, pitch: 0, hp: 100, w: 1, cd: 0, rl: 0, rlT: 1, zoom: false, semi: true, kick: 0, draw: 0, walk: 0, step: 0 };

// ---------- FP weapons ----------
const gunM = {
  steel: new THREE.MeshStandardMaterial({ color: 0x6a6e72, roughness: 0.28, metalness: 0.88 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1c1e1c, roughness: 0.55, metalness: 0.4 }),
  polymer: new THREE.MeshStandardMaterial({ color: 0x2a2c28, roughness: 0.78, metalness: 0.08 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x151714, roughness: 0.92, metalness: 0 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xc4a07a, roughness: 0.88, metalness: 0 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x1a3040, roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.7 })
};
const mzTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, '#fff'); g.addColorStop(0.2, '#ffcc66'); g.addColorStop(0.5, '#ff6600'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
function gunBox(p, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; p.add(m); return m;
}
function gunCyl(p, r1, r2, len, mat, x, y, z, segs = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, segs), mat);
  m.rotation.x = Math.PI / 2; m.position.set(x, y, z); m.castShadow = true; p.add(m); return m;
}
function sight(p, x, y, z) {
  gunBox(p, 0.032, 0.05, 0.06, gunM.dark, x, y, z);
  gunBox(p, 0.01, 0.022, 0.014, gunM.steel, x, y + 0.032, z);
}
function mkGun(i) {
  const g = new THREE.Group(); let mz;
  if (i === 0) {
    gunBox(g, 0.1, 0.1, 0.34, gunM.steel, 0, 0.025, -0.11);
    gunBox(g, 0.08, 0.042, 0.18, gunM.dark, 0, 0.072, -0.16);
    gunCyl(g, 0.02, 0.02, 0.15, gunM.dark, 0, 0.032, -0.34, 12);
    gunBox(g, 0.085, 0.07, 0.2, gunM.polymer, 0, -0.04, 0.04);
    gunBox(g, 0.07, 0.17, 0.09, gunM.rubber, 0, -0.14, 0.12).rotation.x = -0.15;
    gunBox(g, 0.022, 0.08, 0.03, gunM.steel, 0, -0.09, -0.03).rotation.z = -0.1;
    sight(g, 0, 0.09, -0.28); mz = -0.42;
  } else if (i === 1) {
    gunBox(g, 0.11, 0.11, 0.36, gunM.dark, 0, 0.005, 0.02);
    gunBox(g, 0.1, 0.095, 0.25, gunM.steel, 0, 0.016, -0.22);
    gunCyl(g, 0.022, 0.022, 0.55, gunM.steel, 0, 0.024, -0.58, 14);
    gunCyl(g, 0.03, 0.03, 0.09, gunM.dark, 0, 0.024, -0.88, 12);
    gunBox(g, 0.1, 0.09, 0.36, gunM.polymer, 0, 0.005, -0.52);
    gunBox(g, 0.08, 0.15, 0.22, gunM.dark, 0, -0.1, 0.18).rotation.x = -0.12;
    gunBox(g, 0.09, 0.11, 0.16, gunM.polymer, 0, -0.18, 0.3).rotation.x = -0.16;
    gunBox(g, 0.08, 0.17, 0.09, gunM.rubber, 0, -0.1, 0.44).rotation.x = -0.1;
    gunBox(g, 0.095, 0.032, 0.15, gunM.dark, 0, 0.11, -0.08);
    sight(g, 0, 0.15, -0.16); sight(g, 0, 0.08, -0.76);
    gunBox(g, 0.065, 0.15, 0.1, gunM.rubber, 0, -0.12, 0.1).rotation.x = -0.18; mz = -0.95;
  } else {
    gunBox(g, 0.11, 0.12, 0.5, gunM.polymer, 0, 0, 0.14);
    gunBox(g, 0.1, 0.085, 0.38, gunM.steel, 0, 0.022, -0.18);
    gunCyl(g, 0.024, 0.024, 0.74, gunM.steel, 0, 0.028, -0.74, 16);
    gunCyl(g, 0.038, 0.038, 0.07, gunM.dark, 0, 0.028, -1.14, 12);
    gunBox(g, 0.08, 0.1, 0.28, gunM.polymer, 0, -0.04, 0.44).rotation.x = -0.08;
    gunCyl(g, 0.05, 0.05, 0.32, gunM.dark, 0, 0.16, -0.24, 16);
    gunCyl(g, 0.06, 0.06, 0.04, gunM.steel, 0, 0.16, -0.1, 12);
    gunCyl(g, 0.055, 0.055, 0.04, gunM.steel, 0, 0.16, -0.4, 12);
    gunBox(g, 0.065, 0.17, 0.11, gunM.rubber, 0, -0.14, 0.18).rotation.x = -0.16;
    const leg1 = gunBox(g, 0.016, 0.2, 0.022, gunM.steel, -0.06, -0.11, -0.62); leg1.rotation.z = -0.15;
    const leg2 = gunBox(g, 0.016, 0.2, 0.022, gunM.steel, 0.06, -0.11, -0.62); leg2.rotation.z = 0.15;
    sight(g, 0, 0.09, -0.86); mz = -1.2;
  }
  gunBox(g, 0.11, 0.12, 0.2, gunM.skin, 0.1, -0.18, 0.25).rotation.x = -0.2;
  gunBox(g, 0.09, 0.08, 0.11, gunM.rubber, 0.1, -0.16, 0.16);
  if (i > 0) {
    gunBox(g, 0.11, 0.11, 0.18, gunM.skin, -0.11, -0.18, -0.4).rotation.x = -0.14;
    gunBox(g, 0.09, 0.08, 0.1, gunM.rubber, -0.11, -0.16, -0.48);
  }
  const f = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.28),
    new THREE.MeshBasicMaterial({ map: mzTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  );
  f.position.set(0, 0.01, mz); f.visible = false; g.add(f); g.userData.mz = f; g.visible = false; cam.add(g);
  return g;
}
const guns = [0, 1, 2].map(mkGun);
const flash = new THREE.PointLight(0xffcc66, 0, 7); flash.position.set(0.18, -0.08, -0.9); cam.add(flash);

// ---------- CS-style Terrorist character ----------
// Classic T look: black balaclava, dark olive fatigues, tactical vest, AK held across body.
// Face / muzzle point local -Z so rotation.y = atan2(dx,dz)+PI faces the target.
const matCache = {};
function sm(color, roughness = 0.85, metalness = 0) {
  const k = color + '_' + roughness + '_' + metalness;
  return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({ color, roughness, metalness }));
}
function addMesh(parent, geo, mat, x, y, z, parts, extra = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  Object.assign(m.userData, extra);
  parent.add(m); if (parts) parts.push(m); return m;
}

function makeAK(parent, parts) {
  const g = new THREE.Group(); parent.add(g);
  // Held across body, barrel pointing local -Z (same as face)
  g.position.set(0.18, 1.15, -0.15);
  g.rotation.set(-0.15, 0.12, 0.35);
  const wood = sm(0x5c3a1e, 0.7, 0.05);
  const steel = sm(0x3a3e3c, 0.32, 0.82);
  const dark = sm(0x1a1c1a, 0.55, 0.35);
  addMesh(g, new THREE.BoxGeometry(0.07, 0.09, 0.32), dark, 0, 0.02, -0.05, parts);
  addMesh(g, new THREE.BoxGeometry(0.065, 0.07, 0.2), steel, 0, 0.02, -0.28, parts);
  const barrel = addMesh(g, new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8), steel, 0, 0.02, -0.52, parts);
  barrel.rotation.x = Math.PI / 2;
  addMesh(g, new THREE.BoxGeometry(0.06, 0.08, 0.14), wood, 0, 0.01, 0.14, parts);
  addMesh(g, new THREE.BoxGeometry(0.05, 0.12, 0.055), dark, 0, -0.06, -0.08, parts);
  const mag = addMesh(g, new THREE.BoxGeometry(0.04, 0.14, 0.06), dark, 0, -0.1, -0.12, parts);
  mag.rotation.x = 0.25;
  addMesh(g, new THREE.BoxGeometry(0.04, 0.03, 0.05), dark, 0, 0.07, -0.35, parts);
  return g;
}

function terrorist(palette) {
  const g = new THREE.Group(), parts = [];
  const skin = sm(palette.skin, 0.9);
  const shirt = sm(palette.shirt, 0.92);
  const pants = sm(palette.pants, 0.9);
  const vest = sm(palette.vest, 0.88);
  const boot = sm(0x121412, 0.8, 0.05);
  const wrap = sm(palette.wrap || 0x1a1a18, 0.9); // balaclava
  const web = sm(0x1c201c, 0.85);

  // Legs with hip pivots for walk cycle
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.13, 0.92, 0); legR.position.set(0.13, 0.92, 0);
  g.add(legL, legR);
  function makeLeg(pivot) {
    addMesh(pivot, new THREE.CylinderGeometry(0.09, 0.11, 0.44, 10), pants, 0, -0.22, 0, parts);
    addMesh(pivot, new THREE.CylinderGeometry(0.07, 0.09, 0.38, 10), pants, 0, -0.62, 0.01, parts);
    addMesh(pivot, new THREE.BoxGeometry(0.16, 0.1, 0.26), boot, 0, -0.88, -0.03, parts);
  }
  makeLeg(legL); makeLeg(legR);

  // Torso
  addMesh(g, new THREE.CylinderGeometry(0.22, 0.18, 0.55, 12), shirt, 0, 1.28, 0, parts).scale.set(1.1, 1, 0.75);
  addMesh(g, new THREE.BoxGeometry(0.36, 0.4, 0.18), vest, 0, 1.35, -0.02, parts);
  // Pouches
  for (const sx of [-1, 1]) {
    addMesh(g, new THREE.BoxGeometry(0.1, 0.12, 0.08), web, sx * 0.14, 1.22, -0.12, parts);
    addMesh(g, new THREE.BoxGeometry(0.09, 0.14, 0.07), vest, sx * 0.2, 1.38, -0.06, parts);
  }
  addMesh(g, new THREE.BoxGeometry(0.42, 0.07, 0.2), web, 0, 1.08, 0, parts);

  // Arms
  for (const side of [-1, 1]) {
    addMesh(g, new THREE.CylinderGeometry(0.07, 0.085, 0.3, 8), shirt, side * 0.34, 1.32, -0.02, parts).rotation.z = side * 0.15;
    addMesh(g, new THREE.CylinderGeometry(0.055, 0.07, 0.28, 8), shirt, side * 0.36, 1.02, -0.1, parts).rotation.x = -0.4;
    addMesh(g, new THREE.SphereGeometry(0.055, 8, 6), sm(0x1a1c1a, 0.9), side * 0.36, 0.86, -0.16, parts);
  }

  // Head + balaclava (CS terrorist silhouette)
  addMesh(g, new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10), wrap, 0, 1.62, 0, parts);
  const head = addMesh(g, new THREE.SphereGeometry(0.14, 12, 10), wrap, 0, 1.78, 0, parts, { head: true });
  // Eye slits
  addMesh(g, new THREE.BoxGeometry(0.1, 0.025, 0.04), sm(0x0a0a0a), 0, 1.8, -0.12, parts);
  addMesh(g, new THREE.SphereGeometry(0.018, 6, 6), sm(0x222222), -0.04, 1.8, -0.125, parts);
  addMesh(g, new THREE.SphereGeometry(0.018, 6, 6), sm(0x222222), 0.04, 1.8, -0.125, parts);
  // Small skin patch at neck
  addMesh(g, new THREE.CylinderGeometry(0.06, 0.07, 0.06, 8), skin, 0, 1.55, 0.02, parts);

  // AK-47
  makeAK(g, parts);

  // Reliable hit volumes (not dependent on detailed mesh)
  const inv = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false });
  const bodyHit = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 1.2, 8), inv);
  bodyHit.position.set(0, 0.95, 0);
  const headHit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), inv);
  headHit.position.set(0, 1.78, 0); headHit.userData.head = true;
  g.add(bodyHit, headHit); parts.push(bodyHit, headHit);

  return { g, parts, legL, legR, head };
}

function hostageChar() {
  // Lighter, non-combatant look
  return terrorist({
    shirt: 0xb0aea0, pants: 0x4a5568, skin: 0xd0a888,
    vest: 0x8a8a7a, wrap: 0xc8a080 // no balaclava — use skin-ish head wrap simplified
  });
}

const T_PALETTES = [
  { shirt: 0x3a3c32, pants: 0x2a2c26, skin: 0x9a7055, vest: 0x2e322c, wrap: 0x141612 },
  { shirt: 0x3e3830, pants: 0x2c2a26, skin: 0xb07f5c, vest: 0x34302a, wrap: 0x1a1814 },
  { shirt: 0x353a30, pants: 0x262822, skin: 0x8d654f, vest: 0x2c3028, wrap: 0x121410 },
  { shirt: 0x403830, pants: 0x2a2824, skin: 0xa87858, vest: 0x38342c, wrap: 0x161412 }
];

function makeHostage() {
  const g = new THREE.Group(), parts = [];
  const skin = sm(0xd0a27f, 0.9), shirt = sm(0xb8b6a8, 0.92), pants = sm(0x4a5568, 0.9);
  const vest = sm(0x8b8b7b, 0.88), boot = sm(0x2a2a28, 0.8);
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.12, 0.9, 0); legR.position.set(0.12, 0.9, 0); g.add(legL, legR);
  for (const p of [legL, legR]) {
    addMesh(p, new THREE.CylinderGeometry(0.08, 0.1, 0.42, 8), pants, 0, -0.2, 0, parts);
    addMesh(p, new THREE.CylinderGeometry(0.065, 0.08, 0.36, 8), pants, 0, -0.58, 0, parts);
    addMesh(p, new THREE.BoxGeometry(0.14, 0.09, 0.24), boot, 0, -0.84, -0.02, parts);
  }
  addMesh(g, new THREE.CylinderGeometry(0.2, 0.17, 0.5, 10), shirt, 0, 1.25, 0, parts).scale.set(1.1, 1, 0.75);
  addMesh(g, new THREE.BoxGeometry(0.32, 0.28, 0.14), vest, 0, 1.3, -0.02, parts);
  for (const side of [-1, 1]) {
    addMesh(g, new THREE.CylinderGeometry(0.06, 0.075, 0.28, 8), shirt, side * 0.32, 1.28, 0, parts).rotation.z = side * 0.12;
    addMesh(g, new THREE.CylinderGeometry(0.05, 0.06, 0.26, 8), shirt, side * 0.34, 1.0, -0.08, parts).rotation.x = -0.3;
  }
  addMesh(g, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skin, 0, 1.55, 0, parts);
  const head = addMesh(g, new THREE.SphereGeometry(0.13, 10, 8), skin, 0, 1.72, 0, parts, { head: true });
  addMesh(g, new THREE.SphereGeometry(0.015, 6, 6), sm(0x1a1a1a), -0.04, 1.74, -0.11, parts);
  addMesh(g, new THREE.SphereGeometry(0.015, 6, 6), sm(0x1a1a1a), 0.04, 1.74, -0.11, parts);
  return { g, parts, legL, legR, head };
}
const hostages = [];
[[-6, 36], [-2, 37], [2, 36], [6, 37]].forEach(([x, z], i) => {
  const h = makeHostage();
  h.g.position.set(x, 0, z); h.g.rotation.y = Math.PI; S.add(h.g);
  Object.assign(h, { x, z, hp: 100, alive: true, i });
  hostages.push(h);
});

let bots = [], corpses = [], queue = 0, spawnT = 0, round = 0, clearT = 0, state = 'menu', time = 0;

function spawnBot() {
  const h = terrorist(T_PALETTES[Math.random() * T_PALETTES.length | 0]);
  Object.assign(h, {
    x: rnd(-22, 22), z: -36, y: 0, hp: 100,
    cd: 1.4 + Math.random() * 1.2, ph: Math.random() * 6,
    dead: false, t: 0, walk: 0, fall: 0
  });
  h.parts.forEach(p => { p.userData.bot = h; });
  h.g.position.set(h.x, 0, h.z);
  h.g.rotation.y = Math.atan2(0 - h.x, 30 - h.z) + Math.PI;
  S.add(h.g); bots.push(h);
}

function killBot(b, headshot) {
  if (b.dead) return;
  b.dead = true;
  b.fall = 0;
  b.fallDir = (Math.random() < 0.5 ? 1 : -1);
  bots = bots.filter(x => x !== b);
  corpses.push(b);
  feed('You killed a Terrorist' + (headshot ? '  · HEADSHOT' : ''));
  snd(0.15, 0.2, 80, 'noise');
}

// ---------- Effects ----------
const decals = [], fx = [];
const DG = new THREE.PlaneGeometry(0.14, 0.14);
const DM = new THREE.MeshBasicMaterial({ color: 0x0c0c0c, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
function decal(p, n) {
  const m = new THREE.Mesh(DG, DM);
  m.position.copy(p).addScaledVector(n, 0.01);
  m.lookAt(p.clone().add(n));
  S.add(m); decals.push(m);
  if (decals.length > 50) S.remove(decals.shift());
}
const PG = new THREE.BoxGeometry(0.04, 0.04, 0.04), PM = {};
function burst(p, col, n) {
  PM[col] = PM[col] || new THREE.MeshBasicMaterial({ color: col });
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(PG, PM[col]);
    m.position.copy(p); S.add(m);
    fx.push({ m, v: new THREE.Vector3(rnd(-2.5, 2.5), rnd(0.5, 3.5), rnd(-2.5, 2.5)), l: 0.45 + Math.random() * 0.2 });
  }
}
function feed(t) {
  const d = document.createElement('div'); d.textContent = t; $('feed').appendChild(d);
  setTimeout(() => d.remove(), 3500);
}
function ban(t) {
  const b = $('ban'); b.textContent = t; b.style.opacity = 1;
  setTimeout(() => { b.style.opacity = 0; }, 2200);
}
function hitMarker() {
  const el = $('hitmk'); el.style.opacity = 1;
  $('cross').classList.add('hit');
  setTimeout(() => { el.style.opacity = 0; $('cross').classList.remove('hit'); }, 120);
}

// ---------- Input ----------
const ts = {}, mv = { x: 0, y: 0 }; let firing = false;
const jb = $('jb'), jk = $('jk');
function setW() {
  guns.forEach((g, i) => { g.visible = i === P.w; });
  P.zoom = false; P.draw = 1; cam.fov = 75; cam.updateProjectionMatrix();
  $('scope').style.display = P.w === 2 ? 'flex' : 'none';
  $('sc').style.display = 'none';
}
function act(a, down) {
  if (state !== 'play') return;
  if (a === 'fire') { firing = down; if (down) P.semi = true; }
  else if (!down) return;
  else if (a === 'jump') { if (P.y <= ground(P.x, P.z, P.y) + 0.01) P.vy = 7; }
  else if (a === 'reload') reload();
  else if (a === 'swap') { P.w = (P.w + 1) % WP.length; P.rl = 0; setW(); }
  else if (a === 'scope') {
    P.zoom = !P.zoom; cam.fov = P.zoom ? 22 : 75; cam.updateProjectionMatrix();
    $('sc').style.display = P.zoom ? 'block' : 'none';
  }
}
function look(dx, dy) {
  const s = P.zoom ? 0.0016 : 0.0042;
  P.yaw -= dx * s; P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - dy * s));
}
addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    const a = t.target.dataset && t.target.dataset.a;
    if (a) { act(a, true); ts[t.identifier] = { a }; continue; }
    if (t.clientX < innerWidth * 0.42) {
      jb.style.display = jk.style.display = 'block';
      jb.style.left = jk.style.left = t.clientX + 'px';
      jb.style.top = jk.style.top = t.clientY + 'px';
      ts[t.identifier] = { joy: true, ox: t.clientX, oy: t.clientY };
    } else ts[t.identifier] = { look: true, lx: t.clientX, ly: t.clientY };
  }
  e.preventDefault();
}, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    const s = ts[t.identifier]; if (!s) continue;
    if (s.joy) {
      let dx = t.clientX - s.ox, dy = t.clientY - s.oy;
      const len = Math.hypot(dx, dy), max = 48;
      if (len > max) { dx *= max / len; dy *= max / len; }
      mv.x = dx / max; mv.y = dy / max;
      jk.style.left = (s.ox + dx) + 'px'; jk.style.top = (s.oy + dy) + 'px';
    } else if (s.look) {
      look(t.clientX - s.lx, t.clientY - s.ly);
      s.lx = t.clientX; s.ly = t.clientY;
    }
  }
  e.preventDefault();
}, { passive: false });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    const s = ts[t.identifier];
    if (s && s.a) act(s.a, false);
    if (s && s.joy) { mv.x = mv.y = 0; jb.style.display = jk.style.display = 'none'; }
    delete ts[t.identifier];
  }
});
addEventListener('mousedown', e => {
  if (e.button === 0 && state === 'play') { firing = true; P.semi = true; }
});
addEventListener('mouseup', () => { firing = false; });
addEventListener('mousemove', e => {
  if (state === 'play' && (e.buttons & 1 || document.pointerLockElement)) look(e.movementX, e.movementY);
});
addEventListener('keydown', e => {
  if (state !== 'play') return;
  if (e.code === 'KeyR') reload();
  if (e.code === 'KeyQ' || e.code === 'KeyE') { P.w = (P.w + 1) % WP.length; P.rl = 0; setW(); }
  if (e.code === 'Space') { if (P.y <= ground(P.x, P.z, P.y) + 0.01) P.vy = 7; }
  if (e.code === 'KeyC' && P.w === 2) act('scope', true);
});
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; });
addEventListener('keyup', e => { keys[e.code] = false; });

// ---------- Combat ----------
const ray = new THREE.Raycaster(); ray.far = 90;
function reload() {
  const w = WP[P.w];
  if (P.rl > 0 || w.ammo === w.mag || w.reserve <= 0) return;
  P.rlT = P.w === 2 ? 2.8 : 2.1; P.rl = P.rlT;
  snd(0.18, 0.08, 900, 'tone');
}
function shoot() {
  const w = WP[P.w];
  if (P.cd > 0 || P.rl > 0 || P.draw > 0.5) return;
  if (w.ammo <= 0) { snd(0.2, 0.05, 300, 'tone'); P.cd = 0.3; reload(); return; }
  if (!w.auto && !P.semi) return;
  P.semi = false; w.ammo--; P.cd = w.rof; P.kick = 0.1;
  const sp = w.spr * (P.zoom || P.w !== 2 ? 1 : 8) * (P.y > 0.01 ? 2.5 : 1) * (1 + Math.hypot(mv.x, mv.y) * 0.8);
  ray.setFromCamera({ x: (Math.random() - 0.5) * sp * 6, y: (Math.random() - 0.5) * sp * 6 }, cam);
  const hitTargets = wallMeshes.slice();
  for (const b of bots) if (!b.dead && b.parts) hitTargets.push(...b.parts);
  const hits = ray.intersectObjects(hitTargets, false);
  if (hits.length) {
    const h = hits[0], u = h.object.userData;
    if (u.bot) {
      const b = u.bot;
      b.hp -= w.dmg * (u.head ? 4 : 1);
      burst(h.point, 0xaa0000, 7);
      hitMarker();
      if (b.hp <= 0) killBot(b, !!u.head);
    } else {
      if (h.face) decal(h.point, h.face.normal.clone().transformDirection(h.object.matrixWorld));
      burst(h.point, 0x9a9488, 4);
    }
  }
  P.pitch += w.rec * (0.25 + Math.random() * 0.25);
  P.yaw += (Math.random() - 0.5) * w.rec * 0.25;
  gunSnd(w, 0);
  guns[P.w].userData.mz.visible = true;
  guns[P.w].userData.mz.rotation.z = rnd(0, 6);
  flash.intensity = 2.2;
  setTimeout(() => { guns[P.w].userData.mz.visible = false; flash.intensity = 0; }, 40);
  if (w.ammo === 0) reload();
}
function hurt(n) {
  P.hp -= n;
  $('dmg').style.opacity = 1;
  setTimeout(() => { $('dmg').style.opacity = 0; }, 140);
  snd(0.28, 0.1, 110, 'tone');
  if (P.hp <= 0) over('You were killed.');
}

function newRound() {
  round++;
  queue = Math.min(3 + round * 2, 14);
  spawnT = 1.8; clearT = 0;
  bots.concat(corpses).forEach(b => S.remove(b.g));
  bots = []; corpses = [];
  P.hp = 100;
  WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
  Object.assign(P, { x: 0, z: 31, y: 0, vy: 0, yaw: 0, pitch: 0, rl: 0 });
  hostages.forEach(h => {
    h.hp = 100; h.alive = true;
    h.g.rotation.x = 0; h.g.position.y = 0;
  });
  setW();
  ban('ROUND ' + round + '  —  DEFEND THE HOSTAGES');
  snd(0.22, 0.14, 780, 'tone');
}
function over(msg) {
  state = 'over'; firing = false; $('sc').style.display = 'none';
  $('ovt').textContent = 'MISSION FAILED';
  $('ovp').textContent = msg + ' You reached round ' + round + '.';
  $('go').textContent = 'Try again';
  $('ov').style.display = 'flex';
  round = 0;
}
$('go').addEventListener('click', () => {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) {}
  try {
    document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {});
  } catch (e) {}
  $('ov').style.display = 'none';
  $('hp').style.display = 'block';
  state = 'play';
  newRound();
});

// ---------- Main loop ----------
const rc = $('rad').getContext('2d');
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; time += dt;
  if (state === 'play') update(dt);
  R.render(S, cam);
}
function radar() {
  rc.clearRect(0, 0, 96, 96);
  rc.fillStyle = 'rgba(0,0,0,.5)'; rc.beginPath(); rc.arc(48, 48, 48, 0, 7); rc.fill();
  rc.strokeStyle = 'rgba(232,200,74,.25)'; rc.lineWidth = 1;
  rc.beginPath(); rc.arc(48, 48, 24, 0, 7); rc.stroke();
  const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
  const dot = (o, col) => {
    const dx = o.x - P.x, dz = o.z - P.z;
    const rx = (dx * c - dz * s) * 1.15, fy = (-dx * s - dz * c) * 1.15;
    if (Math.hypot(rx, fy) > 44) return;
    rc.fillStyle = col; rc.fillRect(48 + rx - 2, 48 - fy - 2, 4, 4);
  };
  hostages.forEach(h => h.alive && dot(h, '#4da6ff'));
  bots.forEach(b => los(b, P) && dot(b, '#ff3b2f'));
  rc.fillStyle = '#fff';
  rc.beginPath(); rc.moveTo(48, 42); rc.lineTo(44, 52); rc.lineTo(52, 52); rc.fill();
}

function update(dt) {
  // Keyboard move (desktop)
  if (keys['KeyW'] || keys['ArrowUp']) mv.y = -1;
  else if (keys['KeyS'] || keys['ArrowDown']) mv.y = 1;
  else if (!Object.keys(ts).some(id => ts[id].joy)) mv.y = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) mv.x = -1;
  else if (keys['KeyD'] || keys['ArrowRight']) mv.x = 1;
  else if (!Object.keys(ts).some(id => ts[id].joy)) mv.x = Math.abs(mv.x) < 0.05 ? 0 : mv.x;

  const sp = 5.6 * (P.zoom ? 0.48 : 1);
  const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
  const fwd = -mv.y, str = mv.x;
  P.x += (-s * fwd + c * str) * sp * dt;
  P.z += (-c * fwd - s * str) * sp * dt;
  P.vy -= 20 * dt; P.y += P.vy * dt; push(P, 0.4);
  const gnd = ground(P.x, P.z, P.y);
  if (P.y <= gnd) { P.y = gnd; P.vy = 0; }
  P.x = Math.max(-29.4, Math.min(29.4, P.x));
  P.z = Math.max(-39.4, Math.min(39.4, P.z));
  const spd = Math.hypot(mv.x, mv.y) * (P.y <= gnd + 0.01 ? 1 : 0);
  P.walk += dt * 9 * spd;
  P.step -= dt * spd;
  if (P.step <= 0 && spd > 0.3) { P.step = 0.38; snd(0.04, 0.04, 480, 'noise', 0); }
  P.kick *= Math.pow(0.001, dt); P.cd -= dt; P.draw = Math.max(0, P.draw - dt * 3);
  cam.position.set(P.x, P.y + 1.62 + Math.sin(P.walk) * 0.028 * spd, P.z);
  cam.rotation.set(P.pitch, P.yaw, 0);

  const gn = guns[P.w], rp = P.rl > 0 ? Math.sin((1 - P.rl / P.rlT) * Math.PI) : 0;
  gn.position.set(0.17 + Math.cos(P.walk * 0.5) * 0.01 * spd, -0.19 + Math.sin(P.walk) * 0.01 * spd - P.draw * 0.38 - rp * 0.14, -0.38 + P.kick);
  gn.rotation.x = -rp * 0.55 + P.kick * 0.45;
  gn.visible = !P.zoom;

  const w = WP[P.w];
  if (P.rl > 0) {
    P.rl -= dt;
    if (P.rl <= 0) {
      const n = Math.min(w.mag - w.ammo, w.reserve);
      w.ammo += n; w.reserve -= n;
    }
  }
  if (firing) shoot();

  // Spawning
  spawnT -= dt;
  if (queue > 0 && spawnT <= 0) { spawnBot(); queue--; spawnT = 2.0; }

  // Bots AI
  for (const b of bots) {
    b.ph += dt;
    let t = null, best = 1e9;
    const dp = Math.hypot(P.x - b.x, P.z - b.z);
    if (dp < 26 && los(b, P)) { t = P; best = dp; }
    else for (const h of hostages) if (h.alive) {
      const d = Math.hypot(h.x - b.x, h.z - b.z);
      if (d < best) { best = d; t = h; }
    }
    if (!t) continue;
    const seen = los(b, t), td = Math.hypot(t.x - b.x, t.z - b.z) || 1;
    let wx = t.x, wz = t.z;
    if (b.z < -27 && Math.abs(b.x) > 10) { wz = -27; wx = b.x > 0 ? 11 : -11; }
    else if (t.z > 27 && b.z < 26.5) { wx = 0; wz = Math.abs(b.x) < 1.6 ? 30 : 23; }
    const dx = wx - b.x, dz = wz - b.z, dd = Math.hypot(dx, dz) || 1;
    const mvg = !(seen && td < 11);
    if (mvg) {
      b.x += dx / dd * 3.5 * dt;
      b.z += dz / dd * 3.5 * dt;
      b.walk += dt * 8;
    } else {
      b.x += -(t.z - b.z) / td * Math.sin(b.ph * 1.2) * 1.6 * dt;
      b.z += (t.x - b.x) / td * Math.sin(b.ph * 1.2) * 1.6 * dt;
    }
    push(b, 0.42);
    b.g.position.set(b.x, 0, b.z);
    // Face target: model faces local -Z
    b.g.rotation.y = Math.atan2(t.x - b.x, t.z - b.z) + Math.PI;
    b.g.updateMatrixWorld(true);
    if (b.legL && b.legR) {
      const swing = Math.sin(b.walk) * 0.65 * (mvg ? 1 : 0.15);
      b.legL.rotation.x = swing;
      b.legR.rotation.x = -swing;
    }
    b.cd -= dt;
    if (b.cd <= 0 && td < 32 && seen) {
      b.cd = 0.8 + Math.random() * 0.85;
      gunSnd(WP[1], panTo(b.x, b.z), Math.max(0.12, 0.55 - td * 0.018));
      // muzzle flash point
      const mx = b.x - Math.sin(b.g.rotation.y) * 0.6;
      const mz = b.z - Math.cos(b.g.rotation.y) * 0.6;
      burst(new THREE.Vector3(mx, 1.25, mz), 0xffaa44, 3);
      if (t === P) {
        if (Math.random() < Math.max(0.07, 0.36 - td / 70)) hurt(7 + Math.random() * 6);
      } else if (Math.random() < 0.55) {
        t.hp -= 12;
        if (t.hp <= 0) {
          t.alive = false;
          t.g.rotation.x = Math.PI / 2;
          t.g.position.y = 0.2;
          feed('Terrorist killed a Hostage');
        }
      }
    }
  }

  // Corpses: fall over and settle
  corpses = corpses.filter(b => {
    b.t += dt;
    b.fall = Math.min(1, b.fall + dt * 2.8);
    const f = b.fall;
    // Fall sideways then flat
    b.g.rotation.x = f * (Math.PI / 2) * 0.95;
    b.g.rotation.z = f * 0.35 * b.fallDir;
    b.g.position.y = Math.sin(f * Math.PI) * 0.12;
    if (f > 0.85) b.g.position.y = 0.08;
    if (b.t > 6) { S.remove(b.g); return false; }
    return true;
  });

  hostages.forEach(h => {
    if (h.alive) h.g.rotation.y = Math.PI + Math.sin(time * 0.7 + h.i) * 0.25;
  });

  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.v.y -= 10 * dt;
    f.m.position.addScaledVector(f.v, dt);
    if ((f.l -= dt) <= 0) { S.remove(f.m); fx.splice(i, 1); }
  }

  // HUD
  const alive = hostages.filter(h => h.alive).length;
  $('tl').innerHTML = 'Round ' + round + '<br>Hostages ' + alive + '/4<br>Terrorists ' + (bots.length + queue);
  $('tr').innerHTML = w.n + '<br>' + (P.rl > 0 ? 'RELOADING…' : w.ammo + ' / ' + w.reserve);
  const hpEl = $('hp');
  hpEl.textContent = '❤ ' + Math.max(0, Math.ceil(P.hp));
  hpEl.classList.toggle('low', P.hp < 35);
  radar();

  if (alive <= 2) over('Two hostages were lost.');
  else if (!bots.length && !queue) {
    if (!clearT) { clearT = 2.8; ban('ROUND CLEARED'); snd(0.2, 0.15, 600, 'tone'); }
    else if ((clearT -= dt) <= 0) newRound();
  }
}
requestAnimationFrame(loop);
