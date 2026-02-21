// Vanilla Canvas renderer — ctx.fillRect, gradients, arcs
// Hero feature: pixel-level panel dissolve via getImageData/putImageData

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, COLORS, PHASES } from '../shared/constants.js';
import { rooms, getVisibleObjects } from '../shared/roomData.js';
import { gameState } from '../shared/gameState.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

// ─── Background renderers ───

function drawStorageBg(ctx) {
  // Gradient floor/wall
  const grad = ctx.createLinearGradient(0, 0, 0, SCENE_H);
  grad.addColorStop(0, COLORS.storageBg);
  grad.addColorStop(1, COLORS.storageBgAlt);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, SCENE_H);

  // Floor line
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
  ctx.strokeStyle = '#3a3a5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, SCENE_H - 80);
  ctx.lineTo(CANVAS_WIDTH, SCENE_H - 80);
  ctx.stroke();
}

function drawLabBg(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, SCENE_H);
  grad.addColorStop(0, COLORS.labBg);
  grad.addColorStop(1, COLORS.labBgAlt);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, SCENE_H);

  // Tiled floor
  ctx.fillStyle = '#1e1e3a';
  ctx.fillRect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
  for (let x = 0; x < CANVAS_WIDTH; x += 60) {
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, SCENE_H - 80, 60, 80);
  }
}

function drawCorridorBg(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, SCENE_H);
  grad.addColorStop(0, COLORS.corridorBg);
  grad.addColorStop(1, COLORS.corridorBgAlt);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, SCENE_H);

  // Concrete floor
  ctx.fillStyle = '#222240';
  ctx.fillRect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
  ctx.strokeStyle = '#333355';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, SCENE_H - 80);
  ctx.lineTo(CANVAS_WIDTH, SCENE_H - 80);
  ctx.stroke();
}

const bgRenderers = { storage: drawStorageBg, lab: drawLabBg, corridor: drawCorridorBg };

// ─── Object renderers ───

function drawShelf(ctx, obj) {
  // Vertical supports
  ctx.fillStyle = COLORS.shelfDark;
  ctx.fillRect(obj.x, obj.y, 8, obj.h);
  ctx.fillRect(obj.x + obj.w - 8, obj.y, 8, obj.h);
  // Shelves
  ctx.fillStyle = COLORS.shelf;
  for (let i = 0; i < 4; i++) {
    const sy = obj.y + i * (obj.h / 3);
    ctx.fillRect(obj.x, sy, obj.w, 6);
  }
}

