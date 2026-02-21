// PixiJS — PIXI.Application init
// Retained scene graph, filters, per-object hit testing

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';
import { gameState, gameEvents, resetGame } from '../shared/gameState.js';
import { handleObjectClick } from '../shared/puzzleEngine.js';
import { buildSceneGraph, switchRoom, updateVisibility } from './renderer.js';
import { setupAnimations, startPanelDissolve, clearAllParticles } from './animations.js';
import { setupInput } from './input.js';
import { buildInventoryUI } from './inventoryUI.js';

async function init() {
  const app = new PIXI.Application();
  await app.init({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: 0x0a0a15,
    canvas: document.getElementById('game'),
  });

  // Build scene
  buildSceneGraph(app);
  setupAnimations(app);
  setupInput(app);
  buildInventoryUI(app);

  // ─── Event wiring ───
  gameEvents.on('roomChanged', (room) => {
    switchRoom(room);
    clearAllParticles();
    updateVisibility();
  });

  gameEvents.on('puzzleAdvanced', () => {
    updateVisibility();
  });

  gameEvents.on('itemPickedUp', () => {
    updateVisibility();
  });

  gameEvents.on('animationRequested', (animId) => {
    if (animId === 'dissolvePanel') {
      startPanelDissolve(app);
    }
    if (animId === 'fillBeaker') {
      gameEvents.emit('animationCompleted', 'fillBeaker');
    }
    if (animId === 'openDoor') {
      setTimeout(() => {
        gameEvents.emit('animationCompleted', 'openDoor');
      }, 500);
    }
  });

  gameEvents.on('gameWon', () => {
    showWin(app);
  });
}

function showWin(app) {
  const winContainer = new PIXI.Container();

  const bg = new PIXI.Graphics();
  bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bg.fill(0x0a0a15);
  winContainer.addChild(bg);

  const title = new PIXI.Text({ text: 'ESCAPED!', style: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: 'bold',
    fill: 0x57cc99,
  }});
  title.anchor.set(0.5);
  title.x = CANVAS_WIDTH / 2;
  title.y = CANVAS_HEIGHT / 2 - 30;
  winContainer.addChild(title);

  const sub = new PIXI.Text({ text: 'You escaped the abandoned lab.', style: {
    fontFamily: 'monospace',
    fontSize: 18,
    fill: 0xffffff,
  }});
  sub.alpha = 0.6;
  sub.anchor.set(0.5);
  sub.x = CANVAS_WIDTH / 2;
  sub.y = CANVAS_HEIGHT / 2 + 20;
  winContainer.addChild(sub);

  const restart = new PIXI.Text({ text: 'Click to play again', style: {
    fontFamily: 'monospace',
    fontSize: 14,
    fill: 0xffffff,
  }});
  restart.alpha = 0.5;
  restart.anchor.set(0.5);
  restart.x = CANVAS_WIDTH / 2;
  restart.y = CANVAS_HEIGHT / 2 + 70;
  winContainer.addChild(restart);

  // Glow effect
  const glow = new PIXI.Graphics();
  glow.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 150);
  glow.fill({ color: 0x57cc99, alpha: 0.15 });
  const blurFilter = new PIXI.BlurFilter({ strength: 30 });
  glow.filters = [blurFilter];
  winContainer.addChildAt(glow, 1);

  // Pulse animation (store ref for cleanup)
  const pulseTicker = () => {
    const t = performance.now() / 1000;
    const pulse = (Math.sin(t * 2) + 1) / 2;
    restart.alpha = 0.4 + pulse * 0.3;
    glow.alpha = 0.5 + pulse * 0.3;
  };
  app.ticker.add(pulseTicker);

  winContainer.eventMode = 'static';
  winContainer.on('pointerdown', () => {
    app.ticker.remove(pulseTicker);
    app.stage.removeChild(winContainer);
    winContainer.destroy({ children: true });
    resetGame();
    switchRoom(0);
    updateVisibility();
    clearAllParticles();
  });

  app.stage.addChild(winContainer);
}

init();
