// Furniture library. Each builder returns a THREE.Group whose origin sits on the floor
// at the footprint center, with its "front" facing local +Z.
import * as THREE from 'three';
import { M, cbox, cyl, sph, plane, colorMat, pictureMat } from './kit.js';
import * as T from './tex.js';

const G = () => new THREE.Group();
const garmentCache = new Map();
function garmentMat(color, kind) {
  const k = color + kind;
  if (!garmentCache.has(k)) garmentCache.set(k, new THREE.MeshStandardMaterial({ map: T.garment(color, kind), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 }));
  return garmentCache.get(k);
}
const add = (g, ...ms) => { ms.forEach((m) => g.add(m)); return g; };
const cm = colorMat;

// raised-panel cabinet door face (used by wardrobes / kitchen)
function doorFace(g, mat, w, h, x, y, z, { knob = true, knobMat = M.gold, knobSide = 1, inset = 0.05 } = {}) {
  add(g, cbox(mat, w - 0.008, h - 0.008, 0.02, x, y, z));
  add(g, cbox(mat, w - inset * 2, h - inset * 2, 0.012, x, y + inset, z + 0.014));
  if (knob) add(g, cbox(knobMat, 0.015, 0.06, 0.02, x + knobSide * (w / 2 - 0.05), y + h * 0.5, z + 0.025));
}

export function bed({ w = 1.5, l = 2.0, frame = M.honey, sheet = '#6f86b8', h = 0.42, headboard = true, platform = 0.18 } = {}) {
  const g = G();
  add(g, cbox(frame, w + 0.1, platform, l + 0.08, 0, 0, 0));
  add(g, cbox(cm(sheet, 0.95), w, h - platform, l, 0, platform, 0.02));
  add(g, cbox(cm('#e9e4dc', 0.95), w * 0.38, 0.1, 0.4, -w * 0.22, h, -l / 2 + 0.3));
  add(g, cbox(cm('#e9e4dc', 0.95), w * 0.38, 0.1, 0.4, w * 0.22, h, -l / 2 + 0.3));
  if (headboard) {
    add(g, cbox(frame, w + 0.2, 0.75, 0.22, 0, 0, -l / 2 - 0.08));
    add(g, cbox(frame, w + 0.2, 0.03, 0.26, 0, 0.75, -l / 2 - 0.08));
  }
  return g;
}

export function mattress({ w = 0.95, l = 1.9, sheet = '#eef2f1' } = {}) {
  const g = G();
  add(g, cbox(cm(sheet, 0.95), w, 0.2, l, 0, 0, 0));
  add(g, cbox(cm('#e3e7e6', 0.95), 0.55, 0.09, 0.32, 0, 0.2, -l / 2 + 0.24));
  add(g, cbox(cm('#a9c2d2', 0.95), 0.6, 0.06, 0.5, 0.1, 0.2, 0.0));
  return g;
}

export function nightstand(mat = M.honey) {
  const g = G();
  add(g, cbox(mat, 0.45, 0.62, 0.42, 0, 0, 0));
  for (let i = 0; i < 3; i++) {
    add(g, cbox(mat, 0.4, 0.17, 0.02, 0, 0.04 + i * 0.19, 0.21));
    add(g, cbox(M.gold, 0.1, 0.015, 0.02, 0, 0.12 + i * 0.19, 0.225));
  }
  return g;
}

export function desk({ w = 1.1, d = 0.55, h = 0.74, top = M.white, leg = M.aluLight, drawers = false } = {}) {
  const g = G();
  add(g, cbox(top, w, 0.035, d, 0, h - 0.035, 0));
  if (drawers) {
    add(g, cbox(top, 0.42, h - 0.035, d - 0.02, w / 2 - 0.22, 0, 0));
    for (let i = 0; i < 4; i++) add(g, cbox(cm('#e9e9e4', 0.5), 0.4, 0.15, 0.015, w / 2 - 0.22, 0.03 + i * 0.17, d / 2));
    add(g, cbox(top, 0.03, h - 0.035, d - 0.02, -w / 2 + 0.02, 0, 0));
  } else {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cbox(leg, 0.04, h - 0.035, 0.04, sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.04)));
  }
  return g;
}

export function officeChair(color = '#1d1d1f') {
  const g = G(), mat = cm(color, 0.7);
  add(g, cyl(M.black, 0.03, 0.03, 0.42, 0, 0.06, 0));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, leg = cbox(M.black, 0.04, 0.03, 0.3, Math.sin(a) * 0.14, 0.04, Math.cos(a) * 0.14);
    leg.rotation.y = a; g.add(leg);
  }
  add(g, cbox(mat, 0.46, 0.08, 0.44, 0, 0.44, 0));
  add(g, cbox(mat, 0.44, 0.5, 0.06, 0, 0.55, -0.22));
  return g;
}