function drawBeaker(ctx, obj) {
  ctx.fillStyle = COLORS.beaker;
  ctx.globalAlpha = 0.85;
  // Beaker body — Erlenmeyer flask shape: narrow neck, wide base, spout
  ctx.beginPath();
  // Spout (left lip)
  ctx.moveTo(obj.x + obj.w * 0.25, obj.y);
  ctx.lineTo(obj.x + obj.w * 0.2, obj.y + 4);
  // Neck
  ctx.lineTo(obj.x + obj.w * 0.3, obj.y + obj.h * 0.25);
  // Shoulder curve to wide base
  ctx.quadraticCurveTo(obj.x, obj.y + obj.h * 0.5, obj.x + 2, obj.y + obj.h);
  // Base
  ctx.lineTo(obj.x + obj.w - 2, obj.y + obj.h);
  // Right side curve up
  ctx.quadraticCurveTo(obj.x + obj.w, obj.y + obj.h * 0.5, obj.x + obj.w * 0.7, obj.y + obj.h * 0.25);
  // Right neck
  ctx.lineTo(obj.x + obj.w * 0.8, obj.y + 4);
  ctx.lineTo(obj.x + obj.w * 0.75, obj.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#88b8ca';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Graduation marks
  ctx.strokeStyle = 'rgba(136,184,202,0.4)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const my = obj.y + obj.h * (0.4 + i * 0.15);
    const mx = obj.x + obj.w * (0.15 + i * 0.03);
    ctx.beginPath();
    ctx.moveTo(mx + 4, my);
    ctx.lineTo(mx + 12, my);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBox(ctx, obj) {
  ctx.fillStyle = COLORS.box;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  ctx.fillStyle = COLORS.boxDark;
  ctx.fillRect(obj.x, obj.y, obj.w, 6);
  ctx.strokeStyle = '#5a3e0e';
  ctx.lineWidth = 1;
  ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
}

function drawBench(ctx, obj) {
  // Table top
  ctx.fillStyle = COLORS.labBenchTop;
  ctx.fillRect(obj.x, obj.y, obj.w, 12);
  // Legs
  ctx.fillStyle = COLORS.labBench;
  ctx.fillRect(obj.x + 10, obj.y + 12, 10, obj.h - 12);
  ctx.fillRect(obj.x + obj.w - 20, obj.y + 12, 10, obj.h - 12);
  // Cross bar
  ctx.fillRect(obj.x + 10, obj.y + obj.h - 15, obj.w - 20, 6);
}

function drawPipe(ctx, obj) {
  // Vertical pipe
  ctx.fillStyle = COLORS.pipe;
  ctx.fillRect(obj.x + 15, obj.y, 30, obj.h);
  // Pipe cap top
  ctx.fillStyle = '#555';
  ctx.fillRect(obj.x + 10, obj.y, 40, 10);
  // Joint
  ctx.fillRect(obj.x + 10, obj.y + obj.h * 0.6, 40, 10);
  // Leak mark — green corrosive
  ctx.fillStyle = 'rgba(87,204,153,0.4)';
  ctx.fillRect(obj.x + 10, obj.y + obj.h * 0.6 + 10, 40, 5);
  // Drip stain
  ctx.fillStyle = 'rgba(87,204,153,0.2)';
  ctx.beginPath();
  ctx.arc(obj.x + 30, obj.y + obj.h + 10, 15, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipeWarning(ctx, obj) {
  // Yellow diamond sign
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + 22;
  ctx.fillStyle = COLORS.warningSign;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-14, -14, 28, 28);
  ctx.restore();

  // Skull
  ctx.fillStyle = '#1a1a2e';
  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = COLORS.warningSign;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Jaw
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(cx - 4, cy + 3, 8, 3);
  // Teeth
  ctx.fillStyle = COLORS.warningSign;
  ctx.fillRect(cx - 3, cy + 3, 2, 3);
  ctx.fillRect(cx + 1, cy + 3, 2, 3);

  // Crossbones
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 12);
  ctx.lineTo(cx + 10, cy + 24);
  ctx.moveTo(cx + 10, cy + 12);
  ctx.lineTo(cx - 10, cy + 24);
  ctx.stroke();

  // "TOXIC" text
  ctx.fillStyle = COLORS.warningSign;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOXIC', cx, obj.y + obj.h - 4);
}

function drawPanel(ctx, obj) {
  ctx.fillStyle = COLORS.panelCorroded;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  // Corrosion marks
  ctx.fillStyle = 'rgba(100,60,30,0.5)';
  for (let i = 0; i < 6; i++) {
    const cx = obj.x + 15 + Math.sin(i * 2.3) * 30 + 20;
    const cy = obj.y + 15 + Math.cos(i * 1.7) * 40 + 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bolts
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(obj.x + 10, obj.y + 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(obj.x + obj.w - 10, obj.y + 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(obj.x + 10, obj.y + obj.h - 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(obj.x + obj.w - 10, obj.y + obj.h - 10, 4, 0, Math.PI * 2); ctx.fill();
}

function drawPanelDissolved(ctx, obj) {
  // Dark opening
  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(obj.x + 5, obj.y + 5, obj.w - 10, obj.h - 10);
  // Ragged edges
  ctx.fillStyle = COLORS.panelCorroded;
  for (let i = 0; i < 12; i++) {
    const ex = obj.x + Math.random() * obj.w;
    const ey = obj.y + (i < 6 ? 0 : obj.h - 8);
    ctx.fillRect(ex, ey, 8, 8);
  }
}

function drawKey(ctx, obj) {
  ctx.fillStyle = COLORS.key;
  // Key head (circle)
  ctx.beginPath();
  ctx.arc(obj.x + 12, obj.y + 15, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a15';
  ctx.beginPath();
  ctx.arc(obj.x + 12, obj.y + 15, 4, 0, Math.PI * 2);
  ctx.fill();
  // Key shaft
  ctx.fillStyle = COLORS.key;
  ctx.fillRect(obj.x + 12, obj.y + 10, obj.w - 14, 6);
  // Key teeth
  ctx.fillRect(obj.x + obj.w - 8, obj.y + 10, 4, 12);
  ctx.fillRect(obj.x + obj.w - 16, obj.y + 10, 4, 10);
}

function drawDoor(ctx, obj) {
  // Door frame
  ctx.fillStyle = COLORS.doorFrame;
  ctx.fillRect(obj.x - 10, obj.y - 10, obj.w + 20, obj.h + 10);
  // Door body
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  // Door panels
  ctx.strokeStyle = '#3a3a5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(obj.x + 15, obj.y + 20, obj.w - 30, obj.h * 0.35);
  ctx.strokeRect(obj.x + 15, obj.y + obj.h * 0.45, obj.w - 30, obj.h * 0.35);
  // Handle
  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  ctx.arc(obj.x + obj.w - 30, obj.y + obj.h * 0.5, 8, 0, Math.PI * 2);
  ctx.fill();
  // Lock indicator
  if (gameState.phase !== PHASES.WIN) {
    ctx.fillStyle = COLORS.emergencyRed;
    ctx.beginPath();
    ctx.arc(obj.x + obj.w - 30, obj.y + obj.h * 0.5 - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#57cc99';
    ctx.beginPath();
    ctx.arc(obj.x + obj.w - 30, obj.y + obj.h * 0.5 - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWarningSign(ctx, obj) {
  ctx.fillStyle = COLORS.warningSign;
  // Diamond shape
  ctx.save();
  ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-obj.w / 3, -obj.h / 3, obj.w * 0.66, obj.h * 0.66);
  ctx.restore();
  // Exclamation
  ctx.fillStyle = COLORS.warningText;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('!', obj.x + obj.w / 2, obj.y + obj.h / 2 + 10);
}

function drawVial(ctx, obj) {
  ctx.fillStyle = COLORS.vial;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(obj.x + 5, obj.y, obj.w - 10, obj.h);
  ctx.fillStyle = COLORS.vialLiquid;
  ctx.fillRect(obj.x + 7, obj.y + obj.h * 0.4, obj.w - 14, obj.h * 0.55);
  ctx.globalAlpha = 1;
}

const objectRenderers = {
  shelf_left: drawShelf,
  shelf_right: drawShelf,
  beaker: drawBeaker,
  box1: drawBox,
  box2: drawBox,
  box3: drawBox,
  bench: drawBench,
  pipe: drawPipe,
  pipe_warning: drawPipeWarning,
  panel: drawPanel,
  panel_dissolved: drawPanelDissolved,
  key: drawKey,
  door: drawDoor,
  warning_sign: drawWarningSign,
  vials: drawVial,
  vials2: drawVial,
};

// ─── Main render function ───

export function renderRoom(ctx, roomIndex, time) {
  const room = rooms[roomIndex];
  if (!room) return;

  // Clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, SCENE_H);

  // Background
  const bgFn = bgRenderers[room.bg.type];
  if (bgFn) bgFn(ctx);

  // Room name
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(room.name, 90, 25);

  // Objects
  const visible = getVisibleObjects(roomIndex, gameState);
  for (const obj of visible) {
    const renderer = objectRenderers[obj.id];
    if (renderer) {
      renderer(ctx, obj, time);
    }
  }
}

// ─── Inventory item drawing (small icons) ───

function drawBeakerIcon(ctx, x, y, s, hasAcid) {
  ctx.fillStyle = COLORS.beaker;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.25, y);
  ctx.lineTo(x + s * 0.3, y + s * 0.25);
  ctx.quadraticCurveTo(x, y + s * 0.5, x + 2, y + s);
  ctx.lineTo(x + s - 2, y + s);
  ctx.quadraticCurveTo(x + s, y + s * 0.5, x + s * 0.7, y + s * 0.25);
  ctx.lineTo(x + s * 0.75, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#88b8ca';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (hasAcid) {
    ctx.fillStyle = COLORS.acid;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.15, y + s * 0.45);
    ctx.quadraticCurveTo(x, y + s * 0.7, x + 2, y + s);
    ctx.lineTo(x + s - 2, y + s);
    ctx.quadraticCurveTo(x + s, y + s * 0.7, x + s * 0.85, y + s * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawInventoryItem(ctx, itemId, x, y, size) {
  const pad = 8;
  const inner = size - pad * 2;
  if (itemId === 'beaker') {
    drawBeakerIcon(ctx, x + pad, y + pad, inner, false);
  } else if (itemId === 'acid') {
    drawBeakerIcon(ctx, x + pad, y + pad, inner, true);
  } else if (itemId === 'key') {
    ctx.fillStyle = COLORS.key;
    ctx.beginPath();
    ctx.arc(x + pad + 10, y + size / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a15';
    ctx.beginPath();
    ctx.arc(x + pad + 10, y + size / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.key;
    ctx.fillRect(x + pad + 10, y + size / 2 - 3, inner - 12, 5);
    ctx.fillRect(x + pad + inner - 5, y + size / 2 - 3, 3, 10);
  }
}

// ─── Panel dissolve (hero feature) ───

let dissolveImageData = null;
let dissolveProgress = 0;
let dissolveActive = false;

export function startDissolve(ctx) {
  const panel = rooms[1].objects.find(o => o.id === 'panel');
  if (!panel) return;
  // Capture the panel area
  dissolveImageData = ctx.getImageData(panel.x, panel.y, panel.w, panel.h);
  dissolveProgress = 0;
  dissolveActive = true;
}

export function updateDissolve(ctx, dt) {
  if (!dissolveActive || !dissolveImageData) return false;

  const panel = rooms[1].objects.find(o => o.id === 'panel');
  dissolveProgress += dt * 0.4; // ~2.5 seconds total

  const data = dissolveImageData.data;
  const w = dissolveImageData.width;
  const h = dissolveImageData.height;

  // Dissolve from top to bottom, pixel by pixel
  const dissolvedRows = Math.floor(dissolveProgress * h);
  for (let y = 0; y < Math.min(dissolvedRows, h); y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Random chance to dissolve based on progress
      if (Math.random() < dissolveProgress * 1.5) {
        // Fade to dark with acid-green tint
        data[i] = 10;     // R
        data[i + 1] = 20; // G
        data[i + 2] = 10; // B
        data[i + 3] = 200;
      }
    }
  }

  ctx.putImageData(dissolveImageData, panel.x, panel.y);

  if (dissolveProgress >= 1) {
    dissolveActive = false;
    return true; // done
  }
  return false; // still going
}

export function isDissolveActive() {
  return dissolveActive;
}
