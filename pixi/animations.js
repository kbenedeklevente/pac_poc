// PixiJS animations — Filters (Blur, Displacement), ParticleContainer
// Hero: DisplacementFilter for melting panel effect

import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT } from '../shared/constants.js';
import { gameState, gameEvents } from '../shared/gameState.js';
import { getObjectGraphic, roomContainers } from './renderer.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

// ─── Particle pools ───
const drips = [];
const sparks = [];
const bubbles = [];

let dripContainer = null;
let sparkContainer = null;
let bubbleContainer = null;

// ─── Ambient effect containers ───
let lightGlow = null;
let emergencyGlow = null;

export function setupAnimations(app) {
  const sceneContainer = app.stage.children[0];

  // Drip particles (room 1)
  dripContainer = new PIXI.Container();
  sparkContainer = new PIXI.Container();
  bubbleContainer = new PIXI.Container();

  // Add particle containers to each room
  roomContainers[1]?.addChild(dripContainer);
  roomContainers[1]?.addChild(sparkContainer);
  roomContainers[1]?.addChild(bubbleContainer);

  // Light glow for storage room
  lightGlow = new PIXI.Graphics();
  lightGlow.circle(480, 130, 200);
  lightGlow.fill({ color: 0xfffacd, alpha: 0.1 });
  const blurFilter = new PIXI.BlurFilter({ strength: 30 });
  lightGlow.filters = [blurFilter];
  roomContainers[0]?.addChild(lightGlow);

  // Emergency glow for corridor
  emergencyGlow = new PIXI.Graphics();
  emergencyGlow.circle(500, 60, 150);
  emergencyGlow.fill({ color: 0xff4444, alpha: 0.15 });
  const emergencyBlur = new PIXI.BlurFilter({ strength: 25 });
  emergencyGlow.filters = [emergencyBlur];
  roomContainers[2]?.addChild(emergencyGlow);

  // Ticker for animation updates
  app.ticker.add((ticker) => {
    const time = performance.now() / 1000;
    const dt = ticker.deltaTime / 60;
    updateParticles(time, dt);
    updateAmbientEffects(time);
    updateDissolve(dt);
  });
}

function updateParticles(time, dt) {
  // Only spawn particles in visible rooms
  if (gameState.currentRoom === 1) {
    // Drips
    if (Math.random() < 0.15) {
      const circle = new PIXI.Graphics();
      circle.circle(0, 0, 2 + Math.random() * 2);
      circle.fill(0x57cc99);
      circle.x = 185 + Math.random() * 10;
      circle.y = 220;
      circle.alpha = 1;
      dripContainer.addChild(circle);
      drips.push({ g: circle, vy: 0.5 + Math.random() * 1, life: 1 });
    }

    // Sparks
    if (Math.random() < 0.05) {
      const circle = new PIXI.Graphics();
      circle.circle(0, 0, 1 + Math.random() * 2);
      circle.fill(0xffdd57);
      circle.x = 780 + (Math.random() - 0.5) * 20;
      circle.y = 160 + (Math.random() - 0.5) * 20;
      circle.alpha = 1;
      sparkContainer.addChild(circle);
      sparks.push({
        g: circle,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 3,
        life: 1,
      });
    }

    // Bubbles
    if (Math.random() < 0.05) {
      const circle = new PIXI.Graphics();
      circle.circle(0, 0, 1 + Math.random() * 2);
      circle.stroke({ width: 1, color: 0xc77dff });
      const baseObj = Math.random() < 0.5 ? { x: 375, y: 345 } : { x: 432, y: 348 };
      circle.x = baseObj.x + (Math.random() - 0.5) * 8;
      circle.y = baseObj.y;
      circle.alpha = 0.6;
      bubbleContainer.addChild(circle);
      bubbles.push({ g: circle, vy: -0.3 - Math.random() * 0.5, life: 1, startX: circle.x, time });
    }
  }

  // Update drips
  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i];
    d.g.y += d.vy;
    d.life -= dt * 0.8;
    d.g.alpha = d.life;
    if (d.life <= 0 || d.g.y > SCENE_H - 80) {
      dripContainer.removeChild(d.g);
      d.g.destroy();
      drips.splice(i, 1);
    }
  }

  // Update sparks
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.g.x += s.vx;
    s.g.y += s.vy;
    s.vy += 0.15;
    s.life -= dt * 2;
    s.g.alpha = s.life;
    if (s.life <= 0) {
      sparkContainer.removeChild(s.g);
      s.g.destroy();
      sparks.splice(i, 1);
    }
  }

  // Update bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.g.y += b.vy;
    b.g.x = b.startX + Math.sin(time * 5 + i) * 3;
    b.life -= dt * 0.6;
    b.g.alpha = b.life * 0.6;
    if (b.life <= 0) {
      bubbleContainer.removeChild(b.g);
      b.g.destroy();
      bubbles.splice(i, 1);
    }
  }
}

function updateAmbientEffects(time) {
  // Flickering light in storage
  if (lightGlow) {
    const flicker = Math.sin(time * 8) * 0.2 + Math.sin(time * 13) * 0.1 + 0.6;
    lightGlow.alpha = flicker > 0.4 ? flicker * 0.4 : 0;
  }

  // Pulsing emergency light
  if (emergencyGlow) {
    const pulse = (Math.sin(time * 3) + 1) / 2;
    emergencyGlow.alpha = 0.1 + pulse * 0.3;
  }
}

// ─── Panel dissolve with DisplacementFilter ───
let dissolveActive = false;
let dissolveProgress = 0;
let dissolveSprite = null;
let displacementFilter = null;

export function startPanelDissolve(app) {
  const panelGraphic = getObjectGraphic('panel');
  if (!panelGraphic) return;

  dissolveActive = true;
  dissolveProgress = 0;

  // Create displacement texture (noise-like)
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nctx = noiseCanvas.getContext('2d');
  const imgData = nctx.createImageData(128, 128);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255;
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  nctx.putImageData(imgData, 0, 0);

  const texture = PIXI.Texture.from(noiseCanvas);
  dissolveSprite = new PIXI.Sprite(texture);
  try { dissolveSprite.texture.source.style.addressMode = 'repeat'; } catch(e) { /* v8 compat */ }

  displacementFilter = new PIXI.DisplacementFilter({ sprite: dissolveSprite, scale: 0 });
  panelGraphic.filters = [displacementFilter];
}

function updateDissolve(dt) {
  if (!dissolveActive) return;

  dissolveProgress += dt * 0.4;

  if (displacementFilter) {
    // Ramp up displacement to "melt" the panel
    displacementFilter.scale.x = dissolveProgress * 80;
    displacementFilter.scale.y = dissolveProgress * 60;
  }

  const panelGraphic = getObjectGraphic('panel');
  if (panelGraphic) {
    panelGraphic.alpha = Math.max(0, 1 - dissolveProgress);
  }

  if (dissolveProgress >= 1) {
    dissolveActive = false;
    if (panelGraphic) {
      panelGraphic.filters = [];
    }
    gameEvents.emit('animationCompleted', 'dissolvePanel');
  }
}

export function clearAllParticles() {
  for (const d of drips) { dripContainer?.removeChild(d.g); d.g.destroy(); }
  for (const s of sparks) { sparkContainer?.removeChild(s.g); s.g.destroy(); }
  for (const b of bubbles) { bubbleContainer?.removeChild(b.g); b.g.destroy(); }
  drips.length = 0;
  sparks.length = 0;
  bubbles.length = 0;
}
