import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initMaterials, initFinishes, interactives, colliders, M, Layer, box } from './kit.js';
import * as T from './tex.js';
import { buildHouse } from './house.js';
import { buildBuilding, floorName, HOME_FLOOR, FLOORS, FLOOR_H } from './building.js';
import { Player, groundAt } from './player.js';
import { Minimap } from './minimap.js';
import { Audio } from './audio.js';
import { roomAt, MEMORIES } from './data.js';
import { avatar as makeAvatar } from './furn.js';

const $ = (s) => document.querySelector(s);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const params = new URLSearchParams(location.search);

// ------------------------------------------------------------------ renderer / scene
const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('shot') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.localClippingEnabled = true;
T.setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0d14');
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

// ------------------------------------------------------------------ loading
const manager = new THREE.LoadingManager();
const bar = $('#loading .bar i');
manager.onProgress = (_, done, total) => { bar.style.width = `${20 + (done / total) * 80}%`; };
manager.onLoad = () => ready();
const loader = new THREE.TextureLoader(manager);

const app = {
  audio: new Audio(), shake: 0, floor: HOME_FLOOR, mode: 'title', view: 'fp', night: true, quality: !isTouch, cut: true,
  ui: { toast, area }, setFloor, intro: false, endIntro,
};

initMaterials(loader);
initFinishes();
const house = buildHouse(scene);
const building = buildBuilding(scene, app);
const elevator = building.elevator;

// clipping plane for the dollhouse cut-away
const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
for (const g of [house.houseGroup, house.dyn, building.root]) g.traverse((o) => {
  if (!o.isMesh) return;
  for (const m of [].concat(o.material)) { m.clippingPlanes = [cutPlane]; m.clipShadows = true; }
});
scene.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (m.isMeshStandardMaterial) m.envMapIntensity = m.userData.env ?? 0.22; });

