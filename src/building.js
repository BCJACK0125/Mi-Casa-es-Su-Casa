// Elevator lobby + switch-back stairwell module. The module is stacked (copies at
// y = 3k) so the stairs look endless; the player is wrapped back to copy 0, which is
// the only one with a real front door — every floor is home.
import * as THREE from 'three';
import { M, F, Layer, wall, box, place, windowUnit, colliders, interactives, cbox, cyl, plane, colorMat as cm } from './kit.js';
import * as Fu from './furn.js';
import * as T from './tex.js';
import { Door } from './door.js';

export const FLOOR_H = 3.0;
export const FLOORS = ['B1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
export const HOME_FLOOR = 8;           // index into FLOORS -> '8'
export const STAIR = { x0: 8.3, x1: 11.7, xl: 10.6, z0: 10.775, z1: 13.3, zm: 12.05 };
const RISE = 1.5, RUN = STAIR.xl - STAIR.x0;
const COPIES = [-2, -1, 1, 2];

export function floorName(i) { return FLOORS[((i % FLOORS.length) + FLOORS.length) % FLOORS.length]; }

function buildStatic() {
  const L = new Layer('module');
  const H3 = FLOOR_H;
  // lobby slab
  box(L, M.terrazzo, 6.6, 8.3, -0.02, 0, 10.7, 13.4);
  box(L, M.ceiling, 6.6, 8.3, -0.2, -0.02, 10.7, 13.4);
  // walls
  wall(L, { axis: 'x', at: 10.7, from: 5.95, to: 11.0, t: 0.15, neg: F.paint, pos: F.lobby, openings: [{ c: 7.3, w: 1.2, y0: 0, y1: 2.1, frameMat: M.frame }] });
  box(L, M.lobbyTile, 5.95, 11.0, 2.8, H3, 10.625, 10.775);
  wall(L, { axis: 'x', at: 10.7, from: 11.0, to: 11.8, t: 0.15, h: H3, neg: F.ext, pos: F.lobby });
  wall(L, { axis: 'x', at: 13.4, from: 6.6, to: 11.8, t: 0.2, h: H3, neg: F.lobby, pos: F.ext });
  wall(L, { axis: 'z', at: 11.8, from: 10.6, to: 13.5, t: 0.2, h: H3, neg: F.lobby, pos: F.ext, openings: [{ c: 12.05, w: 0.7, y0: 2.25, y1: 2.95, frame: false }] });
  windowUnit(L, { axis: 'z', at: 11.8, c: 12.05, w: 0.7, y0: 2.25, y1: 2.95, glass: M.glassFrost });
  // elevator shaft enclosure (granite towards the lobby)
  box(L, M.paint, 5.1, 5.95, 0, H3, 10.1, 11.05, { solid: true });
  box(L, M.granite, 5.95, 6.675, 0, H3, 10.775, 11.05, { solid: true });
  box(L, M.granite, 5.1, 6.675, 0, H3, 12.75, 13.4, { solid: true });
  box(L, M.granite, 5.1, 5.25, 0, H3, 11.05, 12.75, { solid: true });
  wall(L, { axis: 'z', at: 6.6, from: 11.05, to: 12.75, t: 0.15, h: H3, neg: { mat: M.steelBrushed }, pos: F.granite, edge: M.steel, openings: [{ c: 11.9, w: 0.8, y0: 0, y1: 2.1, frame: false }] });
  // stainless door frame
  box(L, M.steel, 6.675, 6.7, 0, 2.15, 11.45, 11.5); box(L, M.steel, 6.675, 6.7, 0, 2.15, 12.3, 12.35); box(L, M.steel, 6.675, 6.7, 2.1, 2.15, 11.45, 12.35);
  box(L, M.granite, 5.25, 6.525, H3 - 0.4, H3, 11.05, 12.75);               // shaft headroom above car
  // call button + hall lantern housing
  box(L, M.steel, 6.675, 6.69, 0.95, 1.35, 11.24, 11.34);
  box(L, M.blackGloss, 6.675, 6.69, 2.2, 2.42, 11.7, 12.1);
  // stairs: south flight (up), north flight (up from landing to next floor)
  const ang = Math.atan2(RISE, RUN), len = Math.hypot(RISE, RUN);
  const nose = cm('#3f8f7d', 0.5);
  for (let i = 0; i < 10; i++) {
    const tread = RUN / 10;
    // south flight: rising towards +x
    let x0 = STAIR.x0 + i * tread, top = (i + 1) * 0.15;
    box(L, M.white, x0, x0 + tread, top - 0.15, top - 0.02, STAIR.zm + 0.06, STAIR.z1);
    box(L, M.stairTread, x0, x0 + tread, top - 0.02, top, STAIR.zm + 0.06, STAIR.z1);
    box(L, nose, x0 - 0.01, x0 + 0.03, top - 0.035, top + 0.002, STAIR.zm + 0.06, STAIR.z1);
    // north flight: rising towards -x from the landing
    x0 = STAIR.xl - (i + 1) * tread; top = RISE + (i + 1) * 0.15;
    box(L, M.white, x0, x0 + tread, top - 0.15, top - 0.02, STAIR.z0, STAIR.zm - 0.06);
    box(L, M.stairTread, x0, x0 + tread, top - 0.02, top, STAIR.z0, STAIR.zm - 0.06);
    box(L, nose, x0 + tread - 0.03, x0 + tread + 0.01, top - 0.035, top + 0.002, STAIR.z0, STAIR.zm - 0.06);
  }
  for (const [zA, zB, sgn, base] of [[STAIR.zm + 0.06, STAIR.z1, 1, 0], [STAIR.z0, STAIR.zm - 0.06, -1, RISE]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, zB - zA), M.white);
    s.rotation.z = sgn * ang;
    s.position.set((STAIR.x0 + STAIR.xl) / 2, base + RISE / 2 - 0.1, (zA + zB) / 2);
    L.add(s);
    // wall-mounted wooden handrail along the centre wall
    const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.06), M.honey);
    r.rotation.z = sgn * ang;
    r.position.set((STAIR.x0 + STAIR.xl) / 2, base + RISE / 2 + 0.9, sgn > 0 ? STAIR.zm + 0.13 : STAIR.zm - 0.13);
    L.add(r);
  }
  // landing
  box(L, M.white, STAIR.xl, 11.7, RISE - 0.2, RISE - 0.02, 10.775, 13.3);
  box(L, M.stairTread, STAIR.xl, 11.7, RISE - 0.02, RISE, 10.775, 13.3);
  // centre wall between the two flights
  wall(L, { axis: 'x', at: STAIR.zm, from: STAIR.x0, to: STAIR.xl, t: 0.12, h: H3, neg: F.lobby, pos: F.lobby });
  // newel post + umbrellas at lobby level
  L.add(cbox(M.honey, 0.12, 1.0, 0.12, STAIR.x0, 0, STAIR.zm));
  L.add(cbox(M.honey, 0.16, 0.08, 0.16, STAIR.x0, 1.0, STAIR.zm));
  for (let i = 0; i < 2; i++) L.add(cyl(cm(i ? '#2b3a55' : '#555b66', 0.6), 0.02, 0.05, 0.85, STAIR.x0 - 0.09, 0.05, STAIR.zm - 0.05 + i * 0.1, 8));
  // bicycle on the landing, shoe rack + doormat in the lobby
  place(L, Fu.bicycle(), 11.25, 11.5, 0, { y: RISE });
  const rack = Fu.shoeRack(); rack.scale.set(0.6, 1, 0.85); place(L, rack, 8.1, 10.93, 0, { solid: [0.38, 0.28, 0.8] });
  box(L, cm('#9c2f2a', 0.9), 6.85, 7.75, 0, 0.01, 10.82, 11.35);
  // lights (emissive fittings)
  place(L, Fu.domeLight(0.15, M.bulbCool), 7.45, 12.0, 0, { y: 2.8 });
  place(L, Fu.domeLight(0.12, M.bulbCool), 11.2, 12.05, 0, { y: RISE + 2.75 });
  // posters near the elevator
  L.add(plane(cm('#f6e27a', 0.8), 0.25, 0.35, 6.69, 1.6, 13.05, Math.PI / 2));
  return L;
}

