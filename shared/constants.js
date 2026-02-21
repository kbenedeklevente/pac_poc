// Canvas and layout constants shared across all engines
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;
export const ROOM_COUNT = 3;

// Navigation zones
export const NAV_ZONE_WIDTH = 80;

// Inventory bar
export const INVENTORY_HEIGHT = 80;
export const INVENTORY_SLOT_SIZE = 60;
export const INVENTORY_PADDING = 10;

// Colors — flat geometric style
export const COLORS = {
  // Room backgrounds
  storageBg: '#1a1a2e',
  storageBgAlt: '#16213e',
  labBg: '#0f3460',
  labBgAlt: '#1a1a2e',
  corridorBg: '#1b1b2f',
  corridorBgAlt: '#162447',

  // Objects
  shelf: '#5c5c5c',
  shelfDark: '#3a3a3a',
  beaker: '#a8d8ea',
  beakerLiquid: '#57cc99',
  pipe: '#6b705c',
  pipeDrip: '#57cc99',
  panel: '#8d6e63',
  panelCorroded: '#bf6b3a',
  key: '#ffd166',
  door: '#4a4e69',
  doorFrame: '#22223b',
  box: '#8b6914',
  boxDark: '#6b4f10',
  labBench: '#5c5c5c',
  labBenchTop: '#78909c',
  vial: '#e0aaff',
  vialLiquid: '#c77dff',
  wire: '#ff6b6b',
  wireSpark: '#ffdd57',
  warningSign: '#ffbe0b',
  warningText: '#1a1a2e',

  // UI
  inventoryBg: '#1a1a2e',
  inventoryBorder: '#3a3a5c',
  inventorySlot: '#2a2a4e',
  inventorySelected: '#ff8c00',
  hintText: '#ffdd57',
  navArrow: 'rgba(255,255,255,0.4)',
  navArrowHover: 'rgba(255,255,255,0.7)',

  // Lights
  overheadLight: '#fffacd',
  emergencyRed: '#ff4444',
  emergencyGlow: 'rgba(255,68,68,0.3)',

  // Acid
  acid: '#57cc99',
  acidBubble: '#80ed99',
};

// Puzzle phases
export const PHASES = {
  NEED_BEAKER: 'NEED_BEAKER',
  NEED_WATER: 'NEED_WATER',
  HAVE_ACID: 'HAVE_ACID',
  PANEL_DISSOLVED: 'PANEL_DISSOLVED',
  HAVE_KEY: 'HAVE_KEY',
  WIN: 'WIN',
};

// Item definitions
export const ITEMS = {
  beaker: { id: 'beaker', label: 'Empty Beaker' },
  acid: { id: 'acid', label: 'Acid Beaker' },
  key: { id: 'key', label: 'Lab Key' },
};
