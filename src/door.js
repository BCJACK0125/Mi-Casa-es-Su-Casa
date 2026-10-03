// Hinged door leaf. Hinge at (x,z); `dir` = unit vector from hinge to the opposite
// jamb when closed; `swing` = unit vector the leaf points to when fully open.
import * as THREE from 'three';
import { M, interactives } from './kit.js';

const angleOf = (v) => Math.atan2(-v[1], v[0]);

export class Door {
  constructor({ hinge, dir, swing, width, height = 2.03, thick = 0.04, mat = M.door, edgeMat = M.frame, open = false, name = '門', y = 0, onToggle = null, knob = true }) {
    this.hinge = hinge; this.width = width; this.name = name; this.onToggle = onToggle;
    this.a0 = angleOf(dir);
    let a1 = angleOf(swing);
    let d = a1 - this.a0;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.a1 = this.a0 + d;
    this.open = open; this.t = open ? 1 : 0; this.locked = false;
    this.group = new THREE.Group();
    this.group.position.set(hinge[0], y, hinge[1]);
    const mats = [edgeMat, edgeMat, edgeMat, edgeMat, mat, mat];
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.01, height, thick), mats);
    leaf.position.set(width / 2, height / 2, 0);
    this.group.add(leaf);
    if (knob) {
      const km = M.gold;
      for (const s of [-1, 1]) {
        const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), km);
        k.position.set(width - 0.07, 0.95, s * (thick / 2 + 0.03));
        this.group.add(k);
      }
    }
    leaf.userData.prompt = () => (this.open ? `關上${this.name}` : `打開${this.name}`);
    leaf.userData.onUse = () => this.toggle();
    interactives.push(leaf);
    this.leaf = leaf;
    this.apply();
  }
  toggle(force) {
    if (this.locked) return;
    this.open = force === undefined ? !this.open : force;
    if (this.onToggle) this.onToggle(this.open);
  }
  apply() {
    const e = this.t * this.t * (3 - 2 * this.t);
    this.group.rotation.y = this.a0 + (this.a1 - this.a0) * e;
  }
  update(dt) {
    const target = this.open ? 1 : 0;
    if (this.t !== target) {
      this.t += Math.sign(target - this.t) * dt * 1.6;
      this.t = Math.min(1, Math.max(0, this.t));
      this.apply();
    }
  }
  // collision segment (hinge -> tip)
  segment() {
    const a = this.group.rotation.y;
    return [this.hinge[0], this.hinge[1], this.hinge[0] + Math.cos(a) * this.width, this.hinge[1] - Math.sin(a) * this.width];
  }
}
