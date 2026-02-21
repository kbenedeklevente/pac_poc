// Vanilla Canvas inventory bar rendering

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT,
  INVENTORY_SLOT_SIZE, INVENTORY_PADDING, COLORS,
} from '../shared/constants.js';
import { gameState } from '../shared/gameState.js';
import { drawInventoryItem } from './renderer.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

export function renderInventory(ctx) {
  // Background bar
  ctx.fillStyle = COLORS.inventoryBg;
  ctx.fillRect(0, SCENE_H, CANVAS_WIDTH, INVENTORY_HEIGHT);
  ctx.strokeStyle = COLORS.inventoryBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, SCENE_H);
  ctx.lineTo(CANVAS_WIDTH, SCENE_H);
  ctx.stroke();

  // Slots
  const totalSlots = 5;
  const totalWidth = totalSlots * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING) - INVENTORY_PADDING;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  const slotY = SCENE_H + (INVENTORY_HEIGHT - INVENTORY_SLOT_SIZE) / 2;

  for (let i = 0; i < totalSlots; i++) {
    const sx = startX + i * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING);
    const hasItem = i < gameState.inventory.length;
    const itemId = hasItem ? gameState.inventory[i] : null;
    const isSelected = hasItem && gameState.selectedItem === itemId;

    // Slot background
    ctx.fillStyle = COLORS.inventorySlot;
    ctx.fillRect(sx, slotY, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);

    // Selection border
    if (isSelected) {
      ctx.strokeStyle = COLORS.inventorySelected;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 1, slotY - 1, INVENTORY_SLOT_SIZE + 2, INVENTORY_SLOT_SIZE + 2);
    } else {
      ctx.strokeStyle = COLORS.inventoryBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, slotY, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);
    }

    // Draw item icon
    if (hasItem) {
      drawInventoryItem(ctx, itemId, sx, slotY, INVENTORY_SLOT_SIZE);
    }
  }

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('INVENTORY', startX, SCENE_H + 12);

  // Selected item label
  if (gameState.selectedItem) {
    ctx.fillStyle = COLORS.inventorySelected;
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const label = gameState.selectedItem === 'beaker' ? 'Empty Beaker'
      : gameState.selectedItem === 'acid' ? 'Acid Beaker'
      : gameState.selectedItem === 'key' ? 'Lab Key' : '';
    ctx.fillText(`Selected: ${label}`, startX + totalWidth, SCENE_H + 12);
  }
}

// Hint text overlay
let hintAlpha = 0;
let hintMessage = '';

export function setHint(text) {
  hintMessage = text;
  hintAlpha = text ? 1 : 0;
}

export function renderHint(ctx, dt) {
  if (hintAlpha <= 0) return;

  ctx.fillStyle = COLORS.hintText;
  ctx.globalAlpha = hintAlpha;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(hintMessage, CANVAS_WIDTH / 2, SCENE_H - 20);
  ctx.globalAlpha = 1;

  // Fade out
  if (hintMessage === gameState.hintText && gameState.hintText === '') {
    hintAlpha -= dt * 0.8;
  }
}