// ------------------------------------------------------------------ outside world
const sky = { night: T.skyline(true), day: T.skyline(false) };
const skyMat = new THREE.MeshBasicMaterial({ map: sky.night, side: THREE.BackSide, fog: false });
const skyCyl = new THREE.Mesh(new THREE.CylinderGeometry(110, 110, 80, 64, 1, true), skyMat);
skyCyl.position.set(6, -14, 7); scene.add(skyCyl);
const groundMat = new THREE.MeshStandardMaterial({ color: '#15161b', roughness: 1 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(110, 48), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.set(6, -18.5, 7); scene.add(ground);
// the rest of the building: storeys above and below (hidden in overview)
const shell = new Layer('shell');
const shellMat = new THREE.MeshStandardMaterial({ map: T.tiles({ tileW: 0.12, tileH: 0.06, nx: 8, ny: 12, base: '#c8b49a', grout: '#9d8b74', gw: 2, vary: 0.08 }), roughness: 0.8 });
shellMat.userData.worldUV = true;
for (const [x0, x1, z0, z1] of [[-0.12, 11.12, 0.48, 10.1], [1.2, 6.07, -0.12, 0.6], [-0.12, 3.85, 10.1, 12.6], [3.75, 5.1, 10.1, 13.52]]) {
  box(shell, shellMat, x0, x1, -18.4, -0.25, z0, z1);
  box(shell, shellMat, x0, x1, 2.86, 20, z0, z1);
}
box(shell, shellMat, 5.1, 11.92, -18.4, -6.2, 10.1, 13.52);
box(shell, shellMat, 5.1, 11.92, 9.0, 20, 10.1, 13.52);
const shellGroup = shell.bake(); scene.add(shellGroup);
// title backdrop = dollhouse look
house.ceilings.visible = false; shellGroup.visible = false; ground.visible = false; building.setCopiesVisible(false); cutPlane.constant = 1.75;

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight('#fff4e4', '#4d4136', 0.32); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d6', 0); sun.position.set(-20, 30, 10); scene.add(sun);
const anchors = [...house.lights,
  { room: 'lobby', pos: new THREE.Vector3(7.45, 2.45, 12.0), color: new THREE.Color('#f4f6ff'), intensity: 4, distance: 6 },
  { room: 'lobby', pos: new THREE.Vector3(7.45, 2.45 - FLOOR_H, 12.0), color: new THREE.Color('#f4f6ff'), intensity: 3, distance: 6 },
  { room: 'stairs', pos: new THREE.Vector3(9.4, 2.4, 12.6), color: new THREE.Color('#f4f6ff'), intensity: 3, distance: 6 },
  { room: 'stairs', pos: new THREE.Vector3(11.1, 1.5 + 2.5, 12.05), color: new THREE.Color('#f4f6ff'), intensity: 3.5, distance: 6 },
  { room: 'stairs', pos: new THREE.Vector3(11.1, -1.5 + 2.5, 12.05), color: new THREE.Color('#f4f6ff'), intensity: 3.5, distance: 6 },
  { room: 'car', pos: new THREE.Vector3(5.9, 2.15, 11.9), color: new THREE.Color('#fff7ea'), intensity: 3, distance: 4 },
];
const POOL = isTouch ? 6 : 10;
const pool = [];
for (let i = 0; i < POOL; i++) { const l = new THREE.PointLight('#ffffff', 0, 6, 1.4); scene.add(l); pool.push(l); }
let lightMul = 1;
const _tmp = new THREE.Vector3();
function updateLights(focus) {
  const sorted = anchors.map((a) => ({ a, d: a.pos.distanceToSquared(focus) + (Math.abs(a.pos.y - focus.y) > 2.5 ? 40 : 0) })).sort((p, q) => p.d - q.d);
  pool.forEach((l, i) => {
    const s = sorted[i];
    if (!s) { l.intensity = 0; return; }
    l.position.copy(s.a.pos); l.color.copy(s.a.color); l.distance = s.a.distance * 1.3;
    l.intensity = s.a.intensity * lightMul * 1.05;
  });
}

// ------------------------------------------------------------------ memories (photo spots)
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem('micasa-found') || '[]')); } catch (e) { /* storage unavailable */ }
const memTex = T.sprite('📷');
const memSprites = MEMORIES.map((m, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: memTex, transparent: true, depthWrite: false }));
  s.position.set(m.x, 1.3, m.z); s.scale.set(0.34, 0.34, 1);
  s.userData = { prompt: `看看回憶照片「${m.title}」`, onUse: () => showPhoto(m), mem: m, phase: i };
  scene.add(s); interactives.push(s);
  return s;
});
$('#memTotal').textContent = MEMORIES.length;

// Memory mode is an optional extra, off by default and unlocked with a password
// (compared as a SHA-256 hash; it is a game gate, not real access control).
const MEM_HASH = '93c7707fc6392a8bce4cc180ed6572ab7b436d0923ceb01f8c50f74d7948fc66';
let memUnlocked = false;
try { memUnlocked = sessionStorage.getItem('micasa-mem') === '1'; } catch (e) { /* ignore */ }
function setMemMode(on) {
  app.memMode = on;
  memSprites.forEach((s) => (s.visible = on));
  $('#memories').classList.toggle('hidden', !on);
  document.querySelector('[data-act="memories"]').classList.toggle('on', on);
  $('#btnMemTitle').classList.toggle('on', on);
  $('#btnMemTitle').textContent = on ? '📷 回憶模式：開' : '🔒 回憶模式';
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function openLock() {
  if (memUnlocked) { setMemMode(!app.memMode); toast(app.memMode ? '回憶模式開啟：找找屋子裡的 📷' : '回憶模式關閉'); return; }
  modal = 'lock';
  if (document.pointerLockElement) document.exitPointerLock();
  player.keys.clear();
  const f = $('#lock form');
  f.querySelector('.err').textContent = ''; f.pw.value = '';
  $('#lock').classList.remove('hidden');
  setTimeout(() => f.pw.focus(), 50);
}
$('#lock form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  let ok = false;
  try { ok = (await sha256(f.pw.value.trim())) === MEM_HASH; } catch (err) { f.querySelector('.err').textContent = '這個瀏覽器無法驗證密碼（需要 HTTPS）。'; return; }
  if (!ok) {
    f.querySelector('.err').textContent = '密碼不對喔，再試一次。';
    f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    f.pw.select();
    return;
  }
  memUnlocked = true;
  try { sessionStorage.setItem('micasa-mem', '1'); } catch (err) { /* ignore */ }
  closeModal();
  setMemMode(true);
  app.audio.init(); app.audio.chime();
  toast(`回憶模式開啟：屋子裡藏了 ${MEMORIES.length} 台 📷，找到後按 E 看照片`);
  if (app.mode === 'walk') lock();
});
$('#lock [data-act="cancel"]').addEventListener('click', () => { closeModal(); if (app.mode === 'walk') lock(); });

