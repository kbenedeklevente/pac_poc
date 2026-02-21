// PixiJS input — eventMode='static' on display objects + keyboard

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, NAV_ZONE_WIDTH } from '../shared/constants.js';
import { gameState, gameEvents, navigateRoom } from '../shared/gameState.js';
import { handleObjectClick } from '../shared/puzzleEngine.js';
import { getObjectGraphic } from './renderer.js';
import { rooms } from '../shared/roomData.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

export function setupInput(app) {
  // Wire up clickable objects via PixiJS event system
  for (const room of rooms) {
    for (const obj of room.objects) {
      if (obj.type !== 'pickup' && obj.type !== 'interactive') continue;
      const g = getObjectGraphic(obj.id);
      if (!g) continue;

      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', () => {
        handleObjectClick(obj.id);
      });
    }
  }

  // Navigation zones — overlay graphics
  const s = 24;

  const leftNav = new PIXI.Graphics();
  leftNav.rect(0, 0, NAV_ZONE_WIDTH, SCENE_H);
  leftNav.fill({ color: 0x000000, alpha: 0.01 });
  leftNav.eventMode = 'static';
  leftNav.cursor = 'pointer';
  leftNav.on('pointerdown', () => navigateRoom(-1));

  // Left arrow — flush to edge
  const leftArrow = new PIXI.Graphics();
  leftArrow.moveTo(12, SCENE_H / 2);
  leftArrow.lineTo(12 + s, SCENE_H / 2 - s);
  leftArrow.lineTo(12 + s, SCENE_H / 2 + s);
  leftArrow.closePath();
  leftArrow.fill({ color: 0xffffff, alpha: 0.3 });
  leftArrow.eventMode = 'none';
  leftNav.addChild(leftArrow);

  leftNav.on('pointerover', () => { leftArrow.alpha = 1; });
  leftNav.on('pointerout', () => { leftArrow.alpha = 0.6; });

  const rightNav = new PIXI.Graphics();
  rightNav.rect(CANVAS_WIDTH - NAV_ZONE_WIDTH, 0, NAV_ZONE_WIDTH, SCENE_H);
  rightNav.fill({ color: 0x000000, alpha: 0.01 });
  rightNav.eventMode = 'static';
  rightNav.cursor = 'pointer';
  rightNav.on('pointerdown', () => navigateRoom(1));

  // Right arrow — flush to edge
  const rightArrow = new PIXI.Graphics();
  rightArrow.moveTo(CANVAS_WIDTH - 12, SCENE_H / 2);
  rightArrow.lineTo(CANVAS_WIDTH - 12 - s, SCENE_H / 2 - s);
  rightArrow.lineTo(CANVAS_WIDTH - 12 - s, SCENE_H / 2 + s);
  rightArrow.closePath();
  rightArrow.fill({ color: 0xffffff, alpha: 0.3 });
  rightArrow.eventMode = 'none';
  rightNav.addChild(rightArrow);

  rightNav.on('pointerover', () => { rightArrow.alpha = 1; });
  rightNav.on('pointerout', () => { rightArrow.alpha = 0.6; });

  app.stage.addChild(leftNav);
  app.stage.addChild(rightNav);

  // Show/hide nav zones based on current room
  function updateNavVisibility() {
    leftNav.visible = gameState.currentRoom > 0;
    rightNav.visible = gameState.currentRoom < 2;
  }
  updateNavVisibility();
  gameEvents.on('roomChanged', updateNavVisibility);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigateRoom(-1);
    if (e.key === 'ArrowRight') navigateRoom(1);
  });
}
