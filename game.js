// CT Assault - CS 1.6 inspired FPS for mobile browsers. Needs three.js r128 (loaded in index.html).
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 2.25));
R.outputEncoding = THREE.sRGBEncoding;
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.0; R.physicallyCorrectLights = true;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;
const S = new THREE.Scene();
S.background = new THREE.Color(0x59636b);
S.fog = new THREE.Fog(0x59636b, 42, 145);
const cam = new THREE.PerspectiveCamera(75, 1, 0.05, 100);
cam.rotation.order = 'YXZ'; S.add(cam);
function resize() { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
S.add(new THREE.HemisphereLight(0xdde8f1, 0x343a32, 1.25));
const sun = new THREE.DirectionalLight(0xffe8cf, 2.1);
sun.position.set(-18, 28, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -36; sun.shadow.camera.right = 36;
sun.shadow.camera.top = 44; sun.shadow.camera.bottom = -44;
sun.shadow.bias = -0.0005;
S.add(sun);
[[0, 6, -14], [0, 6, 10], [0, 6, 33]].forEach(p => { const l = new THREE.PointLight(0xfff0cc, 0.55, 45); l.position.set(...p); S.add(l); });

// ---------- Procedural textures (90s-style pixel look) ----------
function tex(f) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); f(x);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy()); return t;
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
const MT = {};
for (const k in TX) {
  MT[k] = new THREE.MeshStandardMaterial({
    map: TX[k], roughness: 0.88, metalness: k.startsWith('cont') ? 0.18 : 0.04
  });
}

// ---------- Map: warehouse inspired by cs_assault (T spawn north, hostage room south) ----------
const walls = [], wallMeshes = [];
function box(x, z, w, d, h, k) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * sz[f][0] / 2, uv.getY(j) * sz[f][1] / 2); }
  const m = new THREE.Mesh(g, MT[k]); m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; S.add(m); wallMeshes.push(m);
  walls.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
