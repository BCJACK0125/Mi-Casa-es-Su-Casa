// Procedural canvas textures. Every tiling texture is authored so that its UVs are
// in meters (see kit.js world-UV pass); `meters` = how many meters one texture repeat covers.
import * as THREE from 'three';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

let maxAniso = 4;
export function setAniso(a) { maxAniso = a; }

function finish(c, meters, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const [mw, mh] = Array.isArray(meters) ? meters : [meters, meters];
    t.repeat.set(1 / mw, 1 / mh);
  }
  t.anisotropy = maxAniso;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return '#' + c.getHexString();
}

function speckle(g, w, h, n, colors, r0, r1, rand) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(rand() * colors.length) | 0];
    const r = r0 + rand() * (r1 - r0);
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, r, r * (0.6 + rand() * 0.6), rand() * 3, 0, Math.PI * 2);
    g.fill();
  }
}

// Square / rectangular ceramic tiles with grout.
export function tiles({ px = 512, nx = 4, ny = 4, tileW = 0.6, tileH = tileW, base = '#e8e5de', grout = '#c9c4ba',
  gw = 3, vary = 0.03, seed = 3, speck = 0, speckColors = null, sheen = true } = {}) {
  const [c, g] = cv(px, Math.round(px * (ny * tileH) / (nx * tileW)));
  const W = c.width, H = c.height, rand = rng(seed);
  g.fillStyle = grout; g.fillRect(0, 0, W, H);
  const tw = W / nx, th = H / ny;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = i * tw + gw / 2, y = j * th + gw / 2, w = tw - gw, h = th - gw;
    g.fillStyle = shade(base, (rand() - 0.5) * vary);
    g.fillRect(x, y, w, h);
    if (speck) speckle(g, 0, 0, 0, [], 0, 0, rand);
    if (sheen) {
      const gr = g.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, 'rgba(255,255,255,0.10)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0)');
      gr.addColorStop(1, 'rgba(0,0,0,0.05)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    }
  }
  if (speck) {
    g.save();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      g.save(); g.beginPath(); g.rect(i * tw + gw / 2, j * th + gw / 2, tw - gw, th - gw); g.clip();
      speckle(g, W, H, speck / (nx * ny), speckColors, 0.5, 1.6, rand);
      g.restore();
    }
    g.restore();
  }
  return finish(c, [nx * tileW, ny * tileH]);
}

export function wood({ px = 512, planks = 4, plankW = 0.15, len = 1.2, base = '#b47b46', seed = 7 } = {}) {
  const [c, g] = cv(px, px);
  const rand = rng(seed), pw = px / planks;
  for (let i = 0; i < planks; i++) {
    const off = rand() * px;
    for (let k = -1; k < 2; k++) {
      const y0 = off + k * px * 0.62;
      const col = shade(base, (rand() - 0.5) * 0.12);
      g.fillStyle = col; g.fillRect(i * pw, y0, pw, px * 0.62);
      for (let s = 0; s < 26; s++) {
        g.strokeStyle = `rgba(${rand() < 0.5 ? '70,40,20' : '230,190,140'},${0.05 + rand() * 0.12})`;
        g.lineWidth = 0.6 + rand() * 1.6;
        const x = i * pw + rand() * pw;
        g.beginPath(); g.moveTo(x, y0);
        g.bezierCurveTo(x + (rand() - 0.5) * 8, y0 + px * 0.2, x + (rand() - 0.5) * 8, y0 + px * 0.4, x + (rand() - 0.5) * 6, y0 + px * 0.62);
        g.stroke();
      }
      g.fillStyle = 'rgba(40,20,10,0.55)'; g.fillRect(i * pw, y0, pw, 2);
    }
    g.fillStyle = 'rgba(40,20,10,0.45)'; g.fillRect(i * pw, 0, 2, px);
  }
  return finish(c, [planks * plankW, len]);
}

export function stone({ px = 512, meters = 0.6, base = '#9b9b9b', colors = ['#ffffff', '#222222', '#6d6d6d', '#cfcfcf'], n = 9000, r0 = 0.6, r1 = 2.2, seed = 11 } = {}) {
  const [c, g] = cv(px, px);
  g.fillStyle = base; g.fillRect(0, 0, px, px);
  speckle(g, px, px, n, colors, r0, r1, rng(seed));
  return finish(c, meters);
}

