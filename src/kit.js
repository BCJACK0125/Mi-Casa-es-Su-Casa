// Building kit: shared materials, primitive helpers, walls with openings,
// colliders and a static-geometry merger (one draw call per material).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from './tex.js';

export const H = 2.8;          // apartment ceiling height
export const colliders = [];   // {x0,x1,z0,z1,y0,y1}
export const interactives = []; // meshes with userData.onUse / userData.prompt

// ---------------------------------------------------------------- materials
const std = (o) => new THREE.MeshStandardMaterial(o);
export const M = {};
export function initMaterials(loader) {
  const worldUV = (m) => { m.userData.worldUV = true; return m; };
  const tl = (f) => loader.load(f, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });

  M.floor60 = worldUV(std({ map: T.tiles({ tileW: 0.6, base: '#e4dfd5', grout: '#bdb6a9', gw: 3 }), roughness: 0.28, metalness: 0 }));
  M.floorGrey = worldUV(std({ map: T.tiles({ tileW: 0.2, nx: 6, ny: 6, base: '#d6d6d3', grout: '#8d8d8a', gw: 3, vary: 0.05 }), roughness: 0.45 }));
  M.floorBath = worldUV(std({ map: T.tiles({ tileW: 0.3, nx: 4, ny: 4, base: '#e3e2dd', grout: '#a19e96', gw: 3 }), roughness: 0.35 }));
  M.floorBalc = worldUV(std({ map: T.tiles({ tileW: 0.3, nx: 4, ny: 4, base: '#f1f1ee', grout: '#a7a7a2', gw: 3 }), roughness: 0.4 }));
  M.wood = worldUV(std({ map: T.wood(), roughness: 0.5 }));
  M.terrazzo = worldUV(std({ map: T.stone({ base: '#b8ad9c', colors: ['#e9e2d6', '#7b6f61', '#d4c6b0', '#5e554c', '#efe9df'], n: 14000, meters: 0.8 }), roughness: 0.4 }));
  M.paint = worldUV(std({ map: T.paint({ base: '#ece8df' }), roughness: 0.92 }));
  M.paintWarm = worldUV(std({ map: T.paint({ base: '#efe9dc' }), roughness: 0.92 }));
  M.ceiling = worldUV(std({ map: T.paint({ base: '#f6f5f1', amt: 0.01 }), roughness: 0.95 }));
  M.pvc = worldUV(std({ map: T.strips({ n: 6, meters: 0.9 }), roughness: 0.6 }));
  M.wallTile = worldUV(std({ map: T.tiles({ tileW: 0.2, tileH: 0.3, nx: 5, ny: 4, base: '#f5f4f0', grout: '#b9b7b0', gw: 3, vary: 0.02 }), roughness: 0.32 }));
  M.wallTileBeige = worldUV(std({ map: T.tiles({ tileW: 0.2, tileH: 0.25, nx: 5, ny: 4, base: '#d8c39f', grout: '#8f7b58', gw: 3, vary: 0.06 }), roughness: 0.2 }));
  M.balcTile = worldUV(std({ map: T.tiles({ tileW: 0.1, nx: 8, ny: 8, base: '#f6f6f3', grout: '#1d1d1f', gw: 4, vary: 0.02 }), roughness: 0.3 }));
  M.lobbyTile = worldUV(std({ map: T.tiles({ tileW: 0.2, tileH: 0.2, nx: 5, ny: 5, base: '#f4f4f1', grout: '#c9c9c4', gw: 3, vary: 0.02 }), roughness: 0.38 }));
  M.granite = worldUV(std({ map: T.stone({ base: '#8e8e90', colors: ['#f2f2f2', '#2b2b2d', '#5d5d60', '#c7c7c9', '#ffffff'], n: 16000, r0: 0.6, r1: 2.6, meters: 0.6 }), roughness: 0.3 }));
  M.graniteDark = worldUV(std({ map: T.stone({ base: '#242426', colors: ['#5a5650', '#111', '#6d6a64', '#3a3836'], n: 9000, meters: 0.5 }), roughness: 0.25 }));
  M.stairTread = worldUV(std({ map: T.stairTread(), roughness: 0.6 }));
  M.panel = worldUV(std({ map: T.panels({ w: 0.6, h: 0.6 }), roughness: 0.6 }));
  M.foamG = worldUV(std({ map: T.foam('#2eaa63'), roughness: 0.85 }));
  M.foamT = worldUV(std({ map: T.foam('#1aa39b'), roughness: 0.85 }));
  M.steelBrushed = worldUV(std({ map: T.brushed(), metalness: 0.85, roughness: 0.35 }));
  M.ledDots = worldUV(std({ map: T.ledDots(), emissive: '#ffffff', emissiveMap: T.ledDots(), emissiveIntensity: 1.2, roughness: 0.5 }));

  M.base = std({ color: '#5b6169', roughness: 0.6 });
  M.crown = std({ color: '#f6f4ee', roughness: 0.7 });
  M.crownBlue = std({ color: '#9aa4b0', roughness: 0.6 });
  M.frame = std({ color: '#e9dfc4', roughness: 0.55 });     // door casings
  M.cabinet = std({ color: '#f0ece0', roughness: 0.45 });   // built-in wardrobes
  M.cabinetCream = std({ color: '#e6dfcd', roughness: 0.5 });
  M.alu = std({ color: '#6f5f4e', metalness: 0.55, roughness: 0.45 });
  M.aluLight = std({ color: '#b9b6ae', metalness: 0.7, roughness: 0.35 });
  M.steel = std({ color: '#cfd1d3', metalness: 0.9, roughness: 0.25 });
  M.chrome = std({ color: '#ffffff', metalness: 1, roughness: 0.08 });
  M.glass = std({ color: '#a9c3c9', transparent: true, opacity: 0.16, roughness: 0.02, metalness: 0.1, depthWrite: false });
  M.glassFrost = std({ color: '#e6eef0', transparent: true, opacity: 0.75, roughness: 0.4 });
  M.mirror = std({ map: T.mirrorTex(), color: '#ffffff', metalness: 0.2, roughness: 0.12 }); M.mirror.userData.env = 1.2;
  M.darkWood = std({ color: '#3e2418', roughness: 0.45 });
  M.walnut = std({ color: '#5a3322', roughness: 0.5 });
  M.midWood = std({ color: '#93552b', roughness: 0.5 });
  M.honey = std({ color: '#c7934f', roughness: 0.45 });
  M.pine = std({ color: '#d2a86a', roughness: 0.6 });
  M.cherry = std({ color: '#6a2a20', roughness: 0.35 });
  M.white = std({ color: '#f5f5f2', roughness: 0.5 });
  M.porcelain = std({ color: '#f1efe6', roughness: 0.15 });
  M.black = std({ color: '#151515', roughness: 0.4 });
  M.blackGloss = std({ color: '#0b0b0d', roughness: 0.12, metalness: 0.3 });
  M.plastic = std({ color: '#efefea', roughness: 0.35 });
  M.fridge = std({ color: '#c9cbcc', metalness: 0.6, roughness: 0.3 });
  M.teal = std({ color: '#5fa59f', metalness: 0.35, roughness: 0.35 });
  M.maroon = std({ color: '#4b1b2c', roughness: 0.55 });
  M.gold = std({ color: '#c9a85e', metalness: 0.9, roughness: 0.3 });
  M.orangeCeil = std({ color: '#e0592d', roughness: 0.85 });
  M.bulb = std({ color: '#fff8e8', emissive: '#fff1d0', emissiveIntensity: 2.2, roughness: 0.3 });
  M.bulbCool = std({ color: '#ffffff', emissive: '#f4f8ff', emissiveIntensity: 1.8, roughness: 0.3 });
  M.shadow = new THREE.MeshBasicMaterial({ map: T.blob(), transparent: true, depthWrite: false, opacity: 0.8 });

  M.tex = {
    horses: tl('assets/tex/horses.jpg'), scrollL: tl('assets/tex/scroll_l.jpg'), scrollR: tl('assets/tex/scroll_r.jpg'),
    sideArt: tl('assets/tex/sideboard_art.jpg'), fridge: tl('assets/tex/fridge.jpg'),
    curtain: tl('assets/tex/curtain.jpg'), doorPanel: tl('assets/tex/door_panel.jpg'),
  };
  M.tex.curtain.wrapS = M.tex.curtain.wrapT = THREE.RepeatWrapping;
  M.door = std({ map: T.doorTex(), roughness: 0.45 });
  M.doorLouver = std({ map: T.doorTex({ louver: true }), roughness: 0.45 });
  M.frontDoor = std({ map: M.tex.doorPanel, roughness: 0.6 });
  M.narrowLeaf = std({ map: T.narrowLeafTex(), roughness: 0.55 });
  M.gate = std({ map: T.gateTex(), alphaTest: 0.5, metalness: 0.75, roughness: 0.3, side: THREE.DoubleSide });
  M.grille = std({ map: T.grilleTex(), alphaTest: 0.5, metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide });
  M.fishGlass = new THREE.MeshStandardMaterial({ map: T.etchedGlass(), transparent: true, roughness: 0.3, side: THREE.DoubleSide, depthWrite: false });
}