// fullscreen
const fsSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
function toggleFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return toast('這個瀏覽器不支援全螢幕');
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => toast('瀏覽器不允許全螢幕'));
  }
}
if (!fsSupported) { document.querySelector('[data-act="fullscreen"]').classList.add('hidden'); $('#btnFsTitle').classList.add('hidden'); }
document.addEventListener('fullscreenchange', () => {
  document.querySelector('[data-act="fullscreen"]').textContent = document.fullscreenElement ? '🗗' : '⛶';
});
$('#btnFsTitle').addEventListener('click', toggleFullscreen);
$('#btnMemTitle').addEventListener('click', openLock);
function refreshMemories() {
  $('#memCount').textContent = found.size;
  memSprites.forEach((s) => (s.material.opacity = found.has(s.userData.mem.id) ? 0.35 : 1));
}
refreshMemories();
setMemMode(false);

// ------------------------------------------------------------------ player & avatar
const player = new Player();
player.segments = () => {
  const segs = [];
  for (const d of house.doors) segs.push(d.segment());
  for (const d of building.doors) segs.push(d.segment());
  segs.push(...elevator.doorSegments());
  return segs;
};
player.onStep = () => {
  const r = roomAt(player.pos.x, player.pos.z);
  app.audio.step(r && r.id === 'room2' ? 'wood' : r && r.id === 'stairs' ? 'stairs' : 'tile');
};
player.onWrap = (d) => setFloor(app.floor + d, { arrive: true, stairs: d });
const avatar = makeAvatar(); avatar.visible = false; scene.add(avatar);

// ------------------------------------------------------------------ overview controls
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false; orbit.enableDamping = true; orbit.dampingFactor = 0.08;
orbit.target.set(5.9, 0, 6.9); orbit.maxPolarAngle = Math.PI * 0.47; orbit.minDistance = 4; orbit.maxDistance = 40;

// ------------------------------------------------------------------ post-processing
let composer = null, gtao = null;
function makeComposer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1.2, scale: 1.4, samples: 12 });
  gtao.blendIntensity = 1.0;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
}
try { makeComposer(); } catch (e) { console.warn('AO unavailable', e); app.quality = false; }

// ------------------------------------------------------------------ UI helpers
let areaTimer = 0;
function area(title, sub = '', big = false, dur = 2.4) {
  const el = $('#area');
  el.querySelector('b').textContent = title; el.querySelector('small').textContent = sub;
  el.classList.toggle('big', big); el.classList.add('show');
  clearTimeout(areaTimer); areaTimer = setTimeout(() => el.classList.remove('show'), dur * 1000);
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3700);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}
const LOOP_LINES = [
  '咦？{f}F……門牌換了，鐵門後面還是我家。',
  '不管到幾樓，推開門都是同一個家。',
  '{f}F 到了。熟悉的鐵門、熟悉的鞋架。',
  'Mi casa es su casa —— {f}F 也是。',
  '這棟樓好像只有一戶，而且是我家。',
];
let loopIdx = 0;
function setFloor(i, { arrive = false, quiet = false, stairs = 0 } = {}) {
  const n = FLOORS.length;
  app.floor = ((i % n) + n) % n;
  building.setFloor(app.floor);
  $('#floorNum').textContent = floorName(app.floor);
  if (quiet || !arrive) return;
  const f = floorName(app.floor);
  if (app.intro) { area(f, app.floor === HOME_FLOOR ? '叮！到家了' : '叮！', true, 1.8); return; }
  area(f, stairs ? (stairs > 0 ? '往上一層' : '往下一層') : '叮！', true, 1.8);
  if (stairs && Math.abs(stairs) === 1 && f === '1' && stairs < 0) toast('一樓……樓梯還在往下延伸。');
  setTimeout(() => {
    if (stairs > 0 && f === 'B1') toast('11 樓再往上……怎麼會是 B1？');
    else if (stairs < 0 && f === '11') toast('B1 再往下……變成 11 樓了。');
    else if (app.floor === HOME_FLOOR) toast(`${floorName(HOME_FLOOR)}F，到家了。`);
    else toast(LOOP_LINES[loopIdx++ % LOOP_LINES.length].replace('{f}', f));
  }, stairs ? 300 : 900);
}