export function paint({ base = '#f0ede6', meters = 1.5, seed = 5, amt = 0.018 } = {}) {
  const [c, g] = cv(256, 256);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const rand = rng(seed);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = rand() < 0.5 ? `rgba(0,0,0,${amt * rand()})` : `rgba(255,255,255,${amt * 2 * rand()})`;
    g.fillRect(rand() * 256, rand() * 256, 2 + rand() * 6, 2 + rand() * 6);
  }
  return finish(c, meters);
}

export function strips({ base = '#f1efe9', line = '#c8c4ba', n = 8, meters = 0.8, vertical = false } = {}) {
  const [c, g] = cv(256, 256);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) {
    const p = (i / n) * 256;
    g.fillStyle = line;
    if (vertical) g.fillRect(p, 0, 2, 256); else g.fillRect(0, p, 256, 2);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    if (vertical) g.fillRect(p + 2, 0, 1, 256); else g.fillRect(0, p + 2, 256, 1);
  }
  return finish(c, meters);
}

// Interlocking EVA foam mats (green / teal), edges jagged.
export function foam(color = '#2fae6b', meters = 0.6) {
  const [c, g] = cv(256, 256);
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  const rand = rng(21);
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(0,0,0,${rand() * 0.06})`; g.fillRect(rand() * 256, rand() * 256, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2;
  for (const horiz of [true, false]) {
    g.beginPath();
    for (let s = 0; s <= 16; s++) {
      const a = s * 16, b = (s % 2 ? 6 : -6);
      if (horiz) { s ? g.lineTo(a, 2 + b) : g.moveTo(a, 2 + b); } else { s ? g.lineTo(2 + b, a) : g.moveTo(2 + b, a); }
    }
    g.stroke();
  }
  return finish(c, meters);
}

// White panel cladding (fish-glass wall).
export function panels({ cols = 1, rows = 1, w = 0.6, h = 0.6, base = '#f2f0ea', line = '#cfcbc0' } = {}) {
  const [c, g] = cv(256, Math.round(256 * h / w));
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = line; g.lineWidth = 3; g.strokeRect(1, 1, c.width - 2, c.height - 2);
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.strokeRect(4, 4, c.width - 8, c.height - 8);
  return finish(c, [w, h]);
}

// Etched koi glass between hallway and living room.
export function etchedGlass() {
  const [c, g] = cv(1024, 600);
  g.fillStyle = 'rgba(200,225,230,0.18)'; g.fillRect(0, 0, 1024, 600);
  const rand = rng(99);
  const frost = 'rgba(245,250,252,0.85)';
  // seaweed
  g.strokeStyle = frost; g.lineCap = 'round';
  for (const [x0, n] of [[70, 6], [180, 4], [820, 5], [930, 6]]) {
    for (let i = 0; i < n; i++) {
      g.lineWidth = 3 + rand() * 3;
      const x = x0 + i * 10;
      g.beginPath(); g.moveTo(x, 600);
      g.bezierCurveTo(x + 40 * (rand() - .5), 450, x + 60 * (rand() - .5), 300, x + 50 * (rand() - .5), 120 + rand() * 120);
      g.stroke();
    }
  }
  // waves at bottom
  g.fillStyle = frost;
  g.beginPath(); g.moveTo(0, 600);
  for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 520 + Math.sin(x / 50) * 18 + Math.sin(x / 13) * 5);
  g.lineTo(1024, 600); g.fill();
  // koi
  function koi(x, y, s, ang, flip) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(flip ? -s : s, s);
    g.fillStyle = frost;
    g.beginPath();
    g.moveTo(-70, 0); g.bezierCurveTo(-60, -28, 30, -32, 70, -6);
    g.bezierCurveTo(80, 0, 80, 4, 70, 8); g.bezierCurveTo(30, 30, -60, 26, -70, 0); g.fill();
    g.beginPath(); g.moveTo(-66, 0); g.lineTo(-115, -30); g.quadraticCurveTo(-100, 0, -115, 30); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-5, -26); g.quadraticCurveTo(15, -55, 35, -22); g.fill();
    g.beginPath(); g.moveTo(20, 18); g.quadraticCurveTo(25, 40, 5, 42); g.fill();
    g.fillStyle = 'rgba(160,185,190,0.6)';
    g.beginPath(); g.arc(52, -4, 3.5, 0, 7); g.fill();
    g.strokeStyle = 'rgba(160,185,190,0.5)'; g.lineWidth = 1.5;
    for (let k = -40; k < 40; k += 12) { g.beginPath(); g.arc(k, 0, 9, -1, 1); g.stroke(); }
    g.restore();
  }
  koi(330, 150, 1.0, -0.25, false); koi(560, 260, 1.15, 0.12, true); koi(250, 380, 0.9, 0.3, false);
  koi(720, 120, 0.8, -0.1, true); koi(650, 430, 0.95, -0.2, false);
  for (let i = 0; i < 40; i++) { g.strokeStyle = frost; g.lineWidth = 1.5; g.beginPath(); g.arc(rand() * 1024, rand() * 480, 2 + rand() * 6, 0, 7); g.stroke(); }
  const t = finish(c, 1, { repeat: false });
  return t;
}

// Cream panel door with gold pin-lines; `louver` adds a vent at the bottom.
export function doorTex({ base = '#efe6cf', line = '#b89a4e', louver = false } = {}) {
  const [c, g] = cv(256, 640);
  g.fillStyle = base; g.fillRect(0, 0, 256, 640);
  const rand = rng(4);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(120,100,60,${rand() * 0.03})`; g.fillRect(rand() * 256, rand() * 640, 3, 3); }
  g.strokeStyle = line; g.lineWidth = 3;
  // upper panel with arched top
  g.beginPath(); g.moveTo(40, 300); g.lineTo(40, 80); g.quadraticCurveTo(128, 30, 216, 80); g.lineTo(216, 300); g.closePath(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 6; g.stroke();
  g.strokeStyle = line; g.lineWidth = 3;
  g.strokeRect(40, 340, 176, 250);
  if (louver) {
    g.fillStyle = '#c9a76a'; g.fillRect(60, 470, 136, 100);
    for (let y = 474; y < 570; y += 9) { g.fillStyle = '#9d7d45'; g.fillRect(60, y, 136, 3); }
  }
  return finish(c, 1, { repeat: false });
}

