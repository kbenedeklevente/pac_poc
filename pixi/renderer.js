// PixiJS renderer — retained scene graph with PIXI.Graphics/Container
// Hero feature: DisplacementFilter for melting panel, BlurFilter for glow

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, COLORS, PHASES } from '../shared/constants.js';
import { rooms, getVisibleObjects } from '../shared/roomData.js';
import { gameState } from '../shared/gameState.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

// Pre-built room containers (build once, show/hide)
export const roomContainers = [];
const objectGraphics = {};

export function buildSceneGraph(app) {
  const stage = app.stage;

  // Scene container (clipped to scene area)
  const sceneContainer = new PIXI.Container();
  stage.addChild(sceneContainer);

  for (let r = 0; r < rooms.length; r++) {
    const room = rooms[r];
    const container = new PIXI.Container();
    container.visible = r === 0;
    sceneContainer.addChild(container);
    roomContainers.push(container);

    // Background
    drawBackground(container, room.bg.type);

    // Room name label
    const nameText = new PIXI.Text({ text: room.name, style: { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff, } });
    nameText.alpha = 0.15;
    nameText.x = 90;
    nameText.y = 10;
    container.addChild(nameText);

    // Objects
    for (const obj of room.objects) {
      const g = drawObject(obj);
      if (g) {
        container.addChild(g);
        objectGraphics[obj.id] = g;
      }
    }
  }

  return sceneContainer;
}

function drawBackground(container, type) {
  const bg = new PIXI.Graphics();

  if (type === 'storage') {
    bg.rect(0, 0, CANVAS_WIDTH, SCENE_H);
    bg.fill(0x1a1a2e);
    bg.rect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
    bg.fill(0x2a2a3e);
    bg.rect(0, SCENE_H - 80, CANVAS_WIDTH, 2);
    bg.fill(0x3a3a5c);
  } else if (type === 'lab') {
    bg.rect(0, 0, CANVAS_WIDTH, SCENE_H);
    bg.fill(0x0f3460);
    bg.rect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
    bg.fill(0x1e1e3a);
    // Floor tiles
    for (let x = 0; x < CANVAS_WIDTH; x += 60) {
      bg.rect(x, SCENE_H - 80, 60, 80);
      bg.stroke({ width: 1, color: 0x2a2a4e });
    }
  } else if (type === 'corridor') {
    bg.rect(0, 0, CANVAS_WIDTH, SCENE_H);
    bg.fill(0x1b1b2f);
    bg.rect(0, SCENE_H - 80, CANVAS_WIDTH, 80);
    bg.fill(0x222240);
    bg.rect(0, SCENE_H - 80, CANVAS_WIDTH, 2);
    bg.fill(0x333355);
  }

  container.addChild(bg);
}

function drawObject(obj) {
  const g = new PIXI.Graphics();

  switch (obj.id) {
    case 'shelf_left':
    case 'shelf_right':
      drawShelf(g, obj);
      break;
    case 'beaker':
      drawBeaker(g, obj);
      break;
    case 'box1': case 'box2': case 'box3':
      drawBox(g, obj);
      break;
    case 'bench':
      drawBench(g, obj);
      break;
    case 'pipe':
      drawPipe(g, obj);
      break;
    case 'pipe_warning':
      drawPipeWarning(g, obj);
      break;
    case 'panel':
      drawPanel(g, obj);
      break;
    case 'panel_dissolved':
      drawPanelDissolved(g, obj);
      break;
    case 'key':
      drawKey(g, obj);
      break;
    case 'door':
      drawDoor(g, obj);
      break;
    case 'warning_sign':
      drawWarningSign(g, obj);
      break;
    case 'vials': case 'vials2':
      drawVial(g, obj);
      break;
    case 'light_storage':
      drawLightFixture(g, obj);
      break;
    case 'wire':
      drawWireBase(g, obj);
      break;
    case 'emergency_light':
      drawEmergencyBase(g, obj);
      break;
    default:
      return null;
  }

  // Interactive objects get hit area
  if (obj.type === 'pickup' || obj.type === 'interactive') {
    g.eventMode = 'static';
    g.cursor = 'pointer';
    g.hitArea = new PIXI.Rectangle(obj.x, obj.y, obj.w, obj.h);
  }

  return g;
}

function drawShelf(g, obj) {
  g.rect(obj.x, obj.y, 8, obj.h);
  g.fill(0x3a3a3a);
  g.rect(obj.x + obj.w - 8, obj.y, 8, obj.h);
  g.fill(0x3a3a3a);
  for (let i = 0; i < 4; i++) {
    g.rect(obj.x, obj.y + i * (obj.h / 3), obj.w, 6);
    g.fill(0x5c5c5c);
  }
}

