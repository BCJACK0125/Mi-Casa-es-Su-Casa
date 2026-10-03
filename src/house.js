// The apartment: walls, floors, doors, windows, furniture and lights.
// Coordinates in meters: +x = east, +z = south, y = up. North wall of the bathrooms is z = 0.
import * as THREE from 'three';
import { M, F, H, Layer, wall, slab, box, place, windowUnit, plane, cbox, colliders, interactives, contactShadow, colorMat as cm, pictureMat } from './kit.js';
import * as Fu from './furn.js';
import * as T from './tex.js';
import { Door } from './door.js';

const PI = Math.PI, E = PI / 2, W = -PI / 2, N = PI, S = 0;

export function buildHouse(scene) {
  const L = new Layer('house');      // static, always visible
  const Lc = new Layer('ceilings');  // hidden in overview
  const dyn = new THREE.Group(); dyn.name = 'dynamic';
  const doors = [];
  const lights = [];
  const door = (o) => { const d = new Door(o); doors.push(d); dyn.add(d.group); return d; };
  // Light anchors; a small pool of real PointLights is assigned to the nearest ones each frame.
  const light = (room, x, y, z, { color = '#ffe2b8', intensity = 6, distance = 7 } = {}) => {
    const a = { room, pos: new THREE.Vector3(x, y, z), color: new THREE.Color(color), intensity, distance };
    lights.push(a);
    return a;
  };

  // ------------------------------------------------------------------ floors & ceilings
  slab(L, Lc, [1.3, 3.5, 0, 2.3], M.floorBath, M.pvc, { ch: 2.4 });
  slab(L, Lc, [3.9, 5.95, 0, 2.3], M.floorBath, M.pvc, { ch: 2.4 });
  slab(L, Lc, [1.3, 4.95, 2.3, 6.1], M.floor60, M.ceiling);
  slab(L, Lc, [4.95, 5.95, 2.3, 10.1], M.floor60, M.ceiling, { ch: 2.7 });
  slab(L, Lc, [1.3, 4.95, 6.1, 10.1], M.floor60, M.ceiling);
  slab(L, Lc, [0, 1.3, 6.1, 10.1], M.floorBalc, M.orangeCeil);
  slab(L, Lc, [5.95, 11, 0.6, 3.68], M.floor60, M.ceiling);
  box(L, M.wood, 5.95, 11, 0, 0.06, 3.68, 6.52);
  box(Lc, M.ceiling, 5.95, 11, H, H + 0.02, 3.68, 6.52);
  slab(L, Lc, [5.95, 11, 6.52, 10.7], M.floor60, M.ceiling);
  slab(L, Lc, [0, 3.75, 10.1, 12.5], M.floorGrey, M.wallTile, { ch: 2.5 });
  // fill the step riser at the room-2 doorway
  box(L, M.wood, 5.95, 6.0, 0, 0.06, 3.8, 4.6);

  // ------------------------------------------------------------------ walls
  const ext = 0.2;
  // horizontal (along x)
  wall(L, { axis: 'x', at: 0, from: 1.2, to: 6.05, t: ext, neg: F.ext, pos: F.tile });
  wall(L, { axis: 'x', at: 2.3, from: 1.3, to: 3.5, neg: F.tile, pos: F.paint, openings: [{ c: 3.025, w: 0.75 }] });
  wall(L, { axis: 'x', at: 2.3, from: 3.9, to: 5.95, neg: F.tile, pos: F.paint, openings: [{ c: 5.45, w: 0.78 }] });
  wall(L, { axis: 'x', at: 2.3, from: 3.5, to: 3.9, neg: F.paint, pos: F.paint });
  wall(L, { axis: 'x', at: 6.1, from: -0.1, to: 1.3, t: ext, neg: F.ext, pos: F.balc });
  wall(L, { axis: 'x', at: 6.1, from: 1.3, to: 4.95, neg: F.paint, pos: F.paint });
  wall(L, { axis: 'x', at: 10.1, from: -0.1, to: 1.3, t: ext, neg: F.balc, pos: F.tile });
  wall(L, { axis: 'x', at: 10.1, from: 1.3, to: 3.75, neg: F.paint, pos: F.tile, openings: [{ c: 3.15, w: 0.8 }] });
  wall(L, { axis: 'x', at: 10.1, from: 3.75, to: 5.1, neg: F.paint, pos: F.paint });
  wall(L, { axis: 'x', at: 0.6, from: 5.95, to: 11.1, t: ext, neg: F.ext, pos: F.paintBlue });
  wall(L, { axis: 'x', at: 3.68, from: 5.95, to: 11, neg: F.paintBlue, pos: F.paint });
  wall(L, { axis: 'x', at: 6.52, from: 5.95, to: 11, neg: F.paint, pos: F.paint });
  wall(L, { axis: 'x', at: 12.5, from: -0.1, to: 3.85, t: ext, neg: F.tile, pos: F.ext });
  // vertical (along z)
  wall(L, { axis: 'z', at: 1.3, from: -0.1, to: 2.3, t: ext, neg: F.ext, pos: F.tile, openings: [{ c: 0.85, w: 0.9, y0: 1.35, y1: 2.05, frame: false }] });
  wall(L, { axis: 'z', at: 1.3, from: 2.3, to: 6.1, t: ext, neg: F.ext, pos: F.paint, openings: [{ c: 4.05, w: 0.9, y0: 0.9, y1: 2.2, frame: false }] });
  wall(L, { axis: 'z', at: 1.3, from: 6.1, to: 10.1, t: ext, neg: F.balc, pos: F.paint, openings: [{ c: 8.1, w: 2.2, y0: 0, y1: 2.55, frame: false }] });
  box(L, M.paint, 3.5, 3.9, 0, H, 0, 2.3, { solid: true });                 // pipe shaft between baths
  wall(L, { axis: 'z', at: 3.5, from: 0, to: 2.3, t: 0.02, neg: F.tile, pos: F.paint });
  wall(L, { axis: 'z', at: 3.9, from: 0, to: 2.3, t: 0.02, neg: F.paint, pos: F.tile });
  wall(L, { axis: 'z', at: 4.95, from: 2.3, to: 6.1, neg: F.paint, pos: F.paint, openings: [{ c: 2.875, w: 0.85 }] });
  wall(L, { axis: 'z', at: 5.95, from: 0, to: 2.3, neg: F.tile, pos: F.ext });
  wall(L, { axis: 'z', at: 5.95, from: 2.3, to: 6.52, neg: F.paint, pos: F.paintBlue, openings: [{ c: 3.2, w: 0.8 }, { c: 4.2, w: 0.8 }] });
  wall(L, { axis: 'z', at: 5.95, from: 6.52, to: 10.7, neg: F.panel, pos: F.panel, openings: [
    { c: 7.95, w: 1.8, y0: 0.95, y1: 2.0, frame: true, frameMat: M.black }, { c: 9.6, w: 0.9, y0: 0, y1: 2.15 }] });
  wall(L, { axis: 'z', at: 0, from: 10.0, to: 12.6, t: ext, neg: F.ext, pos: F.tile, openings: [{ c: 11.35, w: 0.8, y0: 1.15, y1: 1.95, frame: false }] });
  wall(L, { axis: 'z', at: 3.75, from: 10.1, to: 12.5, neg: F.tile, pos: F.paint });
  box(L, M.paintWarm, 3.81, 5.1, 0, H, 10.16, 13.4, { solid: true });      // solid core between kitchen and lift shaft
  wall(L, { axis: 'z', at: 11, from: 0.5, to: 10.8, t: ext, neg: F.paint, pos: F.ext, openings: [
    { c: 1.25, w: 0.7, y0: 1.3, y1: 1.9, frame: false }, { c: 2.6, w: 1.5, y0: 0, y1: 2.15, frame: false },
    { c: 5.0, w: 0.85, y0: 1.0, y1: 2.1, frame: false }, { c: 9.3, w: 1.8, y0: 0, y1: 2.15, frame: false }] });
  // balcony parapet + grille + header
  box(L, M.balcTile, -0.1, 0.1, 0, 1.0, 6.1, 10.1, { solid: true });
  box(L, M.balcTile, -0.12, 0.12, 0.98, 1.04, 6.1, 10.1);
  colliders.push({ x0: -0.1, x1: 0.1, z0: 6.1, z1: 10.1, y0: 0, y1: 2.5 });
  box(L, M.balcTile, -0.1, 0.1, 2.45, H, 6.1, 10.1);
  for (let z = 6.1; z < 10.05; z += 0.5) L.add(plane(M.grille, 0.5, 1.42, 0, 1.73, z + 0.25, E));

  // ------------------------------------------------------------------ windows & glazing
  windowUnit(L, { axis: 'z', at: 1.3, c: 0.85, w: 0.9, y0: 1.35, y1: 2.05, glass: M.glassFrost });
  windowUnit(L, { axis: 'z', at: 1.3, c: 4.05, w: 0.9, y0: 0.9, y1: 2.2 });
  windowUnit(L, { axis: 'z', at: 1.3, c: 8.1, w: 2.2, y0: 0, y1: 2.15 });
  windowUnit(L, { axis: 'z', at: 1.3, c: 8.1, w: 2.2, y0: 2.15, y1: 2.55, panes: 3, sill: false });
  windowUnit(L, { axis: 'z', at: 0, c: 11.35, w: 0.8, y0: 1.15, y1: 1.95 });
  windowUnit(L, { axis: 'z', at: 11, c: 1.25, w: 0.7, y0: 1.3, y1: 1.9, glass: M.glassFrost });
  windowUnit(L, { axis: 'z', at: 11, c: 2.6, w: 1.5, y0: 0, y1: 2.15 });
  windowUnit(L, { axis: 'z', at: 11, c: 5.0, w: 0.85, y0: 1.0, y1: 2.1 });
  windowUnit(L, { axis: 'z', at: 11, c: 9.3, w: 1.8, y0: 0, y1: 2.15 });
  // glazing collisions (sliding doors are closed)
  colliders.push({ x0: 1.25, x1: 1.35, z0: 7.0, z1: 9.2, y0: 0, y1: 2.5 });
  // etched koi glass between hallway and living room
  L.add(plane(M.fishGlass, 1.8, 1.05, 5.95, 1.475, 7.95, E));

  // ------------------------------------------------------------------ doors
  door({ hinge: [3.4, 2.3], dir: [-1, 0], swing: [0, -1], width: 0.75, mat: M.doorLouver, open: true, name: '浴室門' });
  door({ hinge: [5.84, 2.3], dir: [-1, 0], swing: [0, -1], width: 0.78, mat: M.doorLouver, open: true, name: '浴室門' });
  door({ hinge: [4.95, 2.45], dir: [0, 1], swing: [-1, 0], width: 0.85, mat: M.door, open: true, name: '主臥室門' });
  door({ hinge: [5.95, 3.6], dir: [0, -1], swing: [1, 0], width: 0.8, mat: M.door, open: true, name: '房間一門' });
  door({ hinge: [5.95, 3.8], dir: [0, 1], swing: [1, 0], width: 0.8, mat: M.door, open: true, name: '房間二門' });
  door({ hinge: [3.55, 10.1], dir: [-1, 0], swing: [0, 1], width: 0.8, mat: M.door, open: true, name: '廚房門' });

  // ------------------------------------------------------------------ BATHROOMS
  // Both share the same layout (west face wx, east face ex): tub along the west wall,
  // pedestal sink + mirror on the north wall, toilet in the NE corner, shelf above it.
  // The hallway one has no window.
  const bathroom = (id, wx, ex) => {
    place(L, Fu.bathtub({ l: 1.55, w: 0.72 }), wx + 0.36, 0.875, 0, { solid: [0.72, 1.55, 0.55], shadow: false });
    box(L, M.wallTile, wx, wx + 0.72, 0, 0.55, 1.65, 2.24, { solid: true });
    place(L, Fu.basket('#f2c81f'), wx + 0.25, 1.95, 0, { y: 0.55 });
    const sx = (wx + 0.72 + ex - 0.6) / 2;
    place(L, Fu.pedestalSink(), sx, 0.32, S, { solid: [0.5, 0.4, 0.86] });
    box(L, M.white, sx - 0.3, sx + 0.3, 1.5, 2.05, 0.1, 0.12);
    L.add(plane(M.mirror, 0.42, 0.45, sx - 0.05, 1.78, 0.125));
    box(L, M.black, sx - 0.3, sx + 0.3, 1.22, 1.25, 0.1, 0.22);
    place(L, Fu.toilet(), ex - 0.38, 0.45, S, { solid: [0.45, 0.65, 0.8] });
    box(L, M.pine, ex - 0.24, ex, 1.85, 1.88, 0.5, 1.2);
    place(L, Fu.bag('#3a6ea5', 0.08, 0.25), ex - 0.12, 0.7, E, { y: 1.88 });
    place(L, Fu.bag('#efe6d0', 0.3, 0.12), ex - 0.12, 1.0, E, { y: 1.88 });
    box(L, M.chrome, wx + 0.1, wx + 0.6, 1.35, 1.37, 2.2, 2.23);
    box(L, M.white, wx + 0.2, wx + 0.5, 0.9, 1.35, 2.2, 2.215);
    const cx = (wx + ex) / 2;
    place(L, Fu.domeLight(0.13), cx, 1.1, 0, { y: 2.4 });
    light(id, cx, 2.15, 1.1, { color: '#fff3dc', intensity: 3.2, distance: 4 });
  };
  bathroom('mbath', 1.4, 3.5);
  bathroom('bath2', 3.91, 5.89);

  // ------------------------------------------------------------------ MASTER BEDROOM
  place(L, Fu.bed({ w: 1.5, l: 2.0, frame: M.honey, sheet: '#7387b4' }), 2.6, 5.25, E, { solid: [1.7, 2.3, 0.5] });
  place(L, Fu.nightstand(), 1.63, 4.22, E, { solid: [0.45, 0.42, 0.62] });
  place(L, Fu.desk({ w: 1.0, d: 0.55, top: cm('#3fae4a', 0.4), leg: cm('#d33b2e', 0.4) }), 1.69, 3.05, E, { solid: [1.0, 0.55, 0.74] });
  place(L, Fu.openShelf({ w: 0.6, h: 0.85, d: 0.28, seed: 4 }), 1.56, 2.72, E, { y: 0.74 });
  place(L, Fu.officeChair(), 2.25, 3.1, W, { solid: [0.5, 0.5, 0.9] });
  place(L, Fu.trashCan('#2c6f6a'), 2.2, 2.6, 0, { solid: [0.3, 0.3, 0.3] });
  place(L, Fu.wardrobe({ w: 2.6, h: 2.62, d: 0.6, doors: 4, shelfEnd: 0.3, clothes: ['#e8cfc0', '#1d2a4a', '#e2a888', '#8aa0c4', '#e7b3c4', '#d9cfc6'] }), 4.59, 4.7, W, { solid: [2.6, 0.6, 2.6] });
  place(L, Fu.standFan(), 3.6, 4.0, PI * 0.8, { solid: [0.35, 0.35, 1.2] });
  { const a = Fu.acUnit(); place(L, a, 1.47, 5.0, E, { y: 1.75 }); }
  curtainOn(L, 'z', 1.3, 3.95, 0.75, 2.38, 1.55, 1, M.tex.curtain, 1.4);
  place(L, Fu.flowerChandelier(), 3.1, 4.2, 0, { y: H });
  light('master', 3.1, 2.45, 4.2, { intensity: 5.5, distance: 7 });

  // ------------------------------------------------------------------ HALLWAY
  place(L, Fu.domeLight(0.16), 5.45, 3.6, 0, { y: 2.7 });
  place(L, Fu.domeLight(0.16), 5.45, 7.6, 0, { y: 2.7 });
  light('hall', 5.45, 2.45, 3.6, { intensity: 3.5, distance: 5 });
  light('hall', 5.45, 2.45, 7.6, { intensity: 3.5, distance: 5 });
  place(L, Fu.sideboard(), 5.3, 9.81, N, { solid: [1.2, 0.46, 0.9] });
  { const f = Fu.frame(M.tex.sideArt, 0.42, 0.55, 0.04, '#7a5a2a'); place(L, f, 5.3, 10.02, N, { y: 1.62 }); }
  place(L, Fu.fridge(), 4.15, 9.68, N, { solid: [0.7, 0.7, 1.8] });
  // blue curtain at living-room opening
  curtainOn(L, 'z', 5.95, 9.33, 0.36, 2.15, 2.1, 1, colorMat('#3e5f9e', 0.9), 1, 0.07);

  // ------------------------------------------------------------------ DINING
  place(L, Fu.diningTable(), 2.9, 8.3, 0, { solid: [0.95, 1.5, 0.78] });
  place(L, Fu.slatChair(), 3.55, 8.35, W, { solid: [0.45, 0.45, 0.5] });
  place(L, Fu.slatChair(), 2.25, 8.25, E, { solid: [0.45, 0.45, 0.5] });
  place(L, Fu.slatChair(), 2.9, 7.32, S, { solid: [0.45, 0.45, 0.5] });
  place(L, Fu.slatChair({ seat: '#c9b585' }), 2.9, 9.28, N, { solid: [0.45, 0.45, 0.5] });
  place(L, Fu.pendant3(), 2.9, 8.3, 0);
  place(L, Fu.barCounter(2.0), 4.67, 7.2, 0, { solid: [0.56, 2.0, 1.05], shadow: false });
  colliders.push({ x0: 4.42, x1: 4.92, z0: 8.2, z1: 8.47, y0: 0, y1: 1.0 });
  box(L, M.white, 1.85, 2.3, 0, 0.75, 6.16, 6.5, { solid: true });
  box(L, cm('#9aa0a6', 0.4, 0.3), 1.88, 2.27, 0.75, 0.95, 6.2, 6.45);
  place(L, Fu.clock(T.clockFace(), 0.15), 2.1, 6.165, S, { y: 1.5 });
  place(L, Fu.standFan(), 1.75, 9.6, PI * 0.25, { solid: [0.35, 0.35, 1.2] });
  place(L, Fu.basket('#e8955a'), 2.45, 6.35, 0);
  valanceOn(L, 'z', 1.3, 8.1, 2.4, 2.6, 1);
  light('dining', 2.9, 1.7, 8.3, { intensity: 5, distance: 7 });

  // ------------------------------------------------------------------ BALCONY
  place(L, Fu.washer(), 0.68, 6.5, S, { solid: [0.58, 0.58, 1.0] });
  place(L, Fu.waterHeater(), 0.75, 9.96, N, { y: 1.55 });
  place(L, Fu.washbasinShelf(), 0.32, 9.82, N, { solid: [0.4, 0.3, 1.0] });
  place(L, Fu.openShelf({ w: 0.4, h: 0.75, d: 0.3, mat: cm('#e3cf8c', 0.6), levels: 2 }), 0.85, 9.82, N, { solid: [0.4, 0.3, 0.75] });
  place(L, Fu.storageBin('#f3f3ef'), 0.95, 8.75, E, { solid: [0.55, 0.4, 0.4] });
  place(L, Fu.storageBin('#a9c6e3'), 0.95, 9.2, E, { solid: [0.55, 0.4, 0.4] });
  place(L, Fu.plasticStool('#58b36a'), 0.3, 8.9, 0, { solid: [0.3, 0.3, 0.45] });
  place(L, Fu.clothesLine(3.8, ['#d7d0f0', '#ffffff', '#1d2533', '#ad7fd6', '#e9e1d9', '#2c3e6b', '#8a8f99', '#f2f2f2']), 0.35, 8.1, 0, { y: 2.38 });
  place(L, Fu.clothesLine(3.8, ['#1a1a1a', '#c94f4f', '#e8e8e8', '#5b6c8f', '#f0e6d8', '#222']), 0.9, 8.1, 0, { y: 2.38 });
  place(L, Fu.domeLight(0.15, M.bulb), 0.65, 8.1, 0, { y: H });
  light('balcony', 0.65, 2.5, 8.1, { color: '#ffd9a8', intensity: 3, distance: 5 });

  // ------------------------------------------------------------------ ROOM 1
  place(L, Fu.wardrobe({ w: 1.95, h: 2.5, d: 0.6, doors: 4, clothes: ['#1d2340', '#2b2b2b', '#3b4a5c', '#8fb0d8', '#1f2f6b', '#222'] }), 6.31, 1.675, E, { solid: [1.95, 0.6, 2.5] });
  place(L, Fu.piano(), 7.4, 0.93, S, { solid: [1.4, 0.46, 1.0] });
  box(L, M.pine, 6.95, 7.85, 1.72, 1.75, 0.7, 0.92);
  place(L, Fu.bag('#1b2236', 0.16, 0.2), 7.15, 0.82, 0, { y: 1.45 });
  place(L, Fu.bag('#1b2236', 0.16, 0.2), 7.65, 0.82, 0, { y: 1.45 });
  place(L, Fu.bag('#151515', 0.4, 0.15), 7.5, 0.95, 0, { y: 1.0 });
  place(L, Fu.bed({ w: 1.15, l: 2.0, frame: M.white, sheet: '#8e8f9b', headboard: false, platform: 0.26, h: 0.5 }), 9.35, 1.32, E, { solid: [1.25, 2.1, 0.5] });
  place(L, Fu.desk({ w: 1.0, d: 0.55, drawers: true }), 10.35, 3.33, N, { solid: [1.0, 0.55, 0.75] });
  place(L, Fu.slatChair({ wood: M.white, seat: '#f0f0f0' }), 10.3, 2.78, S, { solid: [0.45, 0.45, 0.5] });
  place(L, Fu.bookcase({ w: 0.9, mat: M.midWood, lower: 0.6, seed: 11 }), 8.33, 3.45, N, { solid: [0.9, 0.34, 1.85] });
  place(L, Fu.bookcase({ w: 0.9, mat: M.darkWood, seed: 12 }), 9.25, 3.45, N, { solid: [0.9, 0.34, 1.85] });
  place(L, Fu.clock(T.clockFace(), 0.13), 9.05, 3.27, N, { y: 1.6 });
  place(L, Fu.wireRack({ w: 0.45, d: 0.35, h: 0.85, levels: 3 }), 7.6, 3.42, N, { solid: [0.45, 0.35, 0.85] });
  place(L, Fu.basket('#f06fa0'), 7.1, 3.4, 0, { y: 0.45 });
  place(L, Fu.standFan(), 9.75, 2.55, PI * 0.9, { solid: [0.35, 0.35, 1.2] });
  box(L, M.foamG, 7.4, 9.6, 0, 0.012, 1.95, 2.85);
  box(L, M.foamT, 7.8, 9.9, 0, 0.013, 2.85, 3.25);
  box(Lc, M.paintWarm, 5.95, 11, 2.5, H, 0.7, 0.98);
  curtainOn(L, 'z', 11, 1.7, 0.4, 2.3, 2.25, -1, colorMat('#8fb04a', 0.85), 1, 0.08);
  curtainOn(L, 'z', 11, 3.48, 0.4, 2.3, 2.25, -1, colorMat('#8fb04a', 0.85), 1, 0.08);
  valanceOn(L, 'z', 11, 2.6, 2.25, 2.48, -1);
  place(L, Fu.flowerChandelier(), 8.45, 2.15, 0, { y: H });
  light('room1', 8.45, 2.45, 2.15, { intensity: 5.5, distance: 7 });

  // ------------------------------------------------------------------ ROOM 2 (raised wood floor)
  const r2 = 0.06;
  place(L, Fu.wardrobe({ w: 1.76, h: 2.4, d: 0.6, doors: 4, clothes: ['#203a5c', '#c8b48a', '#4a6fa5', '#2a2a2a'] }), 6.31, 5.58, E, { solid: [1.76, 0.6, 2.4], y: r2 });
  place(L, Fu.desk({ w: 2.3, d: 0.6, drawers: true }), 10.6, 5.0, W, { solid: [2.3, 0.6, 0.76], y: r2 });
  place(L, Fu.openShelf({ w: 0.55, h: 0.95, d: 0.3, mat: M.white, levels: 3, seed: 21 }), 10.75, 5.95, W, { y: 1.12 });
  place(L, Fu.slatChair(), 10.0, 5.05, E, { solid: [0.45, 0.45, 0.5], y: r2 });
  place(L, Fu.mattress({ w: 0.95, l: 1.9 }), 8.25, 5.98, W, { solid: [0.95, 1.9, 0.26], y: r2 });
  place(L, Fu.plasticDrawers(), 6.95, 6.2, N, { solid: [0.5, 0.4, 0.8], y: r2 });
  place(L, Fu.openShelf({ w: 0.8, h: 0.85, d: 0.3, seed: 22 }), 8.4, 3.9, S, { solid: [0.8, 0.3, 0.85], y: r2 });
  place(L, Fu.bag('#f5d000', 0.28, 0.32), 8.2, 3.9, 0, { y: r2 + 0.85 });
  place(L, Fu.bag('#c79f6a', 0.25, 0.4), 8.5, 3.9, 0, { y: r2 + 0.85 });
  place(L, Fu.cardboard(), 7.6, 3.95, 0, { solid: [0.45, 0.35, 0.5], y: r2 });
  place(L, Fu.basket('#e0623a'), 7.6, 3.95, 0, { y: r2 + 0.32 });
  place(L, Fu.cardboard(0.7, 1.0, 0.08), 9.55, 3.84, 0.2, { solid: [0.7, 0.2, 1.0], y: r2 });
  place(L, Fu.standFan(), 9.1, 4.7, PI * 1.2, { solid: [0.35, 0.35, 1.2], y: r2 });
  { const a = Fu.acUnit(); place(L, a, 10.84, 4.15, W, { y: 1.75 }); }
  curtainOn(L, 'z', 11, 4.7, 0.3, 2.2, 1.25, -1, M.tex.curtain, 0.4);
  valanceOn(L, 'z', 11, 5.0, 2.15, 2.35, -1, 1.2);
  box(Lc, M.paintWarm, 5.95, 11, 2.5, H, 6.15, 6.46);
  place(L, Fu.domeLight(0.2, M.bulbCool), 8.45, 5.1, 0, { y: H });
  light('room2', 8.45, 2.45, 5.1, { color: '#f4f6ff', intensity: 5.5, distance: 7 });

  // ------------------------------------------------------------------ LIVING ROOM
  place(L, Fu.tvSet(), 9.05, 10.38, N, { solid: [2.0, 0.5, 0.55] });
  place(L, Fu.tallCabinet(), 10.45, 10.38, N, { solid: [0.62, 0.42, 1.6] });
  place(L, Fu.clock(T.numberClock(), 0.17), 7.75, 10.62, N, { y: 2.32 });
  place(L, Fu.intercom(), 8.2, 10.6, N, { y: 1.42 });
  box(L, M.white, 8.5, 8.85, 1.75, 2.2, 10.6, 10.625);
  box(L, M.foamG, 8.4, 10.2, 0, 0.012, 9.1, 10.1);
  box(L, M.white, 10.2, 10.6, 0, 0.3, 9.1, 9.5, { solid: true });
  box(L, M.white, 10.3, 10.62, 0, 0.3, 9.55, 9.85, { solid: true });
  { const f = Fu.frame(M.tex.horses, 1.5, 0.72, 0.04, '#5a2c1a'); place(L, f, 8.35, 6.6, S, { y: 1.72 }); }
  { const f = Fu.frame(M.tex.scrollL, 0.3, 0.72, 0.03, '#5a2c1a'); place(L, f, 7.15, 6.6, S, { y: 1.68 }); }
  { const f = Fu.frame(M.tex.scrollR, 0.3, 0.72, 0.03, '#5a2c1a'); place(L, f, 9.5, 6.6, S, { y: 1.68 }); }
  place(L, Fu.loungeChair(), 6.6, 7.2, PI * 0.62, { solid: [0.7, 0.9, 0.9] });
  place(L, Fu.coveredChair(), 7.95, 7.05, S, { solid: [0.85, 0.8, 0.9] });
  place(L, Fu.desk({ w: 1.15, d: 0.55 }), 9.95, 6.88, S, { solid: [1.15, 0.55, 0.75] });
  place(L, Fu.bag('#1a1a1a', 0.45, 0.32), 10.2, 6.75, 0, { y: 0.74 });
  place(L, Fu.slatChair(), 10.05, 7.45, N, { solid: [0.45, 0.45, 0.5] });
  box(L, M.white, 8.95, 9.4, 0, 0.6, 6.62, 7.0, { solid: true });
  box(L, cm('#c62a2a', 0.4), 9.05, 9.25, 0.6, 0.68, 6.7, 6.85);
  place(L, Fu.coffeeTable(), 7.3, 8.05, 0, { solid: [1.17, 0.6, 0.45] });
  place(L, Fu.plasticStool('#f1b4b4'), 7.9, 8.75, 0, { solid: [0.3, 0.3, 0.3] });
  place(L, Fu.standFan(), 8.0, 9.55, PI, { solid: [0.35, 0.35, 1.2] });
  place(L, Fu.trashCan('#36a86a'), 6.35, 8.6, 0, { solid: [0.3, 0.3, 0.3] });
  { const a = Fu.acUnit(); place(L, a, 10.84, 7.35, W, { y: 1.75 }); }
  valanceOn(L, 'z', 11, 9.3, 2.25, 2.47, -1, 2.2);
  box(Lc, M.paintWarm, 5.95, 11, 2.45, H, 10.2, 10.63);
  box(Lc, M.paintWarm, 6.01, 6.35, 2.5, H, 6.58, 10.2);
  place(L, Fu.flowerChandelier(), 8.45, 8.5, 0, { y: H });
  light('living', 8.45, 2.4, 8.5, { intensity: 7, distance: 8 });
  // slippers by the door
  for (const [x, z] of [[7.0, 10.1], [7.15, 10.05], [8.05, 9.95]]) box(L, cm('#e9a99a', 0.6), x, x + 0.1, 0, 0.03, z, z + 0.26);

  // ------------------------------------------------------------------ KITCHEN (east-west galley)
  // Door at the east end of the north wall; counter along the south wall with the stove
  // and hood towards the west window; wire rack, rice cooker and apron on the north wall.
  place(L, Fu.counterKitchen({ len: 2.75 }), 1.5, 12.09, N, { solid: [2.75, 0.62, 0.9] });
  place(L, Fu.wireRack({ w: 0.9, d: 0.45, h: 1.6 }), 0.62, 10.39, S, { solid: [0.9, 0.45, 1.6] });
  place(L, Fu.wireRack({ w: 0.5, d: 0.4, h: 0.55, levels: 2 }), 1.45, 10.37, S, { solid: [0.5, 0.4, 0.55] });
  place(L, Fu.riceCooker(), 1.45, 10.37, S, { y: 0.56 });
  box(L, cm('#6a2c8f', 0.8), 2.15, 2.55, 0.75, 1.55, 10.16, 10.18);
  box(L, cm('#e5c23c', 0.6), 2.2, 2.5, 1.1, 1.3, 10.18, 10.185);
  place(L, Fu.stool(), 3.45, 11.55, 0, { solid: [0.3, 0.3, 0.45] });
  place(L, Fu.domeLight(0.14, M.bulbCool), 1.9, 11.3, 0, { y: 2.5 });
  light('kitchen', 1.9, 2.25, 11.3, { color: '#f4f6ff', intensity: 4, distance: 5 });

  // outside the windows
  scene.add(L.bake());
  scene.add(Lc.bake());
  scene.add(dyn);
  return { ceilings: Lc.group, houseGroup: L.group, dyn, doors, lights };
}