// Front entrance door: maroon with gold pin-lines, poster photo inset.
export function frontDoorTex(posterImg) {
  const [c, g] = cv(512, 1100);
  g.fillStyle = '#4b1b2c'; g.fillRect(0, 0, 512, 1100);
  const rand = rng(8);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${rand() * 0.03})`; g.fillRect(rand() * 512, rand() * 1100, 2, 2); }
  if (posterImg) g.drawImage(posterImg, 0, 0, 512, 1100);
  return finish(c, 1, { repeat: false });
}

export function narrowLeafTex() {
  const [c, g] = cv(128, 640);
  g.fillStyle = '#4b1b2c'; g.fillRect(0, 0, 128, 640);
  g.strokeStyle = '#c9a85e'; g.lineWidth = 3; g.strokeRect(28, 40, 72, 560);
  return finish(c, 1, { repeat: false });
}

// Stainless security gate: bars + square-pattern middle band, with alpha.
export function gateTex() {
  const [c, g] = cv(512, 1024);
  g.clearRect(0, 0, 512, 1024);
  g.fillStyle = '#d7d9dc';
  const frame = 22;
  g.fillRect(0, 0, 512, frame); g.fillRect(0, 1024 - frame, 512, frame); g.fillRect(0, 0, frame, 1024); g.fillRect(512 - frame, 0, frame, 1024);
  // upper vertical bars
  for (let x = 40; x < 500; x += 34) g.fillRect(x, frame, 10, 400);
  for (const y of [160, 230, 300, 400]) g.fillRect(0, y, 512, 10);
  // decorative middle band
  g.fillStyle = '#b9bcc0'; g.fillRect(0, 410, 512, 180);
  for (let y = 420; y < 580; y += 26) for (let x = 12; x < 500; x += 26) {
    g.fillStyle = (x + y) % 52 ? '#e9ebee' : '#8d9196'; g.fillRect(x, y, 18, 18);
    g.fillStyle = '#5d6166'; g.fillRect(x + 6, y + 6, 6, 6);
  }
  // lower horizontal louvres
  g.fillStyle = '#d7d9dc';
  for (let y = 610; y < 1000; y += 30) g.fillRect(0, y, 512, 10);
  for (let x = 40; x < 500; x += 34) g.fillRect(x, 600, 8, 400);
  const t = finish(c, 1, { repeat: false });
  return t;
}

export function grilleTex() {
  const [c, g] = cv(256, 512);
  g.clearRect(0, 0, 256, 512);
  g.fillStyle = '#2b2b2e';
  for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 6, 512);
  g.fillRect(0, 0, 256, 8); g.fillRect(0, 500, 256, 12);
  for (let x = 0; x < 256; x += 64) { g.beginPath(); g.ellipse(x + 32, 470, 22, 30, 0, 0, Math.PI * 2); g.lineWidth = 4; g.strokeStyle = '#2b2b2e'; g.stroke(); }
  return finish(c, [0.5, 1.4]);
}

export function bookSpines(seed = 1) {
  const [c, g] = cv(512, 128);
  const rand = rng(seed);
  g.fillStyle = '#2a1c14'; g.fillRect(0, 0, 512, 128);
  let x = 0;
  const pal = ['#8c2d2d', '#e8e3d3', '#2f4f7a', '#d9b44a', '#3f6e4b', '#f2f2f2', '#7a4c8c', '#c96a2b', '#1e1e1e', '#5b8db8', '#b9b0a0', '#a33f63'];
  while (x < 512) {
    const w = 6 + rand() * 18, h = 70 + rand() * 55;
    g.fillStyle = pal[(rand() * pal.length) | 0];
    g.fillRect(x, 128 - h, w - 1, h);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    if (rand() < 0.7) g.fillRect(x + 2, 128 - h + 8 + rand() * 20, w - 5, 3);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + w - 2, 128 - h, 1, h);
    x += w;
  }
  return finish(c, 1, { repeat: false });
}

export function skyline(night = true) {
  const [c, g] = cv(4096, 640);
  const rand = rng(night ? 12 : 13);
  const sky = g.createLinearGradient(0, 0, 0, 640);
  if (night) { sky.addColorStop(0, '#060914'); sky.addColorStop(0.55, '#141c33'); sky.addColorStop(1, '#3a3346'); }
  else { sky.addColorStop(0, '#6fa9e0'); sky.addColorStop(0.6, '#b8d6ef'); sky.addColorStop(1, '#e6eef2'); }
  g.fillStyle = sky; g.fillRect(0, 0, 4096, 640);
  if (night) for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${rand() * 0.5})`; g.fillRect(rand() * 4096, rand() * 260, 1.5, 1.5); }
  else for (let i = 0; i < 14; i++) {
    g.fillStyle = 'rgba(255,255,255,0.55)';
    const x = rand() * 4096, y = 60 + rand() * 180;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + k * 40, y + Math.sin(k) * 10, 60, 22, 0, 0, 7); g.fill(); }
  }
  // mountains far away
  g.fillStyle = night ? '#141826' : '#8fa6b5';
  g.beginPath(); g.moveTo(0, 470);
  for (let x = 0; x <= 4096; x += 32) g.lineTo(x, 400 + Math.sin(x / 300) * 40 + Math.sin(x / 90) * 12);
  g.lineTo(4096, 640); g.lineTo(0, 640); g.fill();
  for (let layer = 0; layer < 3; layer++) {
    let x = 0;
    while (x < 4096) {
      const w = 40 + rand() * 120, h = 60 + rand() * (layer === 2 ? 260 : 200) - layer * 20;
      const top = 640 - h - (2 - layer) * 40;
      const tone = night ? [24, 30, 44][layer] : [150, 160, 172][layer];
      g.fillStyle = night ? `rgb(${tone},${tone + 4},${tone + 14})` : `rgb(${tone + 30},${tone + 30},${tone + 28})`;
      g.fillRect(x, top, w, 640 - top);
      for (let wy = top + 8; wy < 630; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 10) {
        const lit = rand();
        if (night) { if (lit < 0.28) { g.fillStyle = lit < 0.05 ? '#bfe0ff' : '#ffd890'; g.globalAlpha = 0.5 + rand() * 0.5; g.fillRect(wx, wy, 5, 6); g.globalAlpha = 1; } }
        else if (lit < 0.5) { g.fillStyle = 'rgba(60,80,100,0.35)'; g.fillRect(wx, wy, 5, 6); }
      }
      x += w + rand() * 8;
    }
  }
  if (night) for (let i = 0; i < 300; i++) { g.fillStyle = rand() < 0.5 ? '#ffcf7a' : '#ff6b5a'; g.globalAlpha = 0.8; g.fillRect(rand() * 4096, 600 + rand() * 40, 2, 2); g.globalAlpha = 1; }
  const t = finish(c, 1, { repeat: false });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function ledDots() {
  const [c, g] = cv(256, 256);
  g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, 256, 256);
  for (let y = 8; y < 256; y += 16) for (let x = 8 + ((y / 16) % 2) * 8; x < 256; x += 16) {
    const gr = g.createRadialGradient(x, y, 0, x, y, 6);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#fffbe8'); gr.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
  }
  return finish(c, 0.4);
}