export function slatChair({ wood = M.walnut, seat = '#d9c9a3' } = {}) {
  const g = G();
  for (const sx of [-1, 1]) {
    add(g, cbox(wood, 0.04, 0.45, 0.04, sx * 0.19, 0, 0.18));
    add(g, cbox(wood, 0.04, 0.98, 0.04, sx * 0.19, 0, -0.19));
  }
  add(g, cbox(wood, 0.44, 0.05, 0.44, 0, 0.42, 0));
  add(g, cbox(cm(seat, 0.9), 0.4, 0.04, 0.38, 0, 0.47, 0.01));
  for (let i = 0; i < 6; i++) add(g, cbox(wood, 0.03, 0.45, 0.02, -0.13 + i * 0.052, 0.5, -0.19));
  add(g, cbox(wood, 0.42, 0.05, 0.03, 0, 0.93, -0.19));
  return g;
}

export function diningTable() {
  const g = G();
  add(g, cbox(M.darkWood, 0.9, 0.08, 1.45, 0, 0.66, 0));
  add(g, cbox(new THREE.MeshStandardMaterial({ color: '#b9d9a6', roughness: 0.08, transparent: true, opacity: 0.85 }), 0.92, 0.012, 1.47, 0, 0.745, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = cbox(M.darkWood, 0.06, 0.66, 0.06, sx * 0.39, 0, sz * 0.66);
    g.add(leg);
  }
  // laptop + vase + flags (lived-in details from the photos)
  add(g, cbox(cm('#24366a', 0.4), 0.34, 0.015, 0.24, -0.1, 0.758, -0.25));
  const scr = cbox(cm('#24366a', 0.4), 0.34, 0.22, 0.012, -0.1, 0.77, -0.37); scr.rotation.x = -0.25; g.add(scr);
  add(g, cyl(M.porcelain, 0.03, 0.045, 0.22, 0.2, 0.757, 0.2));
  add(g, sph(cm('#f3d7d7', 0.8), 0.05, 0.2, 1.0, 0.2));
  const flag = plane(new THREE.MeshStandardMaterial({ color: '#d83a2e', side: THREE.DoubleSide }), 0.12, 0.08, 0.34, 0.95, 0.42, 0.5);
  g.add(flag);
  add(g, cyl(M.darkWood, 0.004, 0.004, 0.25, 0.28, 0.757, 0.42));
  add(g, cbox(cm('#c43a3a', 0.4), 0.06, 0.03, 0.1, -0.25, 0.757, 0.1));
  return g;
}

export function bookcase({ w = 0.9, h = 1.85, d = 0.33, mat = M.midWood, glass = true, lower = 0, seed = 1 } = {}) {
  const g = G();
  const sideT = 0.025;
  add(g, cbox(mat, sideT, h, d, -w / 2 + sideT / 2, 0, 0), cbox(mat, sideT, h, d, w / 2 - sideT / 2, 0, 0));
  add(g, cbox(mat, w, sideT, d, 0, h - sideT, 0), cbox(mat, w, 0.06, d, 0, 0, 0));
  add(g, cbox(mat, w, h, 0.01, 0, 0, -d / 2 + 0.005));
  const shelves = 5;
  const top0 = lower > 0 ? lower : 0.06;
  const sh = (h - top0 - sideT) / (shelves - (lower ? 1 : 0));
  const rows = lower ? shelves - 1 : shelves;
  for (let i = 0; i <= rows; i++) add(g, cbox(mat, w - 0.04, 0.02, d - 0.02, 0, top0 + i * sh - 0.02, 0));
  const spines = pictureMat(T.bookSpines(seed), 0.8);
  for (let i = 0; i < rows; i++) {
    const p = plane(spines, w - 0.06, sh * 0.82, 0, top0 + i * sh + sh * 0.41, d / 2 - 0.08);
    p.material = spines;
    g.add(p);
    add(g, cbox(cm('#2b1d14', 0.9), w - 0.06, sh * 0.82, 0.18, 0, top0 + i * sh, -0.03));
  }
  if (lower) {
    doorFace(g, mat, w / 2 - 0.02, lower - 0.08, -w / 4, 0.06, d / 2, { knobSide: 1 });
    doorFace(g, mat, w / 2 - 0.02, lower - 0.08, w / 4, 0.06, d / 2, { knobSide: -1 });
  }
  if (glass) add(g, cbox(M.glass, w - 0.05, h - top0 - 0.03, 0.006, 0, top0, d / 2 + 0.005));
  return g;
}

export function openShelf({ w = 0.8, h = 0.85, d = 0.3, mat = M.midWood, levels = 3, seed = 3 } = {}) {
  const g = G();
  add(g, cbox(mat, 0.02, h, d, -w / 2, 0, 0), cbox(mat, 0.02, h, d, w / 2, 0, 0), cbox(mat, w, 0.02, d, 0, h - 0.02, 0), cbox(mat, w, 0.01, d, 0, 0, -d / 2));
  const spines = pictureMat(T.bookSpines(seed), 0.8);
  for (let i = 0; i < levels; i++) {
    add(g, cbox(mat, w, 0.02, d, 0, i * h / levels, 0));
    g.add(plane(spines, w - 0.04, h / levels * 0.7, 0, i * h / levels + h / levels * 0.37, d / 2 - 0.05));
  }
  return g;
}

// Built-in wardrobe with upper cabinets (white raised panels, full height).
export function wardrobe({ w = 2.4, h = 2.6, d = 0.6, doors = 4, mat = M.cabinet, clothes = [], shelfEnd = 0 } = {}) {
  const g = G();
  const cw = w - shelfEnd;
  add(g, cbox(mat, w, h, d - 0.03, 0, 0, -0.015));
  add(g, cbox(M.base, w, 0.08, 0.02, 0, 0, d / 2 - 0.02));
  const dw = cw / doors, lowH = h * 0.7;
  for (let i = 0; i < doors; i++) {
    const x = -w / 2 + dw * (i + 0.5);
    doorFace(g, mat, dw, lowH - 0.1, x, 0.09, d / 2 - 0.01, { knob: false });
    doorFace(g, mat, dw, h - lowH - 0.02, x, lowH, d / 2 - 0.01, { knob: false });
    add(g, cbox(M.gold, 0.012, 0.012, 0.03, x + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), lowH - 0.3, d / 2 + 0.01));
  }
  if (shelfEnd) {
    const x = w / 2 - shelfEnd / 2;
    add(g, cbox(cm('#e8e4da', 0.6), shelfEnd - 0.02, h - 0.1, d - 0.1, x, 0.05, -0.06));
    const spines = pictureMat(T.bookSpines(7), 0.8);
    for (let i = 0; i < 5; i++) {
      add(g, cbox(mat, shelfEnd, 0.02, d - 0.05, x, 0.4 + i * 0.4, 0));
      g.add(plane(spines, shelfEnd - 0.04, 0.22, x, 0.53 + i * 0.4, d / 2 - 0.12));
    }
  }
  // clothes hanging on the door hooks
  clothes.forEach((c, i) => {
    const x = -w / 2 + (i + 0.6) * (cw / Math.max(clothes.length, 1));
    const h = 0.62 + (i % 3) * 0.14;
    g.add(plane(garmentMat(c, i % 3 === 1 ? 2 : 0), 0.36, h, x, lowH - 0.24 - h / 2, d / 2 + 0.035));
    add(g, cbox(M.gold, 0.02, 0.03, 0.03, x, lowH - 0.22, d / 2 + 0.01));
  });
  return g;
}