TX.floor.repeat.set(15, 20); TX.ceil.repeat.set(15, 20);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.floor); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; S.add(fl); wallMeshes.push(fl);
const ce = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), MT.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = 7; S.add(ce);
const lampM = new THREE.MeshBasicMaterial({ color: 0xffe6ad });
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
  { n: 'USP .45', dmg: 34, rof: 0.17, mag: 12, res: 100, spr: 0.006, rec: 0.008, auto: false, snd: [0.35, 0.12, 2500] },
  { n: 'M4A1', dmg: 33, rof: 0.09, mag: 30, res: 90, spr: 0.009, rec: 0.005, auto: true, snd: [0.5, 0.14, 3500] },
  { n: 'AWP', dmg: 115, rof: 1.45, mag: 10, res: 30, spr: 0.001, rec: 0.025, auto: false, snd: [0.9, 0.4, 1800] }
];
const P = { x: 0, y: 0, z: 31, vy: 0, yaw: 0, pitch: 0, hp: 100, w: 1, cd: 0, rl: 0, rlT: 1, zoom: false, semi: true, kick: 0, draw: 0, walk: 0, step: 0 };
WP.forEach(w => { w.ammo = w.mag; w.reserve = w.res; });
function bx(w, h, d, col, x, y, z, p) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.22 })); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; }
const mzTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffd060'); g.addColorStop(1, 'rgba(255,120,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
// Detailed first-person weapon meshes. Local forward is -Z; layered parts and
// contrasting roughness make the silhouettes read much closer to real firearms.
const gunM = {
  steel: new THREE.MeshStandardMaterial({ color: 0x252a2d, roughness: 0.28, metalness: 0.82 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x101315, roughness: 0.58, metalness: 0.32 }),
  polymer: new THREE.MeshStandardMaterial({ color: 0x202522, roughness: 0.88, metalness: 0.02 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x111211, roughness: 0.96, metalness: 0.0 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x8b7650, roughness: 0.36, metalness: 0.72 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x182b30, roughness: 0.12, metalness: 0.55 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xb98562, roughness: 0.9 })
};
function gunBox(p, w,h,d, mat, x,y,z, bevel=0) {
  // Rounded, bevelled hard-surface parts: avoids the toy-like sharp-box silhouette.
  const r = Math.max(.002, Math.min(w,h,d) * (bevel || .085));
  const sh = new THREE.Shape(), a=w/2-r, b=h/2-r;
  sh.moveTo(-a-r,-b); sh.lineTo(a,-b); sh.quadraticCurveTo(a+r,-b,a+r,-b+r);
  sh.lineTo(a+r,b); sh.quadraticCurveTo(a+r,b+r,a,b+r); sh.lineTo(-a,b+r);
  sh.quadraticCurveTo(-a-r,b+r,-a-r,b); sh.lineTo(-a-r,-b+r); sh.quadraticCurveTo(-a-r,-b,-a,-b);
  const geo = new THREE.ExtrudeGeometry(sh,{depth:Math.max(.004,d-2*r),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.42,bevelThickness:r*.42,curveSegments:4});
  geo.translate(0,0,-(d-2*r)/2);
  const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; p.add(m); return m;
}
function gunCyl(p, r1,r2,len,mat,x,y,z,segments=16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,segments),mat);
  m.rotation.x=Math.PI/2; m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; p.add(m); return m;
}
function sight(p,x,y,z) {
  gunBox(p,.035,.055,.07,gunM.dark,x,y,z);
  gunBox(p,.012,.026,.015,gunM.steel,x,y+.038,z);
}
function mkGun(i) {
  const g = new THREE.Group(); let mz;
  if (i === 0) { // compact service pistol: slide, frame, barrel, sights, trigger and magazine
    gunBox(g,.105,.105,.36,gunM.steel,0,.025,-.12);
    gunBox(g,.082,.045,.20,gunM.dark,0,.077,-.17);
    gunCyl(g,.022,.022,.16,gunM.dark,0,.035,-.36,16);
    gunBox(g,.09,.075,.22,gunM.polymer,0,-.045,.045);
    gunBox(g,.075,.19,.095,gunM.rubber,0,-.15,.13).rotation.x=-.16;
    gunBox(g,.082,.025,.06,gunM.dark,0,-.255,.16);
    gunBox(g,.024,.09,.035,gunM.steel,0,-.1,-.035).rotation.z=-.12;
    gunBox(g,.035,.025,.045,gunM.dark,0,.092,-.08); sight(g,0,.093,-.31);
    for(let k=0;k<5;k++) gunBox(g,.108,.009,.018,gunM.dark,0,.068,-.04-k*.045);
    gunBox(g,.045,.03,.04,gunM.dark,0,.088,-.31); mz=-.43;
  } else if (i === 1) { // M4-style carbine with carry handle/optic, handguard, magazine and stock
    gunBox(g,.12,.12,.38,gunM.dark,0,.005,.02);
    gunBox(g,.105,.10,.27,gunM.steel,0,.018,-.24);
    gunCyl(g,.023,.023,.57,gunM.steel,0,.025,-.60,18);
    gunCyl(g,.032,.032,.10,gunM.dark,0,.025,-.91,18);
    gunBox(g,.105,.095,.38,gunM.polymer,0,.005,-.54);
    for(let k=0;k<7;k++) gunBox(g,.112,.012,.022,k%2?gunM.dark:gunM.steel,0,.055,-.38-k*.047);
    gunBox(g,.082,.16,.25,gunM.dark,0,-.105,.19).rotation.x=-.12;
    gunBox(g,.095,.12,.18,gunM.polymer,0,-.19,.33).rotation.x=-.18;
    gunBox(g,.085,.19,.10,gunM.rubber,0,-.105,.48).rotation.x=-.10;
    gunBox(g,.055,.20,.035,gunM.dark,0,-.12,.51);
    gunBox(g,.10,.035,.17,gunM.dark,0,.12,-.10);
    gunBox(g,.06,.045,.09,gunM.steel,0,.15,-.10);
    sight(g,0,.17,-.18); sight(g,0,.09,-.80);
    gunBox(g,.035,.04,.16,gunM.dark,0,.085,-.48);
    gunBox(g,.06,.055,.09,gunM.dark,0,-.025,.00);
    gunBox(g,.045,.035,.045,gunM.steel,.03,-.05,.07);
    // ribbed pistol grip and trigger guard
    gunBox(g,.068,.16,.11,gunM.rubber,.005,-.13,.11).rotation.x=-.2;
    gunBox(g,.012,.055,.07,gunM.steel,0,-.08,-.005);
    mz=-.98;
  } else { // long precision rifle with scope, bipod, heavy barrel and cheek rest
    gunBox(g,.12,.13,.54,gunM.polymer,0,.0,.16);
    gunBox(g,.105,.09,.40,gunM.steel,0,.025,-.20);
    gunCyl(g,.025,.025,.78,gunM.steel,0,.03,-.78,20);
    gunCyl(g,.04,.04,.08,gunM.dark,0,.03,-1.19,20);
    gunBox(g,.085,.11,.31,gunM.polymer,0,-.045,.47).rotation.x=-.08;
    gunBox(g,.09,.08,.14,gunM.rubber,0,-.075,.63);
    gunBox(g,.11,.04,.16,gunM.dark,0,.085,-.18);
    // scope tube and two mounting rings
    gunCyl(g,.052,.052,.34,gunM.dark,0,.17,-.26,20);
    gunCyl(g,.065,.065,.045,gunM.steel,0,.17,-.10,20);
    gunCyl(g,.06,.06,.045,gunM.steel,0,.17,-.42,20);
    gunCyl(g,.045,.045,.025,gunM.glass,0,.17,-.455,20);
    gunCyl(g,.045,.045,.025,gunM.glass,0,.17,-.075,20);
    gunBox(g,.10,.025,.08,gunM.dark,0,.12,-.26);
    gunBox(g,.07,.19,.12,gunM.rubber,0,-.15,.19).rotation.x=-.18;
    gunBox(g,.11,.07,.04,gunM.dark,0,-.23,.19);
    // folded bipod legs
    const leg1=gunBox(g,.018,.23,.025,gunM.steel,-.07,-.12,-.66); leg1.rotation.z=-.16;
    const leg2=gunBox(g,.018,.23,.025,gunM.steel,.07,-.12,-.66); leg2.rotation.z=.16;
    sight(g,0,.10,-.90); mz=-1.24;
  }
  // Supporting hands: forearm cuffs, gloves and fingers, positioned around grip.
  gunBox(g,.115,.13,.22,gunM.skin,.105,-.20,.27).rotation.x=-.22;
  gunBox(g,.095,.09,.12,gunM.rubber,.105,-.17,.18);
  for(let k=0;k<3;k++) gunBox(g,.022,.025,.085,gunM.rubber,.075+k*.026,-.205,.105);
  if(i>0){
    gunBox(g,.12,.12,.20,gunM.skin,-.12,-.20,-.42).rotation.x=-.15;
    gunBox(g,.10,.085,.12,gunM.rubber,-.12,-.17,-.50);
    for(let k=0;k<3;k++) gunBox(g,.022,.025,.08,gunM.rubber,-.15+k*.026,-.205,-.54);
  }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),new THREE.MeshBasicMaterial({map:mzTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  f.position.set(0,.01,mz); f.visible=false; g.add(f); g.userData.mz=f; g.visible=false; cam.add(g); return g;
}
const guns = [0, 1, 2].map(mkGun);
const flash = new THREE.PointLight(0xffcc66, 0, 8); flash.position.set(0.2, -0.1, -1); cam.add(flash);

// ---------- Imported character asset ----------
// Rigged, textured soldier GLB with Idle/Walk/Run/Fire/Reload/Death clips.
// Hosted by the asset author; procedural character remains as a graceful fallback.
let soldierAsset = null, soldierClips = [];
if (THREE.GLTFLoader && THREE.SkeletonUtils) {
  const soldierLoader = new THREE.GLTFLoader();
  soldierLoader.load('https://www.shanebrumback.com/models/soldier_rigged.glb', gltf => {
    soldierAsset = gltf.scene;
    soldierClips = gltf.animations || [];
    soldierAsset.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => { if ('roughness' in m && m.roughness < 0.18) m.roughness = 0.32; });
      }
    });
    // Normalize once so the imported model fits the game's ~1.9 m character scale.
    const bb = new THREE.Box3().setFromObject(soldierAsset), size = bb.getSize(new THREE.Vector3());
    const h = Math.max(0.001, size.y);
    soldierAsset.scale.setScalar(1.88 / h);
    soldierAsset.updateMatrixWorld(true);
    const bb2 = new THREE.Box3().setFromObject(soldierAsset), center = bb2.getCenter(new THREE.Vector3());
    soldierAsset.position.set(-center.x, -bb2.min.y, -center.z);
    console.info('Imported rigged soldier loaded:', soldierClips.map(c => c.name).join(', '));
  }, undefined, err => console.warn('Rigged soldier asset unavailable; using built-in fallback model.', err));
}
function cloneImportedSoldier() {
  if (!soldierAsset) return null;
  const root = new THREE.Group();
  const model = THREE.SkeletonUtils.clone(soldierAsset);
  root.add(model);
  const mixer = new THREE.AnimationMixer(model), actions = {};
  soldierClips.forEach(clip => {
    const action = mixer.clipAction(clip);
    if (/Fire|Reload|Death|Jump/i.test(clip.name)) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
    actions[clip.name.toLowerCase()] = action;
  });
  const play = name => {
    const key = Object.keys(actions).find(k => k === name.toLowerCase() || k.includes(name.toLowerCase()));
    if (!key || root.userData.currentAnim === key) return;
    const next = actions[key]; next.reset().play();
    if (root.userData.currentAction) root.userData.currentAction.crossFadeTo(next, 0.18, false);
    root.userData.currentAction = next; root.userData.currentAnim = key;
  };
  root.userData.mixer = mixer; root.userData.play = play; root.userData.model = model;
  play('Idle');
  return root;
}

