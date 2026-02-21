// Puzzle state machine — ZERO rendering dependencies
// Uses animation handshake: emits animationRequested, waits for animationCompleted

import { gameState, gameEvents, showHint } from './gameState.js';
import { PHASES, ITEMS } from './constants.js';

// Transition table: { phase, objectId, requiredItem? } → action
const transitions = [
  {
    phase: PHASES.NEED_BEAKER,
    objectId: 'beaker',
    action() {
      gameState.inventory.push('beaker');
      gameState.phase = PHASES.NEED_WATER;
      gameEvents.emit('itemPickedUp', 'beaker');
      gameEvents.emit('inventoryChanged');
      gameEvents.emit('puzzleAdvanced', PHASES.NEED_WATER);
    },
  },
  {
    phase: PHASES.NEED_WATER,
    objectId: 'pipe',
    requiredItem: 'beaker',
    action() {
      // Replace beaker with acid in inventory
      const idx = gameState.inventory.indexOf('beaker');
      if (idx !== -1) gameState.inventory[idx] = 'acid';
      gameState.selectedItem = null;
      gameState.phase = PHASES.HAVE_ACID;
      gameEvents.emit('inventoryChanged');
      gameEvents.emit('puzzleAdvanced', PHASES.HAVE_ACID);
      gameEvents.emit('animationRequested', 'fillBeaker');
    },
  },
  {
    phase: PHASES.HAVE_ACID,
    objectId: 'panel',
    requiredItem: 'acid',
    action() {
      // Remove acid from inventory, start dissolve animation
      gameState.inventory = gameState.inventory.filter(i => i !== 'acid');
      gameState.selectedItem = null;
      gameEvents.emit('inventoryChanged');
      gameEvents.emit('animationRequested', 'dissolvePanel');
      // State mutation happens after animation completes (handshake)
    },
  },
  {
    phase: PHASES.PANEL_DISSOLVED,
    objectId: 'key',
    action() {
      gameState.inventory.push('key');
      gameState.phase = PHASES.HAVE_KEY;
      gameEvents.emit('itemPickedUp', 'key');
      gameEvents.emit('inventoryChanged');
      gameEvents.emit('puzzleAdvanced', PHASES.HAVE_KEY);
    },
  },
  {
    phase: PHASES.HAVE_KEY,
    objectId: 'door',
    requiredItem: 'key',
    action() {
      gameState.inventory = gameState.inventory.filter(i => i !== 'key');
      gameState.selectedItem = null;
      gameState.won = true;
      gameState.phase = PHASES.WIN;
      gameEvents.emit('inventoryChanged');
      gameEvents.emit('animationRequested', 'openDoor');
    },
  },
];

// Hints for wrong interactions
const hints = {
  pipe: {
    [PHASES.NEED_BEAKER]: 'I need something to collect the liquid...',
    [PHASES.HAVE_ACID]: 'I already have what I need from the pipe.',
  },
  panel: {
    [PHASES.NEED_BEAKER]: 'This panel is corroded shut. Maybe acid would help.',
    [PHASES.NEED_WATER]: 'I need something corrosive to dissolve this.',
  },
  door: {
    [PHASES.NEED_BEAKER]: 'The door is locked tight.',
    [PHASES.NEED_WATER]: 'I need to find a key first.',
    [PHASES.HAVE_ACID]: 'I need to find a key first.',
    [PHASES.PANEL_DISSOLVED]: 'I need a key to open this door.',
  },
  beaker: {
    [PHASES.NEED_WATER]: 'I already picked that up.',
  },
};

export function handleObjectClick(objectId) {
  const { phase, selectedItem } = gameState;

  // Find a matching transition
  const transition = transitions.find(
    t => t.phase === phase && t.objectId === objectId
      && (!t.requiredItem || t.requiredItem === selectedItem)
  );

  if (transition) {
    transition.action();
    return true;
  }

  // Check for hint
  const objectHints = hints[objectId];
  if (objectHints) {
    // Check for wrong-item hint
    const wrongItemTransition = transitions.find(
      t => t.objectId === objectId && t.requiredItem && t.requiredItem !== selectedItem && t.phase === phase
    );
    if (wrongItemTransition) {
      showHint(`I need to use the ${ITEMS[wrongItemTransition.requiredItem]?.label || 'right item'} here.`);
      gameEvents.emit('interactionFailed', objectId);
      return false;
    }
    const hint = objectHints[phase];
    if (hint) {
      showHint(hint);
      gameEvents.emit('interactionFailed', objectId);
      return false;
    }
  }

  return false;
}

// Animation handshake — renderer calls this when animation finishes
gameEvents.on('animationCompleted', (animationId) => {
  if (animationId === 'dissolvePanel' && gameState.phase === PHASES.HAVE_ACID) {
    gameState.phase = PHASES.PANEL_DISSOLVED;
    gameEvents.emit('puzzleAdvanced', PHASES.PANEL_DISSOLVED);
  }
  if (animationId === 'openDoor') {
    gameEvents.emit('gameWon');
  }
});