export function piano() {
  const g = G(), m = M.cherry;
  add(g, cbox(m, 1.38, 0.08, 0.45, 0, 0.72, 0));          // key bed
  add(g, cbox(m, 1.38, 0.2, 0.25, 0, 0.8, -0.1));          // top body
  add(g, cbox(m, 1.38, 0.04, 0.3, 0, 0.98, -0.07));
  add(g, cbox(m, 0.05, 0.72, 0.42, -0.66, 0, 0), cbox(m, 0.05, 0.72, 0.42, 0.66, 0, 0));
  add(g, cbox(m, 1.3, 0.5, 0.03, 0, 0.12, -0.18));
  add(g, cbox(M.white, 1.24, 0.02, 0.15, 0, 0.8, 0.13));
  for (let i = 0; i < 36; i++) if (i % 7 !== 2 && i % 7 !== 6) add(g, cbox(M.black, 0.018, 0.015, 0.09, -0.6 + i * 0.0345 + 0.017, 0.82, 0.1));
  for (const x of [-0.06, 0, 0.06]) add(g, cbox(M.gold, 0.03, 0.02, 0.06, x, 0.03, 0.05));
  return g;
}

export function tvSet() {
  const g = G();
  add(g, cbox(M.darkWood, 2.0, 0.48, 0.48, 0, 0.04, 0));
  add(g, cbox(cm('#2c1a12', 0.15), 2.02, 0.015, 0.5, 0, 0.52, 0));
  for (let i = 0; i < 3; i++) {
    add(g, cbox(cm('#4a2e22', 0.5), 0.6, 0.18, 0.015, -0.66 + i * 0.66, 0.08, 0.245));
    add(g, cbox(M.glassFrost, 0.6, 0.16, 0.015, -0.66 + i * 0.66, 0.29, 0.245));
    add(g, cbox(M.chrome, 0.08, 0.012, 0.02, -0.66 + i * 0.66, 0.17, 0.26));
  }
  add(g, cbox(M.black, 0.4, 0.03, 0.2, 0, 0.535, -0.05));
  add(g, cbox(M.black, 0.06, 0.12, 0.05, 0, 0.56, -0.05));
  add(g, cbox(M.blackGloss, 1.08, 0.64, 0.05, 0, 0.66, -0.05));
  add(g, cbox(M.black, 0.9, 0.08, 0.1, 0, 0.535, 0.12));         // soundbar
  add(g, cbox(M.black, 0.18, 0.4, 0.2, -0.82, 0.535, -0.06));    // speaker
  return g;
}

export function tallCabinet() {
  const g = G(), m = M.midWood;
  add(g, cbox(m, 0.62, 1.55, 0.42, 0, 0, 0));
  add(g, cbox(M.glass, 0.26, 0.6, 0.01, -0.15, 0.25, 0.215), cbox(M.glass, 0.26, 0.6, 0.01, 0.15, 0.25, 0.215));
  add(g, cbox(cm('#3c2a20', 0.9), 0.56, 0.6, 0.02, 0, 0.25, 0.19));
  doorFace(g, m, 0.3, 0.6, -0.155, 0.9, 0.21, { knobSide: 1 });
  doorFace(g, m, 0.3, 0.6, 0.155, 0.9, 0.21, { knobSide: -1 });
  add(g, sph(M.white, 0.13, -0.12, 1.65, 0, 1, 0.85, 1));       // helmets on top
  add(g, sph(M.black, 0.13, 0.15, 1.65, 0, 1, 0.85, 1));
  add(g, sph(cm('#c5294a', 0.7), 0.08, 0.2, 1.8, 0.05));        // flowers
  return g;
}