// elevator HTML panel
const epGrid = $('#elevPanel .ep-grid');
[['5', '11'], ['4', '10'], ['3', '9'], ['2', '8'], ['1', '7'], ['B1', '6']].flat().forEach((name) => {
  const b = document.createElement('button'); b.textContent = name; b.dataset.idx = FLOORS.indexOf(name);
  b.addEventListener('click', (e) => { e.stopPropagation(); elevator.select(+b.dataset.idx); app.audio.click(); });
  epGrid.appendChild(b);
});
function refreshPanel() {
  epGrid.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('lit', +b.dataset.idx === elevator.target && elevator.target !== elevator.cur);
    b.classList.toggle('here', +b.dataset.idx === app.floor);
  });
}

// photo modal
let modal = null;
function showPhoto(m) {
  modal = 'photo';
  const card = $('#photo');
  card.querySelector('img').src = m.photo;
  card.querySelector('b').textContent = `${m.room}・${m.title}`;
  card.querySelector('span').textContent = m.note;
  card.classList.remove('hidden');
  const isNew = !found.has(m.id);
  found.add(m.id);
  try { localStorage.setItem('micasa-found', JSON.stringify([...found])); } catch (e) { /* ignore */ }
  refreshMemories();
  app.audio.chime();
  if (isNew) {
    setTimeout(() => toast(`收集到回憶照片 ${found.size}/${MEMORIES.length}`), 200);
    if (found.size === MEMORIES.length) setTimeout(() => toast('🎉 你已經走遍整個家了！歡迎常回來。'), 1600);
  }
}
function closeModal() {
  if (!modal) return;
  $('#photo').classList.add('hidden'); $('#bigmap').classList.add('hidden'); $('#lock').classList.add('hidden');
  modal = null;
}
const bigmap = new Minimap($('#bigmapCanvas'));
function toggleBigMap() {
  if (modal === 'map') return closeModal();
  if (modal) return;
  modal = 'map'; $('#bigmap').classList.remove('hidden'); bigmap.resize();
}