function drawBeaker(g, obj) {
  // Erlenmeyer flask shape
  const w = obj.w, h = obj.h, x = obj.x, y = obj.y;
  g.moveTo(x + w * 0.25, y);
  g.lineTo(x + w * 0.3, y + h * 0.25);
  g.quadraticCurveTo(x, y + h * 0.5, x + 2, y + h);
  g.lineTo(x + w - 2, y + h);
  g.quadraticCurveTo(x + w, y + h * 0.5, x + w * 0.7, y + h * 0.25);
  g.lineTo(x + w * 0.75, y);
  g.closePath();
  g.fill({ color: 0xa8d8ea, alpha: 0.85 });
  g.stroke({ width: 2, color: 0x88b8ca });
}

function drawBox(g, obj) {
  g.rect(obj.x, obj.y, obj.w, obj.h);
  g.fill(0x8b6914);
  g.rect(obj.x, obj.y, obj.w, 6);
  g.fill(0x6b4f10);
  g.rect(obj.x, obj.y, obj.w, obj.h);
  g.stroke({ width: 1, color: 0x5a3e0e });
}

function drawBench(g, obj) {
  g.rect(obj.x, obj.y, obj.w, 12);
  g.fill(0x78909c);
  g.rect(obj.x + 10, obj.y + 12, 10, obj.h - 12);
  g.fill(0x5c5c5c);
  g.rect(obj.x + obj.w - 20, obj.y + 12, 10, obj.h - 12);
  g.fill(0x5c5c5c);
  g.rect(obj.x + 10, obj.y + obj.h - 15, obj.w - 20, 6);
  g.fill(0x5c5c5c);
}

function drawPipe(g, obj) {
  g.rect(obj.x + 15, obj.y, 30, obj.h);
  g.fill(0x6b705c);
  g.rect(obj.x + 10, obj.y, 40, 10);
  g.fill(0x555555);
  g.rect(obj.x + 10, obj.y + obj.h * 0.6, 40, 10);
  g.fill(0x555555);
  // Green corrosive leak
  g.rect(obj.x + 10, obj.y + obj.h * 0.6 + 10, 40, 5);
  g.fill({ color: 0x57cc99, alpha: 0.4 });
  g.circle(obj.x + 30, obj.y + obj.h + 10, 15);
  g.fill({ color: 0x57cc99, alpha: 0.2 });
}

function drawPipeWarning(g, obj) {
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + 22;
  // Yellow diamond
  const s = 14;
  g.moveTo(cx, cy - s);
  g.lineTo(cx + s, cy);
  g.lineTo(cx, cy + s);
  g.lineTo(cx - s, cy);
  g.closePath();
  g.fill(0xffbe0b);
  // Skull head
  g.circle(cx, cy - 2, 7);
  g.fill(0x1a1a2e);
  // Eyes
  g.circle(cx - 3, cy - 3, 1.5);
  g.circle(cx + 3, cy - 3, 1.5);
  g.fill(0xffbe0b);
  // Jaw
  g.rect(cx - 4, cy + 3, 8, 3);
  g.fill(0x1a1a2e);
  // Teeth
  g.rect(cx - 3, cy + 3, 2, 3);
  g.rect(cx + 1, cy + 3, 2, 3);
  g.fill(0xffbe0b);
  // Crossbones
  g.moveTo(cx - 10, cy + 12);
  g.lineTo(cx + 10, cy + 24);
  g.moveTo(cx + 10, cy + 12);
  g.lineTo(cx - 10, cy + 24);
  g.stroke({ width: 2, color: 0x1a1a2e });
}

function drawPanel(g, obj) {
  g.rect(obj.x, obj.y, obj.w, obj.h);
  g.fill(0xbf6b3a);
  // Corrosion spots
  for (let i = 0; i < 6; i++) {
    const cx = obj.x + 15 + Math.sin(i * 2.3) * 30 + 20;
    const cy = obj.y + 15 + Math.cos(i * 1.7) * 40 + 20;
    g.circle(cx, cy, 8 + (i % 3) * 4);
    g.fill({ color: 0x64321e, alpha: 0.5 });
  }
  // Bolts
  const bolts = [[10,10],[obj.w-10,10],[10,obj.h-10],[obj.w-10,obj.h-10]];
  for (const [bx, by] of bolts) {
    g.circle(obj.x + bx, obj.y + by, 4);
    g.fill(0x888888);
  }
}

function drawPanelDissolved(g, obj) {
  g.rect(obj.x + 5, obj.y + 5, obj.w - 10, obj.h - 10);
  g.fill(0x0a0a15);
}

function drawKey(g, obj) {
  g.circle(obj.x + 12, obj.y + 15, 10);
  g.fill(0xffd166);
  g.circle(obj.x + 12, obj.y + 15, 4);
  g.fill(0x0a0a15);
  g.rect(obj.x + 12, obj.y + 10, obj.w - 14, 6);
  g.fill(0xffd166);
  g.rect(obj.x + obj.w - 8, obj.y + 10, 4, 12);
  g.fill(0xffd166);
  g.rect(obj.x + obj.w - 16, obj.y + 10, 4, 10);
  g.fill(0xffd166);
}