export function coffeeTable() {
  const g = G();
  add(g, cbox(cm('#e7d9a8', 0.5), 1.15, 0.05, 0.58, 0, 0.36, 0));
  add(g, cbox(M.darkWood, 1.17, 0.04, 0.6, 0, 0.33, 0));
  for (const sx of [-1, 1]) add(g, cbox(M.darkWood, 0.12, 0.33, 0.5, sx * 0.48, 0, 0));
  add(g, cbox(cm('#e9d84a', 0.8), 0.22, 0.1, 0.18, -0.2, 0.41, 0.05));
  add(g, cbox(cm('#efe26a', 0.8), 0.2, 0.08, 0.18, 0.15, 0.41, -0.08));
  add(g, cbox(cm('#e7a2b5', 0.6), 0.16, 0.08, 0.12, 0.42, 0.41, 0.1));
  return g;
}

// Armchair draped with the gold satin cover.
export function coveredChair() {
  const g = G(), satin = cm('#d9c38f', 0.35);
  add(g, cbox(satin, 0.85, 0.45, 0.8, 0, 0, 0));
  add(g, cbox(satin, 0.85, 0.5, 0.22, 0, 0.42, -0.3));
  add(g, cbox(satin, 0.18, 0.25, 0.7, -0.34, 0.42, 0.03), cbox(satin, 0.18, 0.25, 0.7, 0.34, 0.42, 0.03));
  const pillow = cbox(cm('#e7a3b1', 0.8), 0.42, 0.36, 0.12, 0, 0.47, -0.12); pillow.rotation.x = -0.2; g.add(pillow);
  return g;
}

export function loungeChair() {
  const g = G(), w = M.honey, red = cm('#b4232a', 0.6);
  for (const sx of [-1, 1]) {
    const side = cbox(w, 0.05, 0.06, 0.9, sx * 0.3, 0.12, 0); side.rotation.x = 0.0; g.add(side);
    add(g, cbox(w, 0.05, 0.55, 0.05, sx * 0.3, 0, 0.35), cbox(w, 0.06, 0.04, 0.55, sx * 0.3, 0.55, 0.15));
  }
  const seat = cbox(red, 0.55, 0.1, 0.55, 0, 0.3, 0.08); seat.rotation.x = 0.12; g.add(seat);
  const back = cbox(red, 0.55, 0.7, 0.1, 0, 0.35, -0.3); back.rotation.x = -0.45; g.add(back);
  add(g, cbox(cm('#7fc4d6', 0.8), 0.35, 0.25, 0.08, 0, 0.43, -0.12));
  return g;
}

export function standFan() {
  const g = G(), wht = cm('#f2f1ec', 0.4);
  add(g, cyl(wht, 0.17, 0.19, 0.04, 0, 0, 0, 20));
  add(g, cyl(wht, 0.018, 0.018, 0.85, 0, 0.04, 0, 8));
  add(g, cbox(wht, 0.1, 0.12, 0.16, 0, 0.88, -0.04));
  const cage = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.008, 6, 28), wht);
  cage.position.set(0, 1.05, 0.08); g.add(cage);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.185, 24), new THREE.MeshStandardMaterial({ color: '#e8eef0', transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  disk.position.set(0, 1.05, 0.08); g.add(disk);
  add(g, sph(cm('#a8c9d6', 0.5), 0.05, 0, 1.05, 0.09));
  return g;
}

export function acUnit() {
  const g = G();
  add(g, cbox(M.plastic, 0.62, 0.38, 0.12, 0, 0, 0));
  for (let i = 0; i < 6; i++) add(g, cbox(cm('#cfcfca', 0.5), 0.3, 0.012, 0.02, -0.13, 0.08 + i * 0.04, 0.065));
  add(g, cbox(cm('#d6d6d1', 0.5), 0.15, 0.25, 0.02, 0.2, 0.06, 0.065));
  add(g, cbox(M.white, 0.68, 0.44, 0.03, 0, -0.03, -0.05));
  return g;
}

export function sideboard() {
  const g = G(), m = M.honey;
  add(g, cbox(m, 1.15, 0.84, 0.42, 0, 0.04, 0));
  add(g, cbox(cm('#b07a3c', 0.4), 1.2, 0.04, 0.46, 0, 0.86, 0));
  add(g, cbox(cm('#a8743a', 0.5), 1.15, 0.05, 0.4, 0, 0, 0));
  for (let i = 0; i < 3; i++) {
    doorFace(g, m, 0.37, 0.14, -0.38 + i * 0.38, 0.66, 0.21, { knob: false });
    doorFace(g, m, 0.37, 0.56, -0.38 + i * 0.38, 0.08, 0.21, { knobSide: i === 1 ? -1 : 1 });
  }
  add(g, cyl(M.glass, 0.04, 0.05, 0.25, -0.3, 0.9, 0));
  add(g, sph(cm('#f0c419', 0.6), 0.1, -0.3, 1.2, 0, 1.4, 0.7, 1));
  add(g, cbox(cm('#5dbbe3', 0.5), 0.2, 0.1, 0.12, 0.1, 0.9, 0.05));
  add(g, cyl(M.white, 0.03, 0.03, 0.12, 0.35, 0.9, 0));
  return g;
}

export function fridge() {
  const g = G();
  add(g, cbox(M.fridge, 0.68, 1.78, 0.68, 0, 0.02, 0));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.46), pictureMat(M.tex.fridge, 0.35));
  front.position.set(0, 1.5, 0.345); g.add(front);
  add(g, cbox(cm('#9da0a2', 0.3, 0.6), 0.66, 0.01, 0.01, 0, 1.24, 0.345));
  add(g, cbox(cm('#9da0a2', 0.3, 0.6), 0.66, 0.01, 0.01, 0, 0.62, 0.345));
  add(g, cbox(cm('#8acb5d', 0.5), 0.18, 0.2, 0.08, 0.05, 1.8, 0));   // watering can on top
  return g;
}

