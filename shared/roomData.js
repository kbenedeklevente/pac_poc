// Declarative room and object definitions
// Each object has: id, type, x, y, w, h, visibleWhen(gameState)
// Types: pickup, interactive, decor, decor_animated

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, PHASES } from './constants.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

export const rooms = [
  // ─── Room 0: Storage ───
  {
    id: 0,
    name: 'Storage Room',
    bg: { type: 'storage' },
    objects: [
      // Metal shelving unit — left
      { id: 'shelf_left', type: 'decor', x: 120, y: 160, w: 120, h: 300 },
      // Metal shelving unit — right
      { id: 'shelf_right', type: 'decor', x: 720, y: 180, w: 100, h: 280 },
      // Boxes on floor
      { id: 'box1', type: 'decor', x: 340, y: 420, w: 70, h: 50 },
      { id: 'box2', type: 'decor', x: 380, y: 390, w: 60, h: 50 },
      { id: 'box3', type: 'decor', x: 600, y: 430, w: 80, h: 40 },
      // Flickering overhead light
      { id: 'light_storage', type: 'decor_animated', x: 440, y: 30, w: 80, h: 20, animation: 'flicker' },
      // Beaker on shelf (pickup — only visible in NEED_BEAKER phase)
      {
        id: 'beaker',
        type: 'pickup',
        x: 150, y: 200, w: 40, h: 50,
        visibleWhen: (state) => state.phase === PHASES.NEED_BEAKER,
      },
    ],
  },
  // ─── Room 1: Main Lab ───
  {
    id: 1,
    name: 'Main Lab',
    bg: { type: 'lab' },
    objects: [
      // Lab bench — center
      { id: 'bench', type: 'decor', x: 250, y: 350, w: 460, h: 60 },
      // Bubbling vials on bench
      { id: 'vials', type: 'decor_animated', x: 360, y: 310, w: 30, h: 40, animation: 'bubble' },
      { id: 'vials2', type: 'decor_animated', x: 420, y: 315, w: 25, h: 35, animation: 'bubble' },
      // Sparking wire — upper right
      { id: 'wire', type: 'decor_animated', x: 750, y: 120, w: 60, h: 80, animation: 'spark' },
      // Leaking pipe — upper left
      {
        id: 'pipe',
        type: 'interactive',
        x: 160, y: 100, w: 60, h: 200,
        animation: 'drip',
      },
      // Skull warning sign next to pipe
      { id: 'pipe_warning', type: 'decor', x: 230, y: 170, w: 50, h: 60 },
      // Dark compartment behind panel (always present, drawn first)
      {
        id: 'panel_dissolved',
        type: 'decor',
        x: 650, y: 200, w: 100, h: 120,
      },
      // Key sitting in compartment (always present, drawn under panel)
      // Only clickable when panel is gone — panel intercepts clicks while covering it
      // Hidden after pickup
      {
        id: 'key',
        type: 'pickup',
        x: 680, y: 240, w: 40, h: 30,
        visibleWhen: (state) =>
          state.phase !== PHASES.HAVE_KEY && state.phase !== PHASES.WIN,
      },
      // Corroded panel — drawn ON TOP, hides compartment and key
      {
        id: 'panel',
        type: 'interactive',
        x: 650, y: 200, w: 100, h: 120,
        visibleWhen: (state) =>
          state.phase !== PHASES.PANEL_DISSOLVED
          && state.phase !== PHASES.HAVE_KEY
          && state.phase !== PHASES.WIN,
      },
    ],
  },
  // ─── Room 2: Exit Corridor ───
  {
    id: 2,
    name: 'Exit Corridor',
    bg: { type: 'corridor' },
    objects: [
      // Warning sign
      { id: 'warning_sign', type: 'decor', x: 300, y: 120, w: 100, h: 80 },
      // Emergency light — pulsing red
      { id: 'emergency_light', type: 'decor_animated', x: 480, y: 40, w: 40, h: 40, animation: 'pulse_red' },
      // Locked door
      {
        id: 'door',
        type: 'interactive',
        x: 380, y: 150, w: 200, h: 310,
      },
    ],
  },
];

// Helper: get visible objects for current room and game state
export function getVisibleObjects(roomIndex, state) {
  const room = rooms[roomIndex];
  if (!room) return [];
  return room.objects.filter(obj => !obj.visibleWhen || obj.visibleWhen(state));
}