export const pictureMat = (tex, rough = 0.5) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough });
export const colorMat = (() => {
  const cache = new Map();
  return (hex, rough = 0.7, metal = 0) => {
    const k = hex + rough + metal;
    if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal }));
    return cache.get(k);
  };
})();

// ---------------------------------------------------------------- static registry
export class Layer {
  constructor(name) { this.name = name; this.items = []; this.group = new THREE.Group(); this.group.name = name; }
  add(mesh) { mesh.updateMatrixWorld(true); this.items.push(mesh); return mesh; }
  // Merge everything into one mesh per material.
  bake() {
    const byMat = new Map();
    const push = (mat, geo) => { if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(geo); };
    for (const m of this.items) {
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (Array.isArray(m.material)) {
        const groups = g.groups.length ? g.groups : [{ start: 0, count: g.attributes.position.count, materialIndex: 0 }];
        for (const gr of groups) push(m.material[gr.materialIndex], slice(g, gr.start, gr.count));
      } else push(m.material, g);
    }
    for (const [mat, geos] of byMat) {
      if (mat.userData.worldUV) geos.forEach(applyWorldUV);
      geos.forEach((g) => g.clearGroups());
      const merged = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.matrixAutoUpdate = false;
      if (mat.transparent) mesh.renderOrder = 2;
      this.group.add(mesh);
    }
    this.items = [];
    return this.group;
  }
}