export function wireRack({ w = 0.9, d = 0.45, h = 1.6, levels = 4 } = {}) {
  const g = G(), wire = cm('#5c5d60', 0.4, 0.7);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cyl(wire, 0.012, 0.012, h, sx * (w / 2 - 0.02), 0, sz * (d / 2 - 0.02), 6));
  for (let i = 0; i < levels; i++) {
    const y = 0.1 + i * (h - 0.15) / (levels - 1);
    add(g, cbox(cm('#7a7b7e', 0.4, 0.6), w, 0.012, d, 0, y, 0));
  }
  add(g, cyl(M.steel, 0.16, 0.14, 0.12, -0.15, h - 0.04, 0));
  add(g, cyl(cm('#e9a1b0', 0.5), 0.12, 0.1, 0.14, 0.22, h - 0.04, 0));
  add(g, cyl(M.steel, 0.1, 0.1, 0.12, 0.1, 0.6, 0));
  add(g, cbox(cm('#f08a46', 0.8), 0.12, 0.2, 0.02, 0.25, 0.85, d / 2));
  add(g, cbox(cm('#f3d24b', 0.9), 0.4, 0.3, 0.25, -0.15, 0.1, 0.02));
  return g;
}

export function riceCooker() {
  const g = G();
  add(g, cyl(M.white, 0.15, 0.16, 0.2, 0, 0, 0, 20));
  add(g, sph(M.white, 0.15, 0, 0.2, 0, 1, 0.35, 1));
  add(g, cbox(cm('#bfc7cc', 0.4), 0.1, 0.05, 0.02, 0, 0.08, 0.155));
  return g;
}

export function toilet() {
  const g = G(), p = M.porcelain;
  add(g, cyl(p, 0.13, 0.11, 0.38, 0, 0, 0.05, 18));
  const bowl = sph(p, 0.2, 0, 0.36, 0.08, 0.9, 0.35, 1.15); g.add(bowl);
  add(g, cbox(cm('#e7cf74', 0.45), 0.36, 0.03, 0.44, 0, 0.41, 0.09));  // yellow seat
  add(g, cbox(p, 0.42, 0.38, 0.18, 0, 0.42, -0.2));
  add(g, cbox(p, 0.44, 0.04, 0.2, 0, 0.8, -0.2));
  return g;
}

export function pedestalSink() {
  const g = G(), p = M.porcelain;
  add(g, cyl(p, 0.07, 0.1, 0.72, 0, 0, -0.05, 14));
  add(g, cbox(p, 0.5, 0.14, 0.4, 0, 0.72, 0));
  add(g, cbox(cm('#d9d9d4', 0.2), 0.36, 0.02, 0.26, 0, 0.845, 0.02));
  add(g, cyl(M.chrome, 0.015, 0.015, 0.12, 0, 0.86, -0.14), cbox(M.chrome, 0.02, 0.02, 0.1, 0, 0.96, -0.1));
  return g;
}

export function bathtub({ l = 1.5, w = 0.72 } = {}) {
  const g = G();
  add(g, cbox(M.wallTile, w, 0.55, l, 0, 0, 0));
  add(g, cbox(cm('#e8e2c8', 0.2), w - 0.12, 0.02, l - 0.12, 0, 0.535, 0));
  return g;
}

export function washer() {
  const g = G();
  add(g, cbox(cm('#c4c3be', 0.4, 0.2), 0.56, 0.86, 0.56, 0, 0, 0));
  add(g, cbox(cm('#d8d6cf', 0.4), 0.56, 0.12, 0.2, 0, 0.86, -0.18));
  add(g, cbox(cm('#e3e1d9', 0.3), 0.5, 0.02, 0.36, 0, 0.86, 0.08));
  return g;
}

export function waterHeater() {
  const g = G();
  add(g, cbox(cm('#f3f3ef', 0.4), 0.36, 0.5, 0.15, 0, 0, 0));
  add(g, cbox(cm('#3a6fb0', 0.4), 0.1, 0.06, 0.01, 0, 0.3, 0.08));
  add(g, cyl(M.steel, 0.01, 0.01, 0.4, -0.08, -0.4, 0.02, 6), cyl(M.steel, 0.01, 0.01, 0.4, 0.08, -0.4, 0.02, 6));
  return g;
}