// ------------------------------------------------------------------ modes
const minimap = new Minimap($('#minimap'));
let locked = false;
function lock() { if (!isTouch && !app.noLock && canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } } }
function enterWalk(start = false) {
  app.audio.init();
  app.mode = 'walk';
  orbit.enabled = false;
  cutPlane.constant = 1000;
  house.ceilings.visible = true; shellGroup.visible = true; ground.visible = true; building.setCopiesVisible(true);
  $('#title').classList.add('hidden'); $('#pause').classList.add('hidden'); $('#ohud').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#touch').classList.toggle('hidden', !isTouch);
  minimap.resize();
  avatar.visible = app.view === 'tp';
  if (start) {
    // Opening: you start in the lift on 1F with the doors shut; press 8 to go home.
    const ground = FLOORS.indexOf('1');
    app.intro = true;
    elevator.park(ground);
    setFloor(ground);
    setTimeout(() => area('1F', '電梯裡', true, 2), 500);
    setTimeout(() => toast(`我家在 ${floorName(HOME_FLOOR)} 樓：按下電梯的 ${floorName(HOME_FLOOR)} 號按鈕（或鍵盤 ${floorName(HOME_FLOOR)}）`), 1600);
  }
  lock();
}
// Called when the opening ride reaches home (or is skipped via overview).
function endIntro() {
  if (!app.intro) return;
  app.intro = false;
  setTimeout(() => toast('走出電梯，對著鐵門按 E 開門回家'), 1400);
}
function enterOverview() {
  app.audio.init();
  if (app.intro) { app.intro = false; elevator.park(HOME_FLOOR); setFloor(HOME_FLOOR); }
  app.mode = 'overview';
  if (document.pointerLockElement) document.exitPointerLock();
  orbit.enabled = true;
  cutPlane.constant = app.cut ? 1.75 : 1000;
  house.ceilings.visible = false; shellGroup.visible = false; ground.visible = false; building.setCopiesVisible(false);
  $('#title').classList.add('hidden'); $('#pause').classList.add('hidden'); $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden');
  $('#ohud').classList.remove('hidden');
  avatar.visible = true;
  if (player.pos.y > 1 || player.pos.y < -1) player.pos.y = 0;
  flyTo(new THREE.Vector3(player.pos.x + 7, 13, player.pos.z + 9), new THREE.Vector3(5.9, 0, 6.9));
}
let fly = null;
function flyTo(pos, target) { fly = { t: 0, p0: camera.position.clone(), p1: pos, t0: orbit.target.clone(), t1: target }; }
function toggleView() {
  app.view = app.view === 'fp' ? 'tp' : 'fp';
  avatar.visible = app.view === 'tp';
  toast(app.view === 'fp' ? '第一人稱' : '第三人稱');
}
function toggleDayNight() {
  app.night = !app.night;
  skyMat.map = app.night ? sky.night : sky.day; skyMat.needsUpdate = true;
  groundMat.color.set(app.night ? '#15161b' : '#69735f');
  scene.background.set(app.night ? '#0b0d14' : '#a9cbe8');
  hemi.intensity = app.night ? 0.32 : 1.0;
  sun.intensity = app.night ? 0 : 2.2;
  lightMul = app.night ? 1 : 0.45;
  renderer.toneMappingExposure = app.night ? 0.92 : 0.9;
  document.querySelector('[data-act="daynight"]').textContent = app.night ? '🌙' : '☀️';
  toast(app.night ? '夜晚・開燈' : '白天');
}
function toggleQuality() {
  app.quality = !app.quality && !!composer;
  document.querySelector('[data-act="quality"]').classList.toggle('off', !app.quality);
  toast(app.quality ? '高畫質（環境光遮蔽）' : '流暢模式');
}

// ------------------------------------------------------------------ interaction
const ray = new THREE.Raycaster(); ray.far = 3.2; ray.camera = camera;
let target = null;
function findTarget() {
  const head = _tmp.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  if (app.view === 'fp') ray.setFromCamera({ x: 0, y: 0 }, camera);
  else ray.set(head.clone(), player.forward());
  const hits = ray.intersectObjects(interactives, false);
  for (const h of hits) {
    if (!h.object.visible || !h.object.userData.onUse) continue;
    if (h.point.distanceTo(head) > 2.3) continue;
    return h.object;
  }
  // proximity fallback for memories
  let best = null, bd = 0.9;
  const f = player.forward();
  for (const s of memSprites) {
    const dx = s.position.x - player.pos.x, dz = s.position.z - player.pos.z, d = Math.hypot(dx, dz);
    if (s.visible && d < bd && Math.abs(player.pos.y) < 1 && (d < 0.35 || (dx * f.x + dz * f.z) / d > 0.3)) { bd = d; best = s; }
  }
  return best;
}
function use() {
  if (modal) return closeModal();
  if (!target) return;
  const u = target.userData;
  u.onUse();
  if (target.parent && target.parent.type === 'Group' && !u.mem) {
    const isGate = building.doors.some((d) => d.leaf === target);
    isGate ? app.audio.gate() : (u.prompt && String(typeof u.prompt === 'function' ? u.prompt() : u.prompt).includes('樓') ? app.audio.click() : app.audio.door());
  }
}

