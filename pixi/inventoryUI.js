// PixiJS inventory bar

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT,
  INVENTORY_SLOT_SIZE, INVENTORY_PADDING, COLORS,
} from '../shared/constants.js';
import { gameState, gameEvents, selectItem } from '../shared/gameState.js';
import { drawInventoryItemPixi } from './renderer.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;
const TOTAL_SLOTS = 5;
const TOTAL_WIDTH = TOTAL_SLOTS * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING) - INVENTORY_PADDING;
const START_X = (CANVAS_WIDTH - TOTAL_WIDTH) / 2;
const SLOT_Y = SCENE_H + (INVENTORY_HEIGHT - INVENTORY_SLOT_SIZE) / 2;

let inventoryContainer = null;
let slots = [];
let itemIcons = [];
let selectedLabel = null;
let hintText = null;

export function buildInventoryUI(app) {
  inventoryContainer = new PIXI.Container();

  // Background bar
  const bg = new PIXI.Graphics();
  bg.rect(0, SCENE_H, CANVAS_WIDTH, INVENTORY_HEIGHT);
  bg.fill(0x1a1a2e);
  bg.moveTo(0, SCENE_H);
  bg.lineTo(CANVAS_WIDTH, SCENE_H);
  bg.stroke({ width: 2, color: 0x3a3a5c });
  inventoryContainer.addChild(bg);

  // Label
  const label = new PIXI.Text({ text: 'INVENTORY', style: { fontFamily: 'monospace', fontSize: 11, fill: 0xffffff } });
  label.alpha = 0.3;
  label.x = START_X;
  label.y = SCENE_H + 3;
  inventoryContainer.addChild(label);

  // Selected item label
  selectedLabel = new PIXI.Text({ text: '', style: { fontFamily: 'monospace', fontSize: 12, fill: 0xff8c00 } });
  selectedLabel.x = START_X + TOTAL_WIDTH;
  selectedLabel.anchor.set(1, 0);
  selectedLabel.y = SCENE_H + 3;
  inventoryContainer.addChild(selectedLabel);

  // Slots
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const sx = START_X + i * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING);
    const slot = new PIXI.Graphics();
    slot.rect(sx, SLOT_Y, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);
    slot.fill(0x2a2a4e);
    slot.stroke({ width: 1, color: 0x3a3a5c });
    slot.eventMode = 'static';
    slot.hitArea = new PIXI.Rectangle(sx, SLOT_Y, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);
    slot.cursor = 'pointer';
    const slotIndex = i;
    slot.on('pointerdown', () => {
      if (slotIndex < gameState.inventory.length) {
        selectItem(gameState.inventory[slotIndex]);
      }
    });
    inventoryContainer.addChild(slot);
    slots.push(slot);
  }

  // Hint text
  hintText = new PIXI.Text({ text: '', style: { fontFamily: 'monospace', fontSize: 16, fill: 0xffdd57 } });
  hintText.anchor.set(0.5, 0);
  hintText.x = CANVAS_WIDTH / 2;
  hintText.y = SCENE_H - 30;
  hintText.alpha = 0;
  inventoryContainer.addChild(hintText);

  app.stage.addChild(inventoryContainer);

  // Event listeners
  gameEvents.on('inventoryChanged', () => refreshInventory());
  gameEvents.on('hintChanged', (text) => {
    hintText.text = text;
    hintText.alpha = text ? 1 : 0;
  });

  refreshInventory();
}

function refreshInventory() {
  // Remove old item icons
  for (const icon of itemIcons) {
    inventoryContainer.removeChild(icon);
    icon.destroy();
  }
  itemIcons = [];

  // Re-draw slots and add items
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const sx = START_X + i * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING);
    const hasItem = i < gameState.inventory.length;
    const itemId = hasItem ? gameState.inventory[i] : null;
    const isSelected = hasItem && gameState.selectedItem === itemId;

    // Redraw slot
    slots[i].clear();
    slots[i].rect(sx, SLOT_Y, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);
    slots[i].fill(0x2a2a4e);
    if (isSelected) {
      slots[i].rect(sx - 1, SLOT_Y - 1, INVENTORY_SLOT_SIZE + 2, INVENTORY_SLOT_SIZE + 2);
      slots[i].stroke({ width: 3, color: 0xff8c00 });
    } else {
      slots[i].rect(sx, SLOT_Y, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE);
      slots[i].stroke({ width: 1, color: 0x3a3a5c });
    }

    // Item icon
    if (hasItem) {
      const icon = drawInventoryItemPixi(itemId);
      icon.x = sx + 8;
      icon.y = SLOT_Y + 8;
      inventoryContainer.addChild(icon);
      itemIcons.push(icon);
    }
  }

  // Update selected label
  if (gameState.selectedItem) {
    const labels = { beaker: 'Empty Beaker', acid: 'Acid Beaker', key: 'Lab Key' };
    selectedLabel.text = `Selected: ${labels[gameState.selectedItem] || ''}`;
  } else {
    selectedLabel.text = '';
  }
}