export function storageBin(color = '#f3f3ef', lid = null) {
  const g = G();
  add(g, cbox(new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: true, opacity: 0.85 }), 0.55, 0.32, 0.4, 0, 0, 0));
  if (lid) add(g, cbox(cm(lid, 0.4), 0.57, 0.03, 0.42, 0, 0.32, 0));
  return g;
}

export function plasticDrawers() {
  const g = G();
  for (let i = 0; i < 3; i++) {
    add(g, cbox(new THREE.MeshStandardMaterial({ color: '#eef1f2', transparent: true, opacity: 0.8, roughness: 0.3 }), 0.5, 0.26, 0.4, 0, i * 0.27, 0));
    add(g, cbox(cm(['#7aa0c9', '#d77f70', '#9ccf8b'][i], 0.8), 0.4, 0.18, 0.3, 0, i * 0.27 + 0.03, -0.02));
    add(g, cbox(cm('#e05a3a', 0.4), 0.12, 0.02, 0.02, 0, i * 0.27 + 0.2, 0.2));
  }
  const pillow = cyl(cm('#f2d22a', 0.5), 0.1, 0.1, 0.55, 0, 0.64, 0, 12); pillow.rotation.z = Math.PI / 2; g.add(pillow);
  return g;
}

export function stool(color = '#1a1a1a', seat = '#e74c3c') {
  const g = G();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; add(g, cyl(cm(color, 0.5, 0.4), 0.012, 0.015, 0.45, Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12, 6)); }
  add(g, cyl(cm(color, 0.5), 0.15, 0.15, 0.04, 0, 0.45, 0, 18));
  return g;
}

export function plasticStool(color = '#67b36d') {
  const g = G(), m = cm(color, 0.5);
  const body = cyl(m, 0.14, 0.18, 0.42, 0, 0, 0, 4); body.rotation.y = Math.PI / 4; g.add(body);
  return g;
}

export function shoeRack() {
  const g = G(), wire = cm('#222', 0.5, 0.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cyl(wire, 0.008, 0.008, 0.8, sx * 0.29, 0, sz * 0.14, 5));
  const shoeCols = ['#202020', '#f0f0f0', '#3a3a3a', '#d64545', '#e8e1d2', '#18306b'];
  for (let i = 0; i < 4; i++) {
    add(g, cbox(wire, 0.6, 0.01, 0.3, 0, 0.08 + i * 0.2, 0));
    for (let k = 0; k < 3; k++) add(g, cbox(cm(shoeCols[(i * 3 + k) % shoeCols.length], 0.7), 0.1, 0.08, 0.26, -0.2 + k * 0.2, 0.09 + i * 0.2, 0));
  }
  return g;
}

export function bicycle() {
  const g = G(), wheel = new THREE.TorusGeometry(0.33, 0.02, 6, 28), blk = cm('#151515', 0.5), fr = cm('#2b2b2b', 0.3, 0.6);
  for (const z of [-0.5, 0.5]) { const w = new THREE.Mesh(wheel, blk); w.rotation.y = Math.PI / 2; w.position.set(0, 0.35, z); g.add(w); }
  const bar = (len, x, y, z, rx) => { const b = cbox(fr, 0.03, len, 0.03, x, y, z); b.rotation.x = rx; g.add(b); };
  bar(0.6, 0, 0.35, -0.15, 1.1); bar(0.55, 0, 0.35, 0.18, -0.5); bar(0.5, 0, 0.62, -0.05, 1.57);
  add(g, cbox(blk, 0.1, 0.04, 0.22, 0, 0.88, 0.0), cbox(fr, 0.45, 0.025, 0.025, 0, 0.92, -0.42));
  return g;
}

export function washbasinShelf() {
  const g = G();
  add(g, cbox(M.pine, 0.4, 0.95, 0.3, 0, 0, 0));
  for (let i = 1; i < 4; i++) add(g, cbox(cm('#c49656', 0.6), 0.38, 0.02, 0.28, 0, i * 0.23, 0.01));
  return g;
}

// Pendant: 3 egg globes on long cords.
export function pendant3() {
  const g = G(), glow = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4e0', emissiveIntensity: 1.6, roughness: 0.4 });
  [[0, 1.85, -0.08], [0.1, 1.62, 0.06], [-0.08, 1.38, 0.0]].forEach(([x, y, z]) => {
    add(g, cyl(M.black, 0.003, 0.003, 2.8 - y, x, y, z, 4));
    g.add(sph(glow, 0.1, x, y - 0.06, z, 1, 1.3, 1));
  });
  return g;
}

export function domeLight(r = 0.18, mat = null) {
  const g = G();
  add(g, cyl(M.gold, r + 0.03, r + 0.03, 0.02, 0, -0.02, 0, 24));
  g.add(sph(mat || M.bulb, r, 0, -0.02, 0, 1, 0.45, 1));
  return g;
}