function slice(g, start, count) {
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) {
    const a = g.attributes[k]; if (!a) continue;
    out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
  }
  return out;
}

// UVs from world position, projected along the dominant normal axis (meters).
function applyWorldUV(g) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ay >= ax && ay >= az) uv.setXY(i, x, -z);
    else if (ax >= az) uv.setXY(i, n.getX(i) > 0 ? -z : z, y);
    else uv.setXY(i, n.getZ(i) > 0 ? x : -x, y);
  }
  uv.needsUpdate = true;
}

// ---------------------------------------------------------------- primitives
const boxGeoCache = new Map();
function boxGeo() {
  if (!boxGeoCache.has(1)) boxGeoCache.set(1, new THREE.BoxGeometry(1, 1, 1));
  return boxGeoCache.get(1);
}

// Axis-aligned box by min/max extents.
export function box(L, mat, x0, x1, y0, y1, z0, z1, { solid = false, rotY = 0, cx, cz } = {}) {
  const m = new THREE.Mesh(boxGeo(), mat);
  m.scale.set(Math.max(1e-3, x1 - x0), Math.max(1e-3, y1 - y0), Math.max(1e-3, z1 - z0));
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (L) L.add(m);
  if (solid) colliders.push({ x0, x1, z0, z1, y0, y1 });
  return m;
}

// Box by center + size, with optional rotation (used inside furniture groups).
export function cbox(mat, w, h, d, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(boxGeo(), mat);
  m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  return m;
}

export function cyl(mat, rTop, rBot, h, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  return m;
}

export function sph(mat, r, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  return m;
}

export function plane(mat, w, h, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ');
  return m;
}