// Closed doors used by the copies on other floors.
function buildClosedParts() {
  const L = new Layer('closed');
  box(L, M.teal, 6.62, 6.66, 0, 2.1, 11.5, 12.3);
  box(L, M.black, 6.66, 6.665, 0, 2.1, 11.895, 11.905);
  const d = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.08, 0.05), [M.frame, M.frame, M.frame, M.frame, M.frontDoor, M.frontDoor]);
  d.position.set(7.125, 1.04, 10.66); L.add(d);
  box(L, M.narrowLeaf, 7.55, 7.9, 0, 2.08, 10.64, 10.68);
  L.add(plane(M.gate, 1.2, 2.08, 7.3, 1.04, 10.8));
  return L;
}

export function buildBuilding(scene, app) {
  const before = colliders.length;
  const statics = buildStatic().bake();
  const own = colliders.splice(before);
  for (const k of [-1, 0, 1]) for (const c of own) colliders.push({ ...c, y0: c.y0 + k * FLOOR_H, y1: c.y1 + k * FLOOR_H });

  const root = new THREE.Group(); root.name = 'building';
  const main = statics; root.add(main);
  const closed = buildClosedParts().bake();
  const copies = [];
  for (const k of COPIES) {
    const g = new THREE.Group();
    g.add(statics.clone(), closed.clone());
    g.position.y = k * FLOOR_H;
    const sign = makeSign(); g.add(sign.mesh);
    const lantern = makeLantern(); g.add(lantern.mesh);
    root.add(g);
    copies.push({ k, group: g, sign, lantern });
  }
  const mainSign = makeSign(); root.add(mainSign.mesh);
  const mainLantern = makeLantern(); root.add(mainLantern.mesh);

  // ------------------------------------------------ front door + security gate (copy 0)
  const doors = [];
  let gate;
  const front = new Door({ hinge: [6.7, 10.66], dir: [1, 0], swing: [0, -1], width: 0.85, height: 2.08, thick: 0.05, mat: M.frontDoor, name: '大門',
    onToggle: (o) => { if (gate.open !== o) gate.toggle(o); } });
  gate = new Door({ hinge: [6.7, 10.8], dir: [1, 0], swing: [0, 1], width: 0.75, height: 2.08, thick: 0.02, mat: M.gate, edgeMat: M.steel, name: '鐵門', knob: false,
    onToggle: (o) => { if (front.open !== o) front.toggle(o); } });
  doors.push(front, gate);
  root.add(front.group, gate.group);
  const fixed = new Layer('fixed');
  box(fixed, M.narrowLeaf, 7.55, 7.9, 0, 2.08, 10.64, 10.68);
  fixed.add(plane(M.gate, 0.45, 2.08, 7.675, 1.04, 10.8));
  root.add(fixed.bake());

  // ------------------------------------------------ elevator (copy 0 only)
  const elevator = new Elevator(app);
  root.add(elevator.group);

  scene.add(root);
  const api = {
    root, copies, doors, elevator, front, gate,
    setFloor(i) {
      mainSign.draw(floorName(i)); mainLantern.draw(floorName(i));
      for (const c of copies) { c.sign.draw(floorName(i + c.k)); c.lantern.draw(floorName(i + c.k)); }
      elevator.setDisplay(i);
    },
    setCopiesVisible(v) { copies.forEach((c) => (c.group.visible = v)); },
  };
  return api;
}