// ------------------------------------------------------------------ input
addEventListener('keydown', (e) => {
  if (modal === 'lock') { if (e.code === 'Escape') closeModal(); return; }
  if (e.code === 'KeyF' && !e.repeat) { toggleFullscreen(); return; }
  if (app.mode === 'title') return;
  if (modal && e.code !== 'KeyM') { closeModal(); return; }
  if (app.mode === 'walk') {
    player.keys.add(e.code);
    if (e.code === 'Space') { player.jump(); e.preventDefault(); }
    if (e.code === 'KeyE') use();
    if (e.code === 'KeyV') toggleView();
    if (elevator.inCar(player.pos)) {
      const map = { Digit0: '10', Minus: '11', KeyB: 'B1' };
      let name = map[e.code] || (e.code.startsWith('Digit') ? e.code.slice(5) : null);
      if (name && FLOORS.includes(name)) { elevator.select(FLOORS.indexOf(name)); app.audio.click(); }
    }
  }
  if (e.code === 'KeyO') app.mode === 'overview' ? enterWalk() : enterOverview();
  if (e.code === 'KeyM') toggleBigMap();
  if (e.code === 'KeyN') toggleDayNight();
});
addEventListener('keyup', (e) => player.keys.delete(e.code));
addEventListener('blur', () => player.keys.clear());
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && app.mode === 'walk' && !isTouch && !modal && !app.noLock) { $('#pause').classList.remove('hidden'); player.keys.clear(); }
});
// Pointer lock can be refused (embedded frames, some browsers): fall back to drag-to-look.
document.addEventListener('pointerlockerror', () => {
  if (app.noLock) return;
  app.noLock = true; $('#pause').classList.add('hidden');
  toast('無法鎖定滑鼠：按住左鍵拖曳來轉頭');
});
document.addEventListener('mousemove', (e) => {
  if (app.mode !== 'walk' || modal) return;
  if (locked) player.look(e.movementX * 0.0022, e.movementY * 0.0022);
  else if (app.noLock && (e.buttons & 1)) player.look(e.movementX * 0.004, e.movementY * 0.004);
});
let downAt = [0, 0];
canvas.addEventListener('mousedown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('click', (e) => {
  if (modal) return closeModal();
  if (app.noLock && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // was a drag
  if (app.mode === 'walk' && !isTouch) { if (locked || app.noLock) use(); else { $('#pause').classList.add('hidden'); lock(); } }
});
canvas.addEventListener('dblclick', (e) => {
  if (app.mode !== 'overview') return;
  const ndc = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 };
  const r = new THREE.Raycaster(); r.setFromCamera(ndc, camera);
  const t = -r.ray.origin.y / r.ray.direction.y;
  if (t <= 0) return;
  const p = r.ray.origin.clone().addScaledVector(r.ray.direction, t);
  const room = roomAt(p.x, p.z);
  if (!room) return toast('那裡在屋外喔');
  player.pos.set(p.x, groundAt(p.x, p.z, 0), p.z);
  for (let i = 0; i < 4; i++) player.collide();
  enterWalk();
});
$('#photo').addEventListener('click', closeModal);
$('#bigmap').addEventListener('click', closeModal);
$('#btnWalk').addEventListener('click', () => { player.pos.set(5.75, 0, 11.9); player.yaw = -Math.PI / 2; player.pitch = 0; enterWalk(true); });
$('#btnOverview').addEventListener('click', () => { setFloor(HOME_FLOOR); player.pos.set(5.75, 0, 11.9); player.yaw = -Math.PI / 2; enterOverview(); });
$('#btnResume').addEventListener('click', () => enterWalk());
$('#btnPauseOverview').addEventListener('click', () => enterOverview());
$('#btnEnter').addEventListener('click', () => enterWalk());
$('#btnCut').addEventListener('click', () => {
  app.cut = !app.cut; cutPlane.constant = app.cut ? 1.75 : 1000;
  $('#btnCut').textContent = `✂️ 剖面牆：${app.cut ? '開' : '關'}`;
});
$('#toolbar').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  e.stopPropagation();
  const a = b.dataset.act;
  if (a === 'view') toggleView();
  if (a === 'overview') enterOverview();
  if (a === 'map') toggleBigMap();
  if (a === 'daynight') toggleDayNight();
  if (a === 'quality') toggleQuality();
  if (a === 'fullscreen') toggleFullscreen();
  if (a === 'memories') { openLock(); if (modal === 'lock') return; }
  if (a === 'sound') { app.audio.setMuted(!app.audio.muted); b.textContent = app.audio.muted ? '🔇' : '🔊'; }
  if (!isTouch && app.mode === 'walk' && !modal) lock();
});

