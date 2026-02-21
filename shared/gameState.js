// Minimal event emitter + reactive game state singleton
// Zero rendering dependencies — engines subscribe to events

class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ||= []).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const list = this._listeners[event];
    if (list) this._listeners[event] = list.filter(f => f !== fn);
  }

  emit(event, ...args) {
    (this._listeners[event] || []).forEach(fn => fn(...args));
  }
}

export const gameEvents = new EventEmitter();

export const gameState = {
  currentRoom: 0,
  phase: 'NEED_BEAKER',
  inventory: [],          // array of item ids
  selectedItem: null,     // currently held item id
  hintText: '',
  hintTimer: null,
  won: false,
};

export function navigateRoom(delta) {
  const next = gameState.currentRoom + delta;
  if (next < 0 || next > 2) return;
  gameState.currentRoom = next;
  gameEvents.emit('roomChanged', next);
}

export function selectItem(itemId) {
  if (gameState.selectedItem === itemId) {
    // Deselect
    gameState.selectedItem = null;
  } else {
    gameState.selectedItem = itemId;
  }
  gameEvents.emit('inventoryChanged');
}

export function showHint(text) {
  gameState.hintText = text;
  if (gameState.hintTimer) clearTimeout(gameState.hintTimer);
  gameEvents.emit('hintChanged', text);
  gameState.hintTimer = setTimeout(() => {
    gameState.hintText = '';
    gameEvents.emit('hintChanged', '');
  }, 2000);
}

export function resetGame() {
  gameState.currentRoom = 0;
  gameState.phase = 'NEED_BEAKER';
  gameState.inventory = [];
  gameState.selectedItem = null;
  gameState.hintText = '';
  gameState.won = false;
  if (gameState.hintTimer) clearTimeout(gameState.hintTimer);
  gameEvents.emit('roomChanged', 0);
  gameEvents.emit('inventoryChanged');
}