export function brushed(base = '#c9cacc') {
  const [c, g] = cv(256, 256);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const rand = rng(5);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rand() < .5 ? '255,255,255' : '0,0,0'},${rand() * 0.07})`; g.fillRect(0, rand() * 256, 256, 1); }
  return finish(c, 0.5);
}

export function clockFace() {
  const [c, g] = cv(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#f7f7f2'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = '#333'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#222'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(i, 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); }
  return finish(c, 1, { repeat: false });
}

// "Numbers" wall clock above the front door (wooden numerals only).
export function numberClock() {
  const [c, g] = cv(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#5a3a22'; g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [n, a] of [[12, 0], [2, 60], [4, 120], [6, 180], [8, 240], [10, 300]]) {
    const r = a * Math.PI / 180; g.fillText(n, 128 + Math.sin(r) * 92, 128 - Math.cos(r) * 92);
  }
  g.strokeStyle = '#3a2615'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 40, 128 - 30); g.stroke();
  g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 10, 128 - 70); g.stroke();
  return finish(c, 1, { repeat: false });
}

export function label(text, { w = 256, h = 128, bg = null, fg = '#ff3b30', font = 'bold 84px "Segoe UI", sans-serif', glow = false } = {}) {
  const [c, g] = cv(w, h);
  const t = finish(c, 1, { repeat: false });
  t.userData.draw = (s) => {
    g.clearRect(0, 0, w, h);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (glow) { g.shadowColor = fg; g.shadowBlur = 18; }
    g.fillText(s, w / 2, h / 2 + 4);
    g.shadowBlur = 0;
    t.needsUpdate = true;
  };
  t.userData.draw(text);
  return t;
}

export function blob() {
  const [c, g] = cv(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return finish(c, 1, { repeat: false, srgb: false });
}

export function stairTread() {
  const [c, g] = cv(256, 256);
  g.fillStyle = '#c99a94'; g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 256, 1600, ['#e2bdb6', '#a97a74', '#f0dcd6', '#8f625d'], 0.5, 1.5, rng(31));
  return finish(c, 0.5);
}

export function sprite(emoji, color = '#ffd36b') {
  const [c, g] = cv(256, 256);
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, color); gr.addColorStop(0.35, color + '88'); gr.addColorStop(1, color + '00');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.font = '110px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, 128, 136);
  return finish(c, 1, { repeat: false });
}

// Fake mirror: soft grey-blue gradient with diagonal sheen (real reflections are too costly).
export function mirrorTex() {
  const [c, g] = cv(256, 256);
  const gr = g.createLinearGradient(0, 0, 256, 256);
  gr.addColorStop(0, '#dfe7ea'); gr.addColorStop(0.5, '#b8c4c9'); gr.addColorStop(1, '#d5dde0');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.moveTo(40, 0); g.lineTo(110, 0); g.lineTo(0, 110); g.lineTo(0, 40); g.fill();
  g.beginPath(); g.moveTo(150, 0); g.lineTo(170, 0); g.lineTo(0, 170); g.lineTo(0, 150); g.fill();
  return finish(c, 1, { repeat: false });
}

// Garment silhouette (shirt / trousers / towel) with alpha, for laundry and door hooks.
export function garment(color, kind = 0) {
  const [c, g] = cv(128, 160);
  g.clearRect(0, 0, 128, 160);
  g.fillStyle = color;
  g.beginPath();
  if (kind === 0) { // t-shirt
    g.moveTo(44, 6); g.quadraticCurveTo(64, 20, 84, 6); g.lineTo(122, 28); g.lineTo(108, 56); g.lineTo(96, 48);
    g.lineTo(98, 156); g.lineTo(30, 156); g.lineTo(32, 48); g.lineTo(20, 56); g.lineTo(6, 28); g.closePath();
  } else if (kind === 1) { // trousers
    g.moveTo(30, 4); g.lineTo(98, 4); g.lineTo(108, 156); g.lineTo(72, 156); g.lineTo(64, 60); g.lineTo(56, 156); g.lineTo(20, 156); g.closePath();
  } else { // towel / dress
    g.moveTo(36, 4); g.lineTo(92, 4); g.lineTo(110, 156); g.lineTo(18, 156); g.closePath();
  }
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(0,0,0,0.06)'; g.beginPath(); g.moveTo(40 + i * 9, 30); g.lineTo(36 + i * 10, 150); g.stroke(); }
  return finish(c, 1, { repeat: false });
}
