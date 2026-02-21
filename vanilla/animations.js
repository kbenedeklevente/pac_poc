// Vanilla Canvas animations — manual pixel-level animations
// Flickering light, pipe drips, bubbling vials, sparking wire, pulsing red light

import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT } from '../shared/constants.js';
import { getVisibleObjects } from '../shared/roomData.js';
import { gameState } from '../shared/gameState.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

// Particle arrays for drips
const drips = [];
const sparks = [];
const bubbles = [];

function spawnDrip(obj) {
  drips.push({
    x: obj.x + 25 + Math.random() * 10,
    y: obj.y + obj.h * 0.6 + 15,
    vy: 0.5 + Math.random() * 1,
    life: 1,
    size: 2 + Math.random() * 2,
  });
}

function spawnSpark(obj) {
  sparks.push({
    x: obj.x + obj.w / 2 + (Math.random() - 0.5) * 20,
    y: obj.y + obj.h / 2 + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 4,
    vy: -1 - Math.random() * 3,
    life: 1,
    size: 1 + Math.random() * 2,
  });
}

function spawnBubble(obj) {
  bubbles.push({
    x: obj.x + obj.w / 2 + (Math.random() - 0.5) * 8,
    y: obj.y + obj.h - 5,
    vy: -0.3 - Math.random() * 0.5,
    life: 1,
    size: 1 + Math.random() * 2,
  });
}

// Timers
let dripTimer = 0;
let sparkTimer = 0;
let bubbleTimer = 0;

export function updateAnimations(ctx, roomIndex, time, dt) {
  const objects = getVisibleObjects(roomIndex, gameState);

  for (const obj of objects) {
    if (!obj.animation) continue;

    switch (obj.animation) {
      case 'flicker':
        drawFlicker(ctx, obj, time);
        break;
      case 'drip':
        dripTimer += dt;
        if (dripTimer > 0.15) {
          spawnDrip(obj);
          dripTimer = 0;
        }
        break;
      case 'spark':
        sparkTimer += dt;
        if (sparkTimer > 0.08) {
          if (Math.random() < 0.3) spawnSpark(obj);
          sparkTimer = 0;
        }
        drawWire(ctx, obj, time);
        break;
      case 'bubble':
        bubbleTimer += dt;
        if (bubbleTimer > 0.3) {
          spawnBubble(obj);
          bubbleTimer = 0;
        }
        break;
      case 'pulse_red':
        drawPulsingLight(ctx, obj, time);
        break;
    }
  }

  // Update and draw drips
  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i];
    d.y += d.vy;
    d.life -= dt * 0.8;
    if (d.life <= 0 || d.y > SCENE_H - 80) {
      drips.splice(i, 1);
      continue;
    }
    ctx.fillStyle = COLORS.pipeDrip;
    ctx.globalAlpha = d.life;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Update and draw sparks
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.15; // gravity
    s.life -= dt * 2;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    ctx.fillStyle = COLORS.wireSpark;
    ctx.globalAlpha = s.life;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Update and draw bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y += b.vy;
    b.x += Math.sin(time * 5 + i) * 0.3;
    b.life -= dt * 0.6;
    if (b.life <= 0) {
      bubbles.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = COLORS.vialLiquid;
    ctx.globalAlpha = b.life * 0.6;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawFlicker(ctx, obj, time) {
  // Overhead light with flicker
  const flicker = Math.sin(time * 8) * 0.2 + Math.sin(time * 13) * 0.1 + 0.6;
  const on = flicker > 0.4;

  if (on) {
    // Light fixture
    ctx.fillStyle = COLORS.overheadLight;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);

    // Light cone (radial gradient)
    const grd = ctx.createRadialGradient(
      obj.x + obj.w / 2, obj.y + obj.h, 10,
      obj.x + obj.w / 2, obj.y + 150, 250
    );
    grd.addColorStop(0, `rgba(255,250,205,${0.15 * flicker})`);
    grd.addColorStop(1, 'rgba(255,250,205,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(obj.x - 200, obj.y, 480, 400);
  } else {
    ctx.fillStyle = '#444';
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  }

  // Fixture housing
  ctx.fillStyle = '#666';
  ctx.fillRect(obj.x - 5, obj.y - 5, obj.w + 10, 8);
}

function drawWire(ctx, obj, time) {
  // Dangling wire
  ctx.strokeStyle = COLORS.wire;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(obj.x + obj.w / 2, obj.y);
  const sway = Math.sin(time * 2) * 5;
  ctx.quadraticCurveTo(
    obj.x + obj.w / 2 + sway, obj.y + obj.h * 0.5,
    obj.x + obj.w / 2 + sway * 1.5, obj.y + obj.h
  );
  ctx.stroke();

  // Spark glow at tip
  if (Math.sin(time * 11) > 0.3) {
    const grd = ctx.createRadialGradient(
      obj.x + obj.w / 2 + sway * 1.5, obj.y + obj.h, 2,
      obj.x + obj.w / 2 + sway * 1.5, obj.y + obj.h, 15
    );
    grd.addColorStop(0, 'rgba(255,221,87,0.8)');
    grd.addColorStop(1, 'rgba(255,221,87,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(obj.x + obj.w / 2 + sway * 1.5, obj.y + obj.h, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPulsingLight(ctx, obj, time) {
  const pulse = (Math.sin(time * 3) + 1) / 2; // 0..1

  // Light housing
  ctx.fillStyle = '#333';
  ctx.fillRect(obj.x - 5, obj.y - 5, obj.w + 10, obj.h + 10);

  // Red light
  ctx.fillStyle = COLORS.emergencyRed;
  ctx.globalAlpha = 0.4 + pulse * 0.6;
  ctx.beginPath();
  ctx.arc(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  const grd = ctx.createRadialGradient(
    obj.x + obj.w / 2, obj.y + obj.h / 2, 5,
    obj.x + obj.w / 2, obj.y + obj.h / 2, 120 + pulse * 80
  );
  grd.addColorStop(0, `rgba(255,68,68,${0.15 * pulse})`);
  grd.addColorStop(1, 'rgba(255,68,68,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(obj.x - 150, obj.y - 150, 340, 340);
  ctx.globalAlpha = 1;
}

export function clearParticles() {
  drips.length = 0;
  sparks.length = 0;
  bubbles.length = 0;
}