const colorMat = (hex, r = 0.85) => new THREE.MeshStandardMaterial({ color: hex, roughness: r, side: THREE.DoubleSide });

// Curtain hanging on a wall: axis 'z' wall at x=at, centered at c (along wall), width w;
// top y, length h; side = which side of the wall it hangs on (+1 / -1).
function curtainOn(L, axis, at, c, w, top, h, side, mat, repeat = 1, off = 0.1) {
  let material = mat;
  if (!material || material.isTexture) {
    const t = M.tex.curtain.clone(); t.repeat.set(repeat * 2, 2);
    material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide });
  }
  const g = Fu.curtain(material, w, h, Math.max(3, Math.round(w * 10)));
  if (axis === 'z') { g.position.set(at + side * off, top, c); g.rotation.y = E; }
  else { g.position.set(c, top, at + side * off); }
  g.updateMatrixWorld(true);
  g.traverse((o) => o.isMesh && L.add(o));
}

function valanceOn(L, axis, at, c, y0, y1, side, w = 1.6) {
  if (axis === 'z') box(L, M.white, Math.min(at, at + side * 0.18), Math.max(at, at + side * 0.18), y0, y1, c - w / 2, c + w / 2);
  else box(L, M.white, c - w / 2, c + w / 2, y0, y1, Math.min(at, at + side * 0.18), Math.max(at, at + side * 0.18));
}