export function flowerChandelier() {
  const g = G(), glow = M.bulb, metal = cm('#c8b37a', 0.3, 0.8);
  add(g, cyl(metal, 0.12, 0.15, 0.06, 0, -0.06, 0, 16));
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    g.add(sph(glow, 0.07, Math.cos(a) * 0.17, -0.12, Math.sin(a) * 0.17, 1, 0.8, 1));
  }
  g.add(sph(glow, 0.09, 0, -0.16, 0));
  return g;
}

// Curtain made of a pleated plane. `mat` is the fabric; height from top downward.
export function curtain(mat, w, h, folds = 8) {
  const geo = new THREE.PlaneGeometry(w, h, folds * 4, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w) * folds * Math.PI * 2) * 0.035);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.position.y = -h / 2;
  const g = G(); g.add(m);
  return g;
}

export function valance(w) {
  const g = G();
  add(g, cbox(M.white, w, 0.2, 0.14, 0, 0, 0));
  return g;
}

export function clothesLine(len, colors) {
  const g = G();
  add(g, cbox(M.steel, 0.025, 0.025, len, 0, 0, 0));
  colors.forEach((c, i) => {
    const z = -len / 2 + (i + 0.5) * (len / colors.length);
    const h = 0.6 + (i % 3) * 0.12;
    g.add(plane(garmentMat(c, i % 4 === 3 ? 1 : 0), 0.48, h, 0, -0.05 - h / 2, z, Math.PI / 2));
    add(g, cbox(M.steel, 0.01, 0.06, 0.3, 0, -0.08, z));
  });
  return g;
}

export function cardboard(w = 0.45, h = 0.32, d = 0.35) {
  const g = G();
  add(g, cbox(cm('#c49a62', 0.9), w, h, d, 0, 0, 0));
  add(g, cbox(cm('#d9b27a', 0.9), w, 0.005, 0.05, 0, h, 0));
  return g;
}

export function basket(color = '#e85a4f') {
  const g = G();
  add(g, cyl(cm(color, 0.7), 0.2, 0.15, 0.2, 0, 0, 0, 14));
  return g;
}

export function trashCan(color = '#2a2a2a') {
  const g = G();
  add(g, cyl(cm(color, 0.6), 0.14, 0.12, 0.32, 0, 0, 0, 14));
  return g;
}

export function bag(color, w = 0.3, h = 0.32) {
  const g = G();
  add(g, cbox(cm(color, 0.8), w, h, 0.12, 0, 0, 0));
  return g;
}

export function counterKitchen({ len = 2.7 } = {}) {
  // Runs along local X; front faces +Z. Sink near -X end, stove near +X end.
  const g = G(), carc = M.cabinetCream, top = M.steel;
  add(g, cbox(M.black, len, 0.08, 0.5, 0, 0, -0.02));
  add(g, cbox(carc, len, 0.76, 0.56, 0, 0.08, -0.02));
  add(g, cbox(top, len + 0.02, 0.04, 0.62, 0, 0.84, 0));
  const doors = Math.round(len / 0.45);
  for (let i = 0; i < doors; i++) {
    const x = -len / 2 + (i + 0.5) * len / doors;
    add(g, cbox(carc, len / doors - 0.01, 0.7, 0.02, x, 0.11, 0.27));
    add(g, cbox(M.gold, 0.1, 0.015, 0.02, x, 0.74, 0.29));
  }
  // sink
  add(g, cbox(cm('#7d8084', 0.2, 0.9), 0.7, 0.01, 0.42, -len / 2 + 0.85, 0.876, 0.02));
  add(g, cyl(M.chrome, 0.015, 0.015, 0.25, -len / 2 + 0.85, 0.88, -0.24), cbox(M.chrome, 0.02, 0.02, 0.15, -len / 2 + 0.85, 1.12, -0.18));
  // stove
  add(g, cbox(cm('#f4f4f1', 0.2), 0.62, 0.02, 0.42, len / 2 - 0.45, 0.88, 0.02));
  for (const dx of [-0.15, 0.15]) add(g, cyl(M.black, 0.08, 0.08, 0.02, len / 2 - 0.45 + dx, 0.9, 0.02, 16));
  add(g, cyl(M.steel, 0.12, 0.11, 0.13, len / 2 - 0.6, 0.92, 0.02));
  // upper cabinets
  add(g, cbox(carc, len, 0.7, 0.34, 0, 1.55, -0.14));
  for (let i = 0; i < doors; i++) {
    const x = -len / 2 + (i + 0.5) * len / doors;
    add(g, cbox(i === 0 ? M.glassFrost : carc, len / doors - 0.01, 0.66, 0.02, x, 1.57, 0.035));
    add(g, cbox(M.gold, 0.1, 0.015, 0.02, x, 1.6, 0.05));
  }
  // range hood
  add(g, cbox(M.steel, 0.75, 0.14, 0.5, len / 2 - 0.45, 1.42, -0.06));
  // dish rack + cutting board on backsplash
  add(g, cbox(M.steel, 0.7, 0.02, 0.18, -len / 2 + 1.0, 1.25, -0.18));
  add(g, sph(M.steel, 0.1, -len / 2 + 0.8, 1.32, -0.15, 1, 1, 0.3));
  add(g, cbox(M.pine, 0.32, 0.25, 0.02, -len / 2 + 1.5, 0.92, -0.25));
  add(g, cbox(cm('#e98fb3', 0.7), 0.12, 0.15, 0.03, -len / 2 + 0.55, 1.05, -0.26));
  return g;
}

