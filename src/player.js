// First-person walker: input, collision against AABBs + door segments, floors/stairs,
// and the endless-stairs wrap.
import * as THREE from 'three';
import { colliders } from './kit.js';
import { STAIR, FLOOR_H } from './building.js';

const R = 0.24, EYE = 1.58, STEP = 0.42;
const RISE = 1.5, RUN = STAIR.xl - STAIR.x0;

function inRect(x, z, x0, x1, z0, z1) { return x >= x0 && x <= x1 && z >= z0 && z <= z1; }

// Walkable surface height at (x,z) closest below footY (+step tolerance).
export function groundAt(x, z, footY) {
  let cands = null;
  if (inRect(x, z, STAIR.x0, 11.8, 10.7, 13.4)) {
    cands = [];
    for (let k = -1; k <= 1; k++) {
      const b = k * FLOOR_H;
      if (x >= STAIR.xl) cands.push(b + RISE);
      else {
        const t = Math.min(1, Math.max(0, (x - STAIR.x0) / RUN));
        cands.push(z >= STAIR.zm ? b + RISE * t : b + FLOOR_H - RISE * t);
      }
    }
  } else if (inRect(x, z, 6.6, 8.3, 10.7, 13.4)) {
    cands = [-FLOOR_H, 0, FLOOR_H];
  } else if (inRect(x, z, 6.0, 11, 3.68, 6.52)) return 0.06;
  else return 0;
  let best = -Infinity, low = Infinity;
  for (const c of cands) { if (c <= footY + STEP && c > best) best = c; if (c < low) low = c; }
  return best === -Infinity ? low : best;
}

export class Player {
  constructor() {
    this.pos = new THREE.Vector3(7.3, 0, 12.3);
    this.yaw = 0; this.pitch = 0;
    this.vel = new THREE.Vector2();
    this.vy = 0; this.onGround = true;
    this.keys = new Set();
    this.joy = new THREE.Vector2();
    this.bob = 0; this.stepAcc = 0; this.moving = false; this.speed = 0;
    this.wasLanding = false;
    this.segments = () => [];
    this.onWrap = null; this.onStep = null;
  }
  get eye() { return EYE; }
  look(dx, dy) {
    this.yaw -= dx; this.pitch -= dy;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  }
  update(dt) {
    const k = this.keys;
    let fx = 0, fz = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) fz -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) fz += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
    fx += this.joy.x; fz += this.joy.y;
    const len = Math.hypot(fx, fz);
    if (len > 1) { fx /= len; fz /= len; }
    const run = k.has('ShiftLeft') || k.has('ShiftRight') || this.joy.length() > 0.95;
    const sp = run ? 3.6 : 2.0;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const wx = (fx * c + fz * s) * sp, wz = (-fx * s + fz * c) * sp;
    const a = 1 - Math.exp(-(len > 0 ? 10 : 14) * dt);
    this.vel.x += (wx - this.vel.x) * a; this.vel.y += (wz - this.vel.y) * a;
    this.speed = this.vel.length();
    this.moving = this.speed > 0.15;

    const prevLanding = this.pos.x >= STAIR.xl && inRect(this.pos.x, this.pos.z, STAIR.x0, 11.8, 10.7, 13.4);
    // integrate in sub-steps for robust collision
    const steps = Math.ceil(Math.max(1, this.speed * dt / 0.08));
    for (let i = 0; i < steps; i++) {
      this.pos.x += this.vel.x * dt / steps;
      this.pos.z += this.vel.y * dt / steps;
      this.collide();
    }
    // endless stairs: leaving the mid-landing onto the "next" flight wraps by one floor
    const nowLanding = this.pos.x >= STAIR.xl;
    if (prevLanding && !nowLanding && inRect(this.pos.x, this.pos.z, STAIR.x0, 11.8, 10.7, 13.4)) {
      if (this.pos.y > 0.75 && this.pos.z < STAIR.zm) { this.pos.y -= FLOOR_H; this.onWrap && this.onWrap(+1); }
      else if (this.pos.y < -0.75 && this.pos.z >= STAIR.zm) { this.pos.y += FLOOR_H; this.onWrap && this.onWrap(-1); }
    }
    // vertical
    const g = groundAt(this.pos.x, this.pos.z, this.pos.y);
    if (this.onGround && this.vy <= 0 && this.pos.y - g < 0.35 && this.pos.y >= g - STEP) {
      this.pos.y += (g - this.pos.y) * Math.min(1, dt * 18);
      if (Math.abs(this.pos.y - g) < 0.002) this.pos.y = g;
    } else {
      this.vy -= 16 * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= g) { this.pos.y = g; this.vy = 0; this.onGround = true; }
      else this.onGround = false;
    }
    if (this.pos.y < g - 0.6) this.pos.y = g; // safety
    // head bob + footsteps
    if (this.moving && this.onGround) {
      this.bob += dt * this.speed * 4.2;
      this.stepAcc += this.speed * dt;
      if (this.stepAcc > (run ? 0.75 : 0.62)) { this.stepAcc = 0; this.onStep && this.onStep(); }
    } else this.bob *= 0.9;
  }
  jump() { if (this.onGround) { this.vy = 3.6; this.onGround = false; } }
  collide() {
    const p = this.pos, foot = p.y;
    for (let iter = 0; iter < 2; iter++) {
      for (const b of colliders) {
        if (b.y1 <= foot + 0.3 || b.y0 >= foot + 1.75) continue;
        const cx = Math.max(b.x0, Math.min(p.x, b.x1)), cz = Math.max(b.z0, Math.min(p.z, b.z1));
        let dx = p.x - cx, dz = p.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 < 1e-9) {
          // center inside box: push out along the shallowest axis
          const ex = [p.x - b.x0, b.x1 - p.x, p.z - b.z0, b.z1 - p.z];
          const m = Math.min(...ex), i = ex.indexOf(m);
          if (i === 0) p.x = b.x0 - R; else if (i === 1) p.x = b.x1 + R; else if (i === 2) p.z = b.z0 - R; else p.z = b.z1 + R;
          continue;
        }
        const d = Math.sqrt(d2), push = (R - d) / d;
        p.x += dx * push; p.z += dz * push;
      }
      for (const [x0, z0, x1, z1] of this.segments()) {
        const vx = x1 - x0, vz = z1 - z0, l2 = vx * vx + vz * vz || 1e-9;
        const t = Math.max(0, Math.min(1, ((p.x - x0) * vx + (p.z - z0) * vz) / l2));
        const cx = x0 + vx * t, cz = z0 + vz * t;
        const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), rr = R + 0.03;
        if (d < rr && d > 1e-6) { p.x += dx / d * (rr - d); p.z += dz / d * (rr - d); }
      }
    }
  }
  forward(v = new THREE.Vector3()) { return v.set(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)); }
}