// ---------- Characters ----------
// More anatomical low-poly characters: tapered torso, rounded joints, boots,
// layered tactical vest, pouches, helmet, webbing and a visible held rifle.
const charM = {};
function cm(color, roughness=.82, metalness=0) { const key=color+'_'+roughness+'_'+metalness; return charM[key] || (charM[key]=new THREE.MeshStandardMaterial({color,roughness,metalness})); }
function limbMesh(parent, geo, mat, x,y,z, parts, extra={}) {
  const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; Object.assign(m.userData,extra); parent.add(m); parts.push(m); return m;
}
function human(c) {
  const g=new THREE.Group(), parts=[];
  const skin=cm(c.skin,.9), shirt=cm(c.shirt,.95), pants=cm(c.pants,.94), boot=cm(0x171918,.82,.08), vest=cm(c.vest||0x343a31,.92), web=cm(0x171b17,.8), metal=cm(0x25292a,.35,.72), helmet=cm(c.helmet||0x333b31,.72,.08), glove=cm(0x20231f,.9);
  const sph=(x,y,z,sx,sy,sz,mat,extra={})=>limbMesh(g,new THREE.SphereGeometry(1,12,10),mat,x,y,z,parts,extra).scale.set(sx,sy,sz);
  const cyl=(x,y,z,rt,rb,h,mat,extra={})=>limbMesh(g,new THREE.CylinderGeometry(rt,rb,h,10),mat,x,y,z,parts,extra);
  // Legs pivot at the hips for a natural running swing.
  const legL=new THREE.Group(), legR=new THREE.Group(); legL.position.set(-.14,.93,0); legR.position.set(.14,.93,0); g.add(legL,legR);
  const makeLeg=(pivot)=>{
    const upper=new THREE.Mesh(new THREE.CylinderGeometry(.105,.145,.47,12),pants); upper.position.y=-.24; upper.castShadow=true; pivot.add(upper); parts.push(upper);
    const knee=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),pants); knee.position.set(0,-.48,.012); knee.castShadow=true; pivot.add(knee); parts.push(knee);
    const lower=new THREE.Mesh(new THREE.CylinderGeometry(.075,.10,.39,12),pants); lower.position.set(0,-.68,.012); lower.castShadow=true; pivot.add(lower); parts.push(lower);
    const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.078,.078,.055,12),web); cuff.position.set(0,-.84,.012); pivot.add(cuff); parts.push(cuff);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.29),boot); shoe.position.set(0,-.91,-.045); shoe.castShadow=true; pivot.add(shoe); parts.push(shoe);
  };
  makeLeg(legL); makeLeg(legR);
  // pelvis, torso and shoulder armor
  sph(0,.91,0,.255,.18,.17,pants);
  const torso=limbMesh(g,new THREE.CylinderGeometry(.25,.19,.61,12,1),shirt,0,1.34,0,parts); torso.scale.set(1.12,1,0.72);
  sph(0,1.45,0,.30,.22,.18,vest);
  // plate carrier front plate, lower belt and modular pouches
  const plate=limbMesh(g,new THREE.BoxGeometry(.34,.38,.07),cm(c.plate||0x42463b,.88),0,1.40,-.145,parts); plate.rotation.x=-.05;
  limbMesh(g,new THREE.BoxGeometry(.46,.075,.21),web,0,1.10,0,parts);
  for(let side of [-1,1]){
    limbMesh(g,new THREE.BoxGeometry(.105,.13,.09),cm(c.pouch||0x282d27,.9),side*.16,1.17,-.17,parts);
    limbMesh(g,new THREE.BoxGeometry(.11,.16,.08),vest,side*.23,1.36,-.08,parts);
    // articulated arms with upper sleeves, forearms, gloves
    const shoulder=sph(side*.335,1.48,0,.13,.15,.14,shirt);
    const upper=limbMesh(g,new THREE.CylinderGeometry(.085,.105,.31,10),shirt,side*.36,1.30,-.025,parts); upper.rotation.z=side*.13;
    sph(side*.385,1.13,-.07,.09,.095,.10,shirt);
    const fore=limbMesh(g,new THREE.CylinderGeometry(.065,.085,.29,10),shirt,side*.36,1.00,-.12,parts); fore.rotation.x=-.38; fore.rotation.z=-side*.10;
    sph(side*.36,.85,-.18,.075,.07,.08,glove);
    // elbow pad and shoulder seam
    sph(side*.39,1.20,-.07,.09,.075,.075,web);
  }
  // neck, face, ears, nose, eyes, helmet and chin strap
  cyl(0,1.67,0,.075,.08,.12,skin);
  const head=sph(0,1.82,-.005,.145,.19,.135,skin,{head:true});
  sph(0,1.94,.0,.16,.105,.15,helmet);
  sph(0,1.88,-.112,.155,.035,.055,cm(0x222820,.78)); // helmet brim
  sph(-.145,1.82,0,.025,.055,.04,skin); sph(.145,1.82,0,.025,.055,.04,skin);
  // face features face toward local -Z
  sph(-.052,1.84,-.126,.018,.014,.009,cm(0x181715)); sph(.052,1.84,-.126,.018,.014,.009,cm(0x181715));
  sph(0,1.80,-.139,.025,.03,.018,skin);
  // shoulder straps and small radio/utility kit
  for(const side of [-1,1]) { const strap=limbMesh(g,new THREE.BoxGeometry(.045,.42,.025),web,side*.13,1.43,-.155,parts); strap.rotation.z=side*.18; }
  limbMesh(g,new THREE.BoxGeometry(.105,.17,.10),cm(0x202622,.9),-.205,1.42,.06,parts);
  // Detailed enemy carbine, with rounded receiver, barrel, gas block, rail,
  // handguard ribs, adjustable stock, pistol grip, curved magazine, sights and muzzle device.
  const rifle=new THREE.Group(); g.add(rifle); rifle.position.set(.13,1.18,-.31); rifle.rotation.x=-.08;
  const rmat=cm(0x202321,.42,.68), rpoly=cm(0x242720,.88,.02), rblack=cm(0x111413,.62,.18), rsteel=cm(0x353a38,.3,.82);
  const rb=(w,h,d,mat,x,y,z)=>limbMesh(rifle,new THREE.BoxGeometry(w,h,d),mat,x,y,z,parts);
  const rc=(r,len,mat,x,y,z,n=14)=>{const m=limbMesh(rifle,new THREE.CylinderGeometry(r,r,len,n),mat,x,y,z,parts);m.rotation.x=Math.PI/2;return m;};
  // Receiver and upper rail
  rb(.095,.105,.29,rmat,0,.012,-.15);
  rb(.088,.025,.34,rblack,0,.075,-.23);
  rb(.09,.055,.22,rsteel,0,.015,-.39);
  // Long handguard with individually separated rail slots
  rb(.092,.083,.32,rpoly,0,.012,-.43);
  for(let k=0;k<9;k++){rb(.101,.009,.021,k%2?rblack:rmat,0,.06,-.31-k*.032); rb(.009,.074,.019,rblack,-.049,.012,-.31-k*.032);rb(.009,.074,.019,rblack,.049,.012,-.31-k*.032);}
  // Barrel, front sight/gas block and slotted flash hider
  rc(.014,.39,rsteel,0,.018,-.72,16); rb(.105,.065,.065,rblack,0,.018,-.60);
  rc(.022,.075,rblack,0,.018,-.94,12); rc(.018,.018,rsteel,0,.018,-.985,12);
  for(let k=0;k<4;k++)rb(.041,.012,.008,rblack,0,.018,-.952+k*.016);
  // Stock and cheek pad
  rb(.075,.09,.20,rpoly,0,.008,.105); rb(.082,.10,.12,rblack,0,.008,.24);
  rb(.086,.12,.035,rpoly,0,.005,.315); rb(.075,.035,.12,rblack,0,.065,.13);
  // Angled pistol grip, trigger guard and curved magazine
  const grip=rb(.052,.13,.075,rpoly,0,-.09,-.025); grip.rotation.x=-.22;
  rb(.042,.012,.072,rblack,0,-.052,-.09); rb(.009,.045,.055,rsteel,0,-.066,-.10);
  const mag=rb(.061,.17,.095,rblack,0,-.12,-.22);mag.rotation.x=-.14;
  rb(.065,.022,.09,rsteel,0,-.207,-.21);
  // Optic and iron sights, mount rings, and small glass lens
  rb(.044,.035,.09,rblack,0,.108,-.25); rc(.024,.07,rblack,0,.13,-.25,14);
  const lens=limbMesh(rifle,new THREE.CylinderGeometry(.019,.019,.006,16),cm(0x294b51,.16,.5),0,.13,-.29,parts);lens.rotation.x=Math.PI/2;
  rb(.018,.045,.025,rsteel,0,.105,-.49); rb(.016,.04,.025,rsteel,0,.10,-.91);
  // Sling swivels and a visible sling along the receiver side
  const sling=rb(.012,.20,.018,rblack,.055,-.025,-.02);sling.rotation.x=-.18;
  const all=[...g.children];
  return {g,parts,legL,legR,armL:null,armR:null,head};
}
const hostages = [];
[[-6, 36], [-2, 37], [2, 36], [6, 37]].forEach(([x, z], i) => {
  const h = human({ shirt: 0xb8b7aa, pants: 0x48546a, skin: 0xd0a27f, vest:0x8b8b7b, helmet:0x6d6657 });
  h.g.position.set(x, 0, z); h.g.rotation.y = Math.PI; S.add(h.g); Object.assign(h, { x, z, hp: 100, alive: true, i }); hostages.push(h);
});
let bots = [], corpses = [], queue = 0, spawnT = 0, round = 0, clearT = 0, state = 'menu', time = 0;
function spawnBot() {
  const palette = [
    {shirt:0x4b4a3a, pants:0x282b24, skin:0x9a7055, vest:0x30362e, plate:0x4a4e40, helmet:0x373d32, pouch:0x292d26},
    {shirt:0x45483b, pants:0x303129, skin:0xb17f5d, vest:0x353b30, plate:0x42483a, helmet:0x4a4e3e, pouch:0x252a23},
    {shirt:0x51443a, pants:0x292a26, skin:0x8d654f, vest:0x39332c, plate:0x4a4034, helmet:0x37342e, pouch:0x262520}
  ];
  let h;
  const imported = cloneImportedSoldier();
  if (imported) {
    h = { g: imported, parts: [], legL: null, legR: null, imported: true };
    imported.traverse(o => { if (o.isMesh) h.parts.push(o); });
    // A raycast-only head target allows clean headshots without changing the visual model.
    const headHit = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }));
    headHit.position.set(0, 1.66, 0); headHit.userData.head = true; imported.add(headHit); h.parts.push(headHit);
    h.parts.forEach(p => { p.userData.bot = h; });
    h.playAnim = name => imported.userData.play && imported.userData.play(name);
  } else {
    h = human(palette[Math.random()*palette.length|0]);
    h.playAnim = () => {};
  }
  Object.assign(h, { x: rnd(-22, 22), z: -36, y: 0, hp: 100, cd: 1.5 + Math.random() * 1.2, ph: Math.random() * 6, w: 0, dead: false, t: 0, anim: '' });
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
  const sp = w.spr * (P.zoom || P.w !== 2 ? 1 : 8) * (P.y > 0.01 ? 2.5 : 1) * (1 + Math.hypot(mv.x, mv.y) * 0.8);
  ray.setFromCamera({ x: (Math.random() - 0.5) * sp * 6, y: (Math.random() - 0.5) * sp * 6 }, cam);
  const hits = ray.intersectObjects(wallMeshes.concat(...bots.map(b => b.parts)), false);
  if (hits.length) {
    const h = hits[0], u = h.object.userData;
    if (u.bot) {
      const b = u.bot; b.hp -= w.dmg * (u.head ? 4 : 1); burst(h.point, 0xaa0000, 6);
      $('cross').classList.add('hit'); setTimeout(() => $('cross').classList.remove('hit'), 120);
      if (b.hp <= 0) { feed('You killed a Terrorist' + (u.head ? ' (headshot)' : '')); b.dead = true; if (b.playAnim) b.playAnim('Death'); bots = bots.filter(x => x !== b); corpses.push(b); }
    } else { decal(h.point, h.face.normal.clone().transformDirection(h.object.matrixWorld)); burst(h.point, 0x9a9488, 4); }
  }
  P.pitch += w.rec * (0.25 + Math.random() * 0.25); P.yaw += (Math.random() - 0.5) * w.rec * 0.25;
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
    b.ph += dt; if (b.g.userData.mixer) b.g.userData.mixer.update(dt); let t = null, best = 1e9;
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
    if (b.legL && b.legR) { b.legL.rotation.x = Math.sin(b.w) * 0.7 * (mvg ? 1 : 0); b.legR.rotation.x = -b.legL.rotation.x; }
    if (b.imported && b.playAnim) { b.animLock = Math.max(0, (b.animLock || 0) - dt); const wantAnim = mvg ? 'Walk' : 'Idle'; if (b.animLock <= 0 && b.anim !== wantAnim) { b.playAnim(wantAnim); b.anim = wantAnim; } }
    b.cd -= dt;
    if (b.cd <= 0 && td < 30 && seen) {
      b.cd = 0.85 + Math.random() * 0.9; if (b.imported && b.playAnim) { b.playAnim('Fire'); b.anim = 'Fire'; b.animLock = 0.42; } gunSnd(WP[1], panTo(b.x, b.z), Math.max(0.12, 0.6 - td * 0.02));
      if (t === P) { if (Math.random() < Math.max(0.06, 0.34 - td / 75)) hurt(8 + Math.random() * 6); }
      else if (Math.random() < 0.6) { t.hp -= 12; if (t.hp <= 0) { t.alive = false; t.g.rotation.x = Math.PI / 2; t.g.position.y = 0.2; feed('Terrorist killed a Hostage'); } }
    }
  }
  corpses = corpses.filter(b => { b.t += dt; if (b.g.userData.mixer) b.g.userData.mixer.update(dt); if (!b.imported) { b.g.rotation.x = -Math.min(1, b.t * 3) * Math.PI / 2; b.g.position.y = Math.min(1, b.t * 3) * 0.15; } if (b.t > 5) { S.remove(b.g); return false; } return true; });
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