function drawDoor(g, obj) {
  g.rect(obj.x - 10, obj.y - 10, obj.w + 20, obj.h + 10);
  g.fill(0x22223b);
  g.rect(obj.x, obj.y, obj.w, obj.h);
  g.fill(0x4a4e69);
  g.rect(obj.x + 15, obj.y + 20, obj.w - 30, obj.h * 0.35);
  g.stroke({ width: 2, color: 0x3a3a5e });
  g.rect(obj.x + 15, obj.y + obj.h * 0.45, obj.w - 30, obj.h * 0.35);
  g.stroke({ width: 2, color: 0x3a3a5e });
  g.circle(obj.x + obj.w - 30, obj.y + obj.h * 0.5, 8);
  g.fill(0xaaaaaa);
}

function drawWarningSign(g, obj) {
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + obj.h / 2;
  const s = obj.w * 0.4;
  g.moveTo(cx, cy - s);
  g.lineTo(cx + s, cy);
  g.lineTo(cx, cy + s);
  g.lineTo(cx - s, cy);
  g.closePath();
  g.fill(0xffbe0b);
}

function drawVial(g, obj) {
  g.rect(obj.x + 5, obj.y, obj.w - 10, obj.h);
  g.fill({ color: 0xe0aaff, alpha: 0.7 });
  g.rect(obj.x + 7, obj.y + obj.h * 0.4, obj.w - 14, obj.h * 0.55);
  g.fill({ color: 0xc77dff, alpha: 0.7 });
}

function drawLightFixture(g, obj) {
  g.rect(obj.x - 5, obj.y - 5, obj.w + 10, 8);
  g.fill(0x666666);
  g.rect(obj.x, obj.y, obj.w, obj.h);
  g.fill(0xfffacd);
}

function drawWireBase(g, obj) {
  g.moveTo(obj.x + obj.w / 2, obj.y);
  g.lineTo(obj.x + obj.w / 2, obj.y + obj.h);
  g.stroke({ width: 3, color: 0xff6b6b });
}

function drawEmergencyBase(g, obj) {
  g.rect(obj.x - 5, obj.y - 5, obj.w + 10, obj.h + 10);
  g.fill(0x333333);
  g.circle(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.w / 2 - 2);
  g.fill(0xff4444);
}

// ─── Visibility updates ───

export function updateVisibility() {
  for (const room of rooms) {
    for (const obj of room.objects) {
      const g = objectGraphics[obj.id];
      if (!g) continue;
      if (obj.visibleWhen) {
        g.visible = obj.visibleWhen(gameState);
      }
    }
  }
}

export function switchRoom(roomIndex) {
  roomContainers.forEach((c, i) => { c.visible = i === roomIndex; });
}

export function getObjectGraphic(id) {
  return objectGraphics[id];
}

// ─── Inventory item drawing ───

function drawBeakerIconPixi(g, ox, oy, s, hasAcid) {
  // Erlenmeyer flask shape
  g.moveTo(ox + s * 0.25, oy);
  g.lineTo(ox + s * 0.3, oy + s * 0.25);
  g.quadraticCurveTo(ox, oy + s * 0.5, ox + 2, oy + s);
  g.lineTo(ox + s - 2, oy + s);
  g.quadraticCurveTo(ox + s, oy + s * 0.5, ox + s * 0.7, oy + s * 0.25);
  g.lineTo(ox + s * 0.75, oy);
  g.closePath();
  g.fill({ color: 0xa8d8ea, alpha: 0.85 });
  g.stroke({ width: 1.5, color: 0x88b8ca });
  if (hasAcid) {
    g.moveTo(ox + s * 0.15, oy + s * 0.45);
    g.quadraticCurveTo(ox, oy + s * 0.7, ox + 2, oy + s);
    g.lineTo(ox + s - 2, oy + s);
    g.quadraticCurveTo(ox + s, oy + s * 0.7, ox + s * 0.85, oy + s * 0.45);
    g.closePath();
    g.fill({ color: 0x57cc99, alpha: 0.8 });
  }
}

export function drawInventoryItemPixi(itemId) {
  const g = new PIXI.Graphics();
  const size = 44;
  const ox = 0, oy = 0;

  if (itemId === 'beaker') {
    drawBeakerIconPixi(g, ox, oy, size, false);
  } else if (itemId === 'acid') {
    drawBeakerIconPixi(g, ox, oy, size, true);
  } else if (itemId === 'key') {
    g.circle(ox + 10, oy + size / 2, 8);
    g.fill(0xffd166);
    g.circle(ox + 10, oy + size / 2, 3);
    g.fill(0x0a0a15);
    g.rect(ox + 10, oy + size / 2 - 3, size - 12, 5);
    g.fill(0xffd166);
    g.rect(ox + size - 5, oy + size / 2 - 3, 3, 10);
    g.fill(0xffd166);
  }

  return g;
}