// touch: joystick + drag-to-look + buttons
if (isTouch) {
  const stick = $('#stick'), knob = $('#stick i');
  let sid = null, sx = 0, sy = 0;
  stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; sx = e.clientX; sy = e.clientY; stick.setPointerCapture(sid); });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== sid) return;
    let dx = (e.clientX - sx) / 50, dy = (e.clientY - sy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    player.joy.set(dx, dy); knob.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`;
  });
  const end = (e) => { if (e.pointerId !== sid) return; sid = null; player.joy.set(0, 0); knob.style.transform = ''; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  let lid = null, lx = 0, ly = 0, moved = 0;
  canvas.addEventListener('pointerdown', (e) => { if (app.mode !== 'walk' || lid !== null) return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; moved = 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lid) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    player.look(dx * 0.006, dy * 0.006);
  });
  const lend = (e) => { if (e.pointerId !== lid) return; lid = null; if (moved < 8) use(); };
  canvas.addEventListener('pointerup', lend); canvas.addEventListener('pointercancel', lend);
  $('#tbtns').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'use') use();
    if (b.dataset.act === 'jump') player.jump();
  });
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) { composer.setSize(innerWidth, innerHeight); }
  minimap.resize(); if (modal === 'map') bigmap.resize();
});

// ------------------------------------------------------------------ main loop
let last = performance.now(), lastRoom = null, clock = 0, titleAngle = 0.6;
const camTarget = new THREE.Vector3();
function tpCamera() {
  const head = new THREE.Vector3(player.pos.x, player.pos.y + 1.55, player.pos.z);
  const fwd = player.forward();
  const want = head.clone().addScaledVector(fwd, -2.2).add(new THREE.Vector3(0, 0.35, 0));
  // pull in against walls (ray vs collider boxes)
  const dir = want.clone().sub(head); const dist = dir.length(); dir.normalize();
  let tmin = dist;
  for (const b of colliders) {
    if (b.y1 < head.y - 1.2 || b.y0 > head.y + 0.8) continue;
    const t = rayBox(head, dir, b);
    if (t !== null && t < tmin) tmin = t;
  }
  camera.position.copy(head).addScaledVector(dir, Math.max(0.25, tmin - 0.18));
  camera.lookAt(camTarget.copy(head).addScaledVector(fwd, 3));
}
function rayBox(o, d, b) {
  let t0 = 0, t1 = Infinity;
  for (const [oo, dd, lo, hi] of [[o.x, d.x, b.x0, b.x1], [o.y, d.y, b.y0, b.y1], [o.z, d.z, b.z0, b.z1]]) {
    if (Math.abs(dd) < 1e-8) { if (oo < lo || oo > hi) return null; continue; }
    let a = (lo - oo) / dd, c = (hi - oo) / dd; if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return null;
  }
  return t0 > 0 ? t0 : null;
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  const walking = app.mode === 'walk' && !modal && (locked || isTouch || app.noLock || params.has('shot'));
  if (walking) player.update(dt);
  for (const d of house.doors) d.update(dt);
  for (const d of building.doors) d.update(dt);
  elevator.update(dt, player);
  // close the front door + gate behind you
  if (building.front.open && Math.hypot(player.pos.x - 7.3, player.pos.z - 10.7) > 3.0) building.front.toggle(false);

  if (app.mode === 'walk') {
    if (app.view === 'fp') {
      const bob = Math.sin(player.bob) * 0.035 * Math.min(1, player.speed / 2);
      camera.position.set(player.pos.x, player.pos.y + player.eye + bob, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, Math.sin(player.bob * 0.5) * 0.004);
    } else tpCamera();
    if (app.shake) { camera.position.x += (Math.random() - 0.5) * app.shake; camera.position.y += (Math.random() - 0.5) * app.shake; }
    target = findTarget();
    $('#crosshair').classList.toggle('hot', !!target);
    const pr = $('#prompt');
    if (target) { const p = target.userData.prompt; pr.querySelector('span').textContent = typeof p === 'function' ? p() : p; pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
    // area titles
    let room = roomAt(player.pos.x, player.pos.z);
    if (room && room.id !== (lastRoom && lastRoom.id)) {
      lastRoom = room;
      $('#roomName').textContent = room.name; $('#roomEn').textContent = room.en;
      if (clock > 1) area(room.name, room.en);
    }
    const inCar = elevator.inCar(player.pos);
    $('#elevPanel').classList.toggle('hidden', !inCar);
    if (inCar) refreshPanel();
  } else if (app.mode === 'overview') {
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 1.1);
      const e = 1 - Math.pow(1 - fly.t, 3);
      camera.position.lerpVectors(fly.p0, fly.p1, e); orbit.target.lerpVectors(fly.t0, fly.t1, e);
      if (fly.t >= 1) fly = null;
    }
    orbit.update();
  } else {
    // title: slow orbit around the dollhouse
    titleAngle += dt * 0.06;
    camera.position.set(5.9 + Math.cos(titleAngle) * 15, 12.5, 6.9 + Math.sin(titleAngle) * 15);
    camera.lookAt(5.9, -0.5, 6.9);
  }
  // avatar
  if (avatar.visible) {
    avatar.position.copy(player.pos); avatar.rotation.y = player.yaw + Math.PI;
    const sw = Math.sin(player.bob) * 0.6 * Math.min(1, player.speed / 2);
    const [legL, legR, armL, armR] = avatar.userData.limbs;
    legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
  }
  memSprites.forEach((s) => { s.position.y = 1.3 + Math.sin(clock * 2 + s.userData.phase) * 0.05; });
  updateLights(app.mode === 'walk' ? camera.position : orbit.target.clone().setY(1.5));
  if ((clock * 30 | 0) % 2 === 0) {
    const r = roomAt(player.pos.x, player.pos.z);
    const st = { x: player.pos.x, z: player.pos.z, yaw: player.yaw, room: r, found, showMem: app.memMode, pulse: clock };
    if (app.mode === 'walk') minimap.draw(st);
    if (modal === 'map') bigmap.draw(st);
  }
  if (app.quality && composer) composer.render(dt); else renderer.render(scene, camera);
}

function ready() {
  $('#btnWalk').disabled = false; $('#btnOverview').disabled = false;
  $('#loading').classList.add('hidden');
  window.__ready = true;
}
// debug hooks for automated screenshots: ?shot=x,z,yaw,pitch[,mode]
if (params.has('shot')) {
  const [x, z, yaw, pitch, mode] = params.get('shot').split(',');
  window.__shot = () => {
    if (mode === 'o') { setFloor(HOME_FLOOR); enterOverview(); fly = null; camera.position.set(+x, +yaw, +z); orbit.target.set(5.9, 0, 6.9); }
    else {
      player.pos.set(+x, groundAt(+x, +z, 0), +z); player.yaw = +yaw; player.pitch = +pitch || 0;
      enterWalk(); if (mode === 't') { app.view = 'tp'; avatar.visible = true; }
      if (mode === 'e') elevator.call();
      if (mode === 'd') building.front.toggle(true);
    }
  };
  window.__app = { app, player, building, elevator, house, setFloor, toggleDayNight, camera, renderer, toggleQuality };
}
requestAnimationFrame(frame);
