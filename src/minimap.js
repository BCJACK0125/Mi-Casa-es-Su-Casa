// 2D floor-plan minimap with the player's position and view cone.
import { ROOMS, MAP_DOORS, MEMORIES } from './data.js';

const BOUNDS = { x0: -0.4, x1: 12.1, z0: -0.4, z1: 13.8 };

export class Minimap {
  constructor(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.resize();
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.c.width = r.width * this.dpr; this.c.height = r.height * this.dpr;
  }
  draw({ x, z, yaw, room, found, showMem, pulse }) {
    const g = this.g, W = this.w, Hh = this.h;
    if (!W) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, W, Hh);
    const s = Math.min(W / (BOUNDS.x1 - BOUNDS.x0), Hh / (BOUNDS.z1 - BOUNDS.z0));
    const ox = (W - (BOUNDS.x1 - BOUNDS.x0) * s) / 2 - BOUNDS.x0 * s;
    const oz = (Hh - (BOUNDS.z1 - BOUNDS.z0) * s) / 2 - BOUNDS.z0 * s;
    const P = (px, pz) => [ox + px * s, oz + pz * s];
    // rooms
    for (const r of ROOMS) {
      const [a, b, c, d] = r.rect; const [X0, Z0] = P(a, c); const [X1, Z1] = P(b, d);
      const active = room && room.id === r.id;
      g.fillStyle = active ? r.color : r.color + 'aa';
      g.fillRect(X0, Z0, X1 - X0, Z1 - Z0);
      g.strokeStyle = 'rgba(40,32,24,0.85)'; g.lineWidth = active ? 2.2 : 1.4;
      g.strokeRect(X0, Z0, X1 - X0, Z1 - Z0);
      if (active) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(X0, Z0, X1 - X0, Z1 - Z0); }
    }
    // stairs hatching
    g.strokeStyle = 'rgba(80,50,45,0.35)'; g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const [X, Z0] = P(8.3 + i * 0.23, 10.75); const [, Z1] = P(0, 13.35); g.beginPath(); g.moveTo(X, Z0); g.lineTo(X, Z1); g.stroke(); }
    // door gaps
    g.strokeStyle = '#f7f1e3'; g.lineWidth = 3;
    for (const [a, b, c, d] of MAP_DOORS) { const [X0, Z0] = P(a, b); const [X1, Z1] = P(c, d); g.beginPath(); g.moveTo(X0, Z0); g.lineTo(X1, Z1); g.stroke(); }
    // labels
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.max(8, Math.min(13, s * 0.42));
    g.font = `600 ${fs}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    for (const r of ROOMS) {
      if (r.id === 'car' && s < 18) continue;
      const [a, b, c, d] = r.rect; const [X, Z] = P((a + b) / 2, (c + d) / 2);
      g.fillStyle = 'rgba(30,24,18,0.85)';
      if (r.id === 'hall') { g.save(); g.translate(X, Z); g.rotate(-Math.PI / 2); g.fillText(r.name, 0, 0); g.restore(); }
      else g.fillText(r.name, X, Z);
    }
    // memories not yet found
    for (const m of showMem ? MEMORIES : []) {
      if (found && found.has(m.id)) continue;
      const [X, Z] = P(m.x, m.z);
      g.fillStyle = `rgba(255,190,60,${0.55 + 0.45 * Math.sin(pulse * 3)})`;
      g.beginPath(); g.arc(X, Z, Math.max(2.5, s * 0.13), 0, 7); g.fill();
    }
    // player
    const [PX, PZ] = P(x, z);
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const ang = Math.atan2(fz, fx);
    const cone = g.createRadialGradient(PX, PZ, 0, PX, PZ, s * 2.6);
    cone.addColorStop(0, 'rgba(255,120,60,0.45)'); cone.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(PX, PZ); g.arc(PX, PZ, s * 2.6, ang - 0.55, ang + 0.55); g.closePath(); g.fill();
    g.save(); g.translate(PX, PZ); g.rotate(ang + Math.PI / 2);
    const k = Math.max(5, s * 0.32);
    g.fillStyle = '#ff5a2c'; g.strokeStyle = '#fff'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, -k); g.lineTo(k * 0.7, k * 0.8); g.lineTo(0, k * 0.35); g.lineTo(-k * 0.7, k * 0.8); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // compass
    g.fillStyle = 'rgba(30,24,18,0.7)'; g.font = `700 ${fs}px sans-serif`; g.fillText('N', W - 12, 12);
  }
}