function makeSign() {
  const tex = T.label('8F', { w: 256, h: 160, bg: '#f7f5ef', fg: '#1f3c66', font: 'bold 110px "Segoe UI", sans-serif' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.21), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
  mesh.position.set(6.69, 1.62, 12.55); mesh.rotation.y = Math.PI / 2;
  return { mesh, draw: (s) => tex.userData.draw(s + 'F') };
}

function makeLantern() {
  const tex = T.label('8', { w: 128, h: 96, bg: '#080808', fg: '#ff3324', font: 'bold 80px "Courier New", monospace', glow: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  mesh.position.set(6.692, 2.31, 11.9); mesh.rotation.y = Math.PI / 2;
  return { mesh, draw: (s) => tex.userData.draw(s) };
}

// ------------------------------------------------------------------ Elevator
class Elevator {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group();
    this.state = 'closed'; this.f = 0; this.timer = 0; this.cur = HOME_FLOOR; this.target = HOME_FLOOR; this.display = HOME_FLOOR;
    this.moveT = 0; this.moveDur = 0; this.queueOpen = false;
    const g = this.group;
    const L = new Layer('car');
    const x0 = 5.25, x1 = 6.525, z0 = 11.05, z1 = 12.75, top = 2.35;
    const panelMat = new THREE.MeshStandardMaterial({ map: T.strips({ base: '#e3dccb', line: '#b9b09b', n: 4, meters: 0.9, vertical: true }), roughness: 0.4 });
    panelMat.userData.worldUV = true;
    box(L, M.floorBath, x0, x1, -0.02, 0, z0, z1);
    box(L, panelMat, x0, x0 + 0.01, 0, top, z0, z1);
    box(L, panelMat, x0, x1, 0, top, z0, z0 + 0.01);
    box(L, panelMat, x0, x1, 0, top, z1 - 0.01, z1);
    box(L, M.mirror, x0 + 0.012, x0 + 0.02, 0.95, 2.2, z0 + 0.25, z1 - 0.25);
    box(L, M.steel, x0 + 0.02, x0 + 0.06, 0.88, 0.92, z0 + 0.1, z1 - 0.1);
    box(L, M.ledDots, x0, x1, top, top + 0.02, z0, z1);
    box(L, M.steel, x0, x1, top - 0.08, top, z0, z0 + 0.12);
    box(L, M.steel, x0, x1, top - 0.08, top, z1 - 0.12, z1);
    box(L, M.granite, x0, x1, top + 0.02, 2.65, z0, z1);
    // notices
    for (const [z, y] of [[11.35, 1.5], [12.45, 1.45]]) L.add(plane(M.white, 0.21, 0.3, x0 + 0.015, y, z, Math.PI / 2));
    L.add(plane(M.white, 0.21, 0.3, 5.7, 1.5, z1 - 0.012, Math.PI));
    L.add(plane(M.white, 0.21, 0.3, 6.1, 1.45, z1 - 0.012, Math.PI));
    // button panel (inside, south of the door)
    box(L, M.steel, 6.5, 6.515, 0.85, 1.75, 12.38, 12.62);
    g.add(L.bake());
    this.buttons = [];
    const order = [['5', '11'], ['4', '10'], ['3', '9'], ['2', '8'], ['1', '7'], ['B1', '6']];
    order.forEach((row, r) => row.forEach((name, c) => {
      const idx = FLOORS.indexOf(name);
      const tex = T.label(name, { w: 64, h: 64, bg: '#2a2a2c', fg: '#e8e8e8', font: 'bold 34px sans-serif' });
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ff9a3c', emissiveIntensity: 0, roughness: 0.3, metalness: 0.4 });
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 20), mat);
      b.rotation.z = Math.PI / 2; b.rotation.y = 0;
      const btn = new THREE.Group(); btn.add(b);
      b.rotation.set(0, 0, Math.PI / 2);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.02, 20), mat);
      face.position.x = -0.007; face.rotation.y = -Math.PI / 2;
      btn.add(face);
      btn.position.set(6.497, 1.55 - r * 0.075, 12.45 + c * 0.1);
      g.add(btn);
      face.userData.prompt = `前往 ${name} 樓`;
      face.userData.onUse = () => this.select(idx);
      b.userData = face.userData;
      interactives.push(face, b);
      this.buttons.push({ idx, mat });
    }));
    // in-car display
    this.carTex = T.label('8', { w: 128, h: 96, bg: '#080808', fg: '#ff3324', font: 'bold 80px "Courier New", monospace', glow: true });
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshBasicMaterial({ map: this.carTex, toneMapped: false }));
    disp.position.set(6.49, 1.85, 12.5); disp.rotation.y = -Math.PI / 2; g.add(disp);
    // sliding doors (teal outside, brushed steel inside)
    const geo = new THREE.BoxGeometry(0.04, 2.1, 0.4);
    const mats = [M.teal, M.steelBrushed, M.steel, M.steel, M.steel, M.steel]; // +x faces lobby
    this.left = new THREE.Mesh(geo, mats); this.right = new THREE.Mesh(geo, mats);
    this.left.position.set(6.64, 1.05, 11.7); this.right.position.set(6.64, 1.05, 12.1);
    g.add(this.left, this.right);
    // hall call button (lobby side)
    const call = new THREE.Mesh(new THREE.CircleGeometry(0.025, 20), new THREE.MeshStandardMaterial({ color: '#ddd', emissive: '#ff8a2a', emissiveIntensity: 0 }));
    call.position.set(6.695, 1.15, 11.29); call.rotation.y = Math.PI / 2;
    call.userData.prompt = '按電梯';
    call.userData.onUse = () => this.call();
    interactives.push(call);
    this.callMat = call.material;
    g.add(call);
  }
  setDisplay(i) { this.carTex.userData.draw(floorName(i)); }
  // Park the car at floor i with the doors shut (used for the opening ride).
  park(i) {
    this.cur = this.target = this.display = i;
    this.state = 'closed'; this.f = 0; this.timer = 0;
    this.buttons.forEach((b) => (b.mat.emissiveIntensity = 0));
    this.callMat.emissiveIntensity = 0;
    this.setDisplay(i);
  }
  inCar(p) { return p.x > 5.25 && p.x < 6.6 && p.z > 11.05 && p.z < 12.75; }
  call() {
    if (this.state === 'closed') { this.state = 'opening'; this.app.audio.ding(); this.callMat.emissiveIntensity = 1.5; }
    else if (this.state === 'closing') this.state = 'opening';
    this.timer = 0;
  }
  select(idx) {
    if (this.state === 'moving') return;
    // Opening ride: the doors only open once you reach home (8F).
    if (this.app.intro && idx === this.cur && idx !== HOME_FLOOR) {
      this.app.ui.toast(`這裡是 ${floorName(idx)} 樓。我家在 ${floorName(HOME_FLOOR)} 樓，按 ${floorName(HOME_FLOOR)}。`);
      return;
    }
    this.buttons.forEach((b) => (b.mat.emissiveIntensity = b.idx === idx ? 1.4 : 0));
    this.target = idx;
    if (idx === this.cur) { this.call(); return; }
    this.app.ui.toast(`前往 ${floorName(idx)} 樓…`);
    this.state = 'closing';
  }
  doorSegments() {
    if (this.f > 0.85) return [];
    const o = this.f * 0.4;
    return [[6.64, 11.5, 6.64, 11.9 - o], [6.64, 11.9 + o, 6.64, 12.3]];
  }
  update(dt, player) {
    const inCar = this.inCar(player.pos);
    const near = Math.hypot(player.pos.x - 6.9, player.pos.z - 11.9) < 1.3;
    switch (this.state) {
      case 'opening':
        this.f = Math.min(1, this.f + dt * 1.4);
        if (this.f >= 1) { this.state = 'open'; this.timer = 0; }
        break;
      case 'open':
        if (!inCar) this.timer += dt; else this.timer = 0;
        if (this.timer > 4 && !near) this.state = 'closing';
        break;
      case 'closing':
        if (near && !inCar && this.target === this.cur && player.moving) { this.state = 'opening'; break; }
        this.f = Math.max(0, this.f - dt * 1.1);
        if (this.f <= 0) {
          this.callMat.emissiveIntensity = 0;
          if (this.target !== this.cur && inCar) {
            this.state = 'moving'; this.moveT = 0;
            const steps = Math.abs(this.target - this.cur);
            this.moveDur = 1.4 + steps * 0.55; this.from = this.cur;
            this.app.audio.hum(this.moveDur);
          } else { this.target = this.cur; this.state = 'closed'; }
        }
        break;
      case 'moving': {
        this.moveT += dt;
        const k = Math.min(1, this.moveT / this.moveDur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const shown = Math.round(this.from + (this.target - this.from) * e);
        if (shown !== this.display) { this.display = shown; this.setDisplay(shown); this.app.setFloor(shown, { quiet: true }); }
        this.app.shake = 0.004 * Math.sin(k * Math.PI);
        if (k >= 1) {
          this.cur = this.target; this.app.shake = 0;
          this.buttons.forEach((b) => (b.mat.emissiveIntensity = 0));
          this.app.setFloor(this.cur, { arrive: true });
          this.app.audio.ding();
          if (this.app.intro && this.cur !== HOME_FLOOR) {
            this.state = 'closed'; this.target = this.cur;
            this.app.ui.toast(`${floorName(this.cur)} 樓到了……門沒有開。我家在 ${floorName(HOME_FLOOR)} 樓。`);
          } else {
            if (this.app.intro) this.app.endIntro();
            this.state = 'opening';
          }
        }
        break;
      }
    }
    const o = this.f * 0.4;
    this.left.position.z = 11.7 - o; this.right.position.z = 12.1 + o;
  }
}