export function barCounter(len = 2.4) {
  // The curved-end divider counter + hanging glass display cabinet. Runs along local Z.
  const g = G();
  add(g, cbox(cm('#efe9d9', 0.45), 0.5, 1.0, len, 0, 0, 0));
  add(g, cyl(cm('#efe9d9', 0.45), 0.25, 0.25, 1.0, 0, 0, len / 2, 24));
  add(g, cbox(M.graniteDark, 0.56, 0.04, len, 0, 1.0, 0));
  add(g, cyl(M.graniteDark, 0.28, 0.28, 0.04, 0, 1.0, len / 2, 24));
  for (let i = 0; i < 5; i++) add(g, cbox(cm('#e6dfcc', 0.5), 0.01, 0.9, 0.006, 0.255, 0.05, -len / 2 + i * len / 5 + 0.02).rotateY(Math.PI / 2));
  add(g, cbox(cm('#8a8a86', 0.6), 0.5, 0.08, len, 0, 0, 0));
  // hanging cabinet
  const y0 = 2.0;
  add(g, cbox(M.black, 0.6, 0.05, len + 0.1, 0, y0, -0.05));
  add(g, cyl(M.black, 0.3, 0.3, 0.05, 0, y0, len / 2, 24));
  add(g, cbox(M.glass, 0.52, 0.5, len, 0, y0 + 0.05, -0.05));
  add(g, cyl(cm('#f3efe4', 0.4), 0.28, 0.28, 0.5, 0, y0 + 0.05, len / 2, 24, 1));
  add(g, cbox(M.black, 0.6, 0.06, len + 0.1, 0, y0 + 0.55, -0.05));
  add(g, cyl(M.black, 0.3, 0.3, 0.06, 0, y0 + 0.55, len / 2, 24));
  add(g, cbox(M.white, 0.5, 0.02, len - 0.1, 0, y0 + 0.3, -0.05));
  // little figurines / ornaments inside
  for (let i = 0; i < 12; i++) add(g, sph(cm(['#e0b48a', '#f5f0e6', '#c97b53', '#a77245'][i % 4], 0.6), 0.04 + (i % 3) * 0.015, (i % 2 ? 0.1 : -0.1), y0 + 0.36, -len / 2 + 0.15 + i * (len / 12)));
  // boxes on top (as in the photo)
  add(g, cbox(cm('#c79a62', 0.9), 0.4, 0.16, 0.45, 0, y0 + 0.61, 0.4), cbox(cm('#2a2a2a', 0.8), 0.5, 0.15, 0.7, 0, y0 + 0.61, -0.5));
  // items on the counter top
  add(g, cyl(M.steel, 0.15, 0.1, 0.1, 0.0, 1.04, 0.6));
  add(g, cbox(M.pine, 0.3, 0.2, 0.25, 0, 1.04, -0.1));
  add(g, cbox(cm('#df3f7f', 0.6), 0.2, 0.06, 0.3, 0, 1.04, -0.6));
  return g;
}

export function frame(tex, w, h, border = 0.035, frameColor = '#4a2a1c') {
  const g = G();
  add(g, cbox(cm(frameColor, 0.5), w, h, 0.03, 0, -h / 2, 0));
  const p = plane(pictureMat(tex, 0.55), w - border * 2, h - border * 2, 0, 0, 0.017);
  g.add(p);
  return g;
}

export function clock(tex, r = 0.17) {
  const g = G();
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 }));
  m.position.z = 0.012; g.add(m);
  return g;
}

export function intercom() {
  const g = G();
  add(g, cbox(cm('#efe9d6', 0.5), 0.16, 0.22, 0.04, 0, 0, 0));
  add(g, cbox(M.black, 0.09, 0.07, 0.01, 0.0, 0.11, 0.022));
  return g;
}

export function avatar() {
  const g = G();
  const shirt = cm('#1f2733', 0.8), skin = cm('#e8c4a0', 0.7), pants = cm('#4b5563', 0.8);
  const body = cbox(shirt, 0.38, 0.55, 0.22, 0, 0.85, 0); g.add(body);
  const head = sph(skin, 0.13, 0, 1.58, 0); g.add(head);
  const hair = sph(cm('#1a1a1a', 0.9), 0.135, 0, 1.63, -0.01, 1, 0.75, 1); g.add(hair);
  const legL = cbox(pants, 0.14, 0.85, 0.16, -0.1, 0, 0), legR = cbox(pants, 0.14, 0.85, 0.16, 0.1, 0, 0);
  const armL = cbox(shirt, 0.1, 0.55, 0.12, -0.25, 0.85, 0), armR = cbox(shirt, 0.1, 0.55, 0.12, 0.25, 0.85, 0);
  [legL, legR, armL, armR].forEach((p) => {
    const pivot = new THREE.Group();
    const top = p.position.y + p.scale.y / 2;
    pivot.position.set(p.position.x, top, 0);
    p.position.set(0, -p.scale.y / 2, 0);
    pivot.add(p); g.add(pivot);
  });
  g.userData.limbs = g.children.slice(-4);
  return g;
}
