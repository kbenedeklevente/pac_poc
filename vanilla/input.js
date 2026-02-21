// Vanilla Canvas input — manual hit-testing + keyboard navigation

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, NAV_ZONE_WIDTH, INVENTORY_SLOT_SIZE, INVENTORY_PADDING } from '../shared/constants.js';
import { gameState, gameEvents, navigateRoom, selectItem } from '../shared/gameState.js';
import { getVisibleObjects } from '../shared/roomData.js';
import { handleObjectClick } from '../shared/puzzleEngine.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

let hoverArrow = null; // 'left' | 'right' | null
let canvas = null;

export function setupInput(canvasEl) {
  canvas = canvasEl;

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function onMouseMove(e) {
  const pos = getCanvasPos(e);
  // Check nav zones (only in scene area)
  if (pos.y < SCENE_H) {
    if (pos.x < NAV_ZONE_WIDTH && gameState.currentRoom > 0) {
      hoverArrow = 'left';
      canvas.style.cursor = 'pointer';
      return;
    }
    if (pos.x > CANVAS_WIDTH - NAV_ZONE_WIDTH && gameState.currentRoom < 2) {
      hoverArrow = 'right';
      canvas.style.cursor = 'pointer';
      return;
    }
  }
  hoverArrow = null;

  // Check interactive objects
  const objects = getVisibleObjects(gameState.currentRoom, gameState);
  for (const obj of objects) {
    if (obj.type === 'decor' || obj.type === 'decor_animated') continue;
    if (hitTest(pos, obj)) {
      canvas.style.cursor = 'pointer';
      return;
    }
  }

  // Check inventory slots
  if (pos.y >= SCENE_H) {
    const slotIdx = getInventorySlotIndex(pos);
    if (slotIdx !== -1 && slotIdx < gameState.inventory.length) {
      canvas.style.cursor = 'pointer';
      return;
    }
  }

  canvas.style.cursor = 'default';
}

function onClick(e) {
  const pos = getCanvasPos(e);

  // Nav zone clicks
  if (pos.y < SCENE_H) {
    if (pos.x < NAV_ZONE_WIDTH && gameState.currentRoom > 0) {
      navigateRoom(-1);
      return;
    }
    if (pos.x > CANVAS_WIDTH - NAV_ZONE_WIDTH && gameState.currentRoom < 2) {
      navigateRoom(1);
      return;
    }
  }

  // Inventory clicks
  if (pos.y >= SCENE_H) {
    const slotIdx = getInventorySlotIndex(pos);
    if (slotIdx !== -1 && slotIdx < gameState.inventory.length) {
      selectItem(gameState.inventory[slotIdx]);
    }
    return;
  }

  // Object clicks (reverse order for top-most first)
  const objects = getVisibleObjects(gameState.currentRoom, gameState);
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (obj.type === 'decor' || obj.type === 'decor_animated') continue;
    if (hitTest(pos, obj)) {
      handleObjectClick(obj.id);
      return;
    }
  }
}

function onKeyDown(e) {
  if (e.key === 'ArrowLeft') {
    navigateRoom(-1);
  } else if (e.key === 'ArrowRight') {
    navigateRoom(1);
  }
}

function hitTest(pos, obj) {
  return pos.x >= obj.x && pos.x <= obj.x + obj.w
      && pos.y >= obj.y && pos.y <= obj.y + obj.h;
}

function getInventorySlotIndex(pos) {
  const totalSlots = 5;
  const totalWidth = totalSlots * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING) - INVENTORY_PADDING;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  const slotY = SCENE_H + (INVENTORY_HEIGHT - INVENTORY_SLOT_SIZE) / 2;

  for (let i = 0; i < totalSlots; i++) {
    const sx = startX + i * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING);
    if (pos.x >= sx && pos.x <= sx + INVENTORY_SLOT_SIZE
      && pos.y >= slotY && pos.y <= slotY + INVENTORY_SLOT_SIZE) {
      return i;
    }
  }
  return -1;
}

export function getHoverArrow() {
  return hoverArrow;
}