// Furniture group placed at (x,z) rotated by ry; children added to the static layer.
// `foot` = [w, d] collider footprint in local space (centered) and height.
export function place(L, group, x, z, ry = 0, { solid = null, y = 0, shadow = true } = {}) {
  group.position.set(x, y, z); group.rotation.y = ry;
  group.updateMatrixWorld(true);
  const kids = [];
  group.traverse((o) => { if (o.isMesh) kids.push(o); });
  kids.forEach((k) => L.add(k));
  if (solid) {
    const [w, d, h] = solid;
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    const ex = (w * c + d * s) / 2, ez = (w * s + d * c) / 2;
    colliders.push({ x0: x - ex, x1: x + ex, z0: z - ez, z1: z + ez, y0: y, y1: y + h });
    if (shadow) contactShadow(L, x, z, ex * 2 + 0.2, ez * 2 + 0.2, y);
  }
  return group;
}

export function contactShadow(L, x, z, w, d, y = 0) {
  const m = plane(M.shadow, w, d, x, y + 0.004, z, 0, -Math.PI / 2);
  L.add(m);
}

// ---------------------------------------------------------------- walls
// finish = { mat, base: bool, crown: mat|null, crownH }
export const F = {};
export function initFinishes() {
  F.paint = { mat: M.paint, base: true, crown: M.crown };
  F.paintBlue = { mat: M.paint, base: true, crown: M.crownBlue };
  F.plain = { mat: M.paint, base: true, crown: null };
  F.tile = { mat: M.wallTile, base: false, crown: null };
  F.tileBeige = { mat: M.wallTileBeige, base: false, crown: null };
  F.balc = { mat: M.balcTile, base: false, crown: null };
  F.lobby = { mat: M.lobbyTile, base: false, crown: null };
  F.granite = { mat: M.granite, base: false, crown: null };
  F.panel = { mat: M.panel, base: true, crown: M.crown };
  F.ext = { mat: M.paintWarm, base: false, crown: null };
}

/**
 * Axis-aligned wall. axis 'x' => runs along x at z=at; axis 'z' => runs along z at x=at.
 * neg / pos = finishes on the -normal / +normal faces (-z,+z or -x,+x).
 * openings: [{ c, w, y0=0, y1=2.05, frame: true|false }]
 */
export function wall(L, { axis, at, from, to, t = 0.12, h = H, y = 0, neg = F.paint, pos = F.paint, openings = [], solid = true, edge = null }) {
  const lo = Math.min(from, to), hi = Math.max(from, to);
  const ops = openings.map((o) => ({ y0: 0, y1: 2.05, frame: true, ...o, a: o.c - o.w / 2, b: o.c + o.w / 2 })).sort((p, q) => p.a - q.a);
  const pieces = [];
  let cur = lo;
  for (const o of ops) {
    if (o.a > cur) pieces.push([cur, o.a, 0, h]);
    if (o.y0 > 0) pieces.push([o.a, o.b, 0, o.y0]);
    if (o.y1 < h) pieces.push([o.a, o.b, o.y1, h]);
    cur = o.b;
  }
  if (cur < hi) pieces.push([cur, hi, 0, h]);
  const edgeMat = edge || neg.mat;
  const mats = (axis === 'x')
    ? [edgeMat, edgeMat, edgeMat, edgeMat, pos.mat, neg.mat]   // px nx py ny pz nz
    : [pos.mat, neg.mat, edgeMat, edgeMat, edgeMat, edgeMat];
  for (const [a, b, ya, yb] of pieces) {
    const m = new THREE.Mesh(boxGeo(), mats);
    if (axis === 'x') { m.scale.set(b - a, yb - ya, t); m.position.set((a + b) / 2, y + (ya + yb) / 2, at); }
    else { m.scale.set(t, yb - ya, b - a); m.position.set(at, y + (ya + yb) / 2, (a + b) / 2); }
    L.add(m);
    if (solid && ya < 1.6) {
      if (axis === 'x') colliders.push({ x0: a, x1: b, z0: at - t / 2, z1: at + t / 2, y0: y + ya, y1: y + yb });
      else colliders.push({ x0: at - t / 2, x1: at + t / 2, z0: a, z1: b, y0: y + ya, y1: y + yb });
    }
  }
  // trims per side
  for (const [side, fin] of [[-1, neg], [1, pos]]) {
    const off = at + side * (t / 2);
    // baseboards on solid spans
    if (fin.base) {
      let c2 = lo;
      const spans = [];
      for (const o of ops) { if (o.y0 < 0.1) { if (o.a > c2) spans.push([c2, o.a]); c2 = o.b; } }
      if (c2 < hi) spans.push([c2, hi]);
      for (const [a, b] of spans) trim(L, M.base, axis, off, side, a, b, y, y + 0.08, 0.012);
    }
    if (fin.crown) trim(L, fin.crown, axis, off, side, lo, hi, y + h - 0.09, y + h, 0.05);
    for (const o of ops) if (o.frame && fin !== F.tile && fin !== F.balc && fin !== F.tileBeige) casing(L, axis, off, side, o, y);
  }
  return pieces;
}

function trim(L, mat, axis, off, side, a, b, y0, y1, depth) {
  const d0 = off, d1 = off + side * depth;
  if (axis === 'x') box(L, mat, a, b, y0, y1, Math.min(d0, d1), Math.max(d0, d1));
  else box(L, mat, Math.min(d0, d1), Math.max(d0, d1), y0, y1, a, b);
}

function casing(L, axis, off, side, o, y) {
  const w = 0.065, d = 0.018;
  const d0 = off, d1 = off + side * d;
  const z0 = Math.min(d0, d1), z1 = Math.max(d0, d1);
  const parts = [];
  if (o.y0 < 0.1) {
    parts.push([o.a - w, o.a, o.y0, o.y1 + w], [o.b, o.b + w, o.y0, o.y1 + w], [o.a - w, o.b + w, o.y1, o.y1 + w]);
  } else {
    parts.push([o.a - w, o.a, o.y0 - w, o.y1 + w], [o.b, o.b + w, o.y0 - w, o.y1 + w], [o.a - w, o.b + w, o.y1, o.y1 + w], [o.a - w, o.b + w, o.y0 - w, o.y0]);
  }
  const mat = o.frameMat || M.frame;
  for (const [a, b, ya, yb] of parts) {
    if (axis === 'x') box(L, mat, a, b, y + ya, y + yb, z0, z1);
    else box(L, mat, z0, z1, y + ya, y + yb, a, b);
  }
}

// Floor + ceiling for a rectangular room.
export function slab(L, Lc, rect, floorMat, ceilMat, { fy = 0, ch = H, thick = 0.02 } = {}) {
  const [x0, x1, z0, z1] = rect;
  box(L, floorMat, x0, x1, fy - thick, fy, z0, z1);
  if (ceilMat && Lc) box(Lc, ceilMat, x0, x1, ch, ch + 0.02, z0, z1);
}

// Window: frame + glass (+ optional sliding mullion) inside an opening.
export function windowUnit(L, { axis, at, c, w, y0, y1, t = 0.12, panes = 2, mat = M.alu, glass = M.glass, sill = true }) {
  const a = c - w / 2, b = c + w / 2, f = 0.045;
  const put = (u0, u1, v0, v1, d0, d1, m) => {
    if (axis === 'x') box(L, m, u0, u1, v0, v1, at + d0, at + d1);
    else box(L, m, at + d0, at + d1, v0, v1, u0, u1);
  };
  put(a, b, y0, y0 + f, -0.04, 0.04, mat);
  put(a, b, y1 - f, y1, -0.04, 0.04, mat);
  put(a, a + f, y0, y1, -0.04, 0.04, mat);
  put(b - f, b, y0, y1, -0.04, 0.04, mat);
  for (let i = 1; i < panes; i++) { const u = a + (w * i) / panes; put(u - f / 2, u + f / 2, y0, y1, -0.03, 0.03, mat); }
  put(a + f, b - f, y0 + f, y1 - f, -0.004, 0.004, glass);
  if (sill && y0 > 0.3) put(a - 0.04, b + 0.04, y0 - 0.025, y0, -t / 2 - 0.04, t / 2 + 0.04, M.white);
}
