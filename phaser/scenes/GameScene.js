// Phaser GameScene — all 3 rooms at x-offsets, camera pan
// Hero: cameras.main.pan(), timeline-orchestrated dissolve, declarative tweens

import { CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_HEIGHT, NAV_ZONE_WIDTH, COLORS, PHASES } from '../../shared/constants.js';
import { gameState, gameEvents, navigateRoom, selectItem } from '../../shared/gameState.js';
import { handleObjectClick } from '../../shared/puzzleEngine.js';
import { rooms, getVisibleObjects } from '../../shared/roomData.js';

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;
const ROOM_WIDTH = CANVAS_WIDTH;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.objectSprites = {};
    this.inventorySlots = [];
    this.itemIcons = [];
    this.hintText = null;
    this.selectedLabel = null;
  }

  create() {
    // ─── Draw all 3 rooms side by side ───
    this.drawRooms();

    // ─── Camera setup ───
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH * 3, CANVAS_HEIGHT);
    this.cameras.main.setScroll(0, 0);

    // ─── Navigation ───
    this.setupNavigation();

    // ─── Inventory (fixed to camera) ───
    this.buildInventory();

    // ─── Create particle textures before emitters ───
    this.createParticleTextures();

    // ─── Animations ───
    this.setupAmbientAnimations();

    // ─── Event wiring (store cleanup functions) ───
    this._eventCleanups = [];
    this._eventCleanups.push(gameEvents.on('roomChanged', (room) => {
      this.cameras.main.pan(room * ROOM_WIDTH + ROOM_WIDTH / 2, CANVAS_HEIGHT / 2, 400, 'Sine.easeInOut');
      this.updateNavArrows();
    }));

    this._eventCleanups.push(gameEvents.on('inventoryChanged', () => this.refreshInventory()));
    this._eventCleanups.push(gameEvents.on('itemPickedUp', () => this.updateObjectVisibility()));
    this._eventCleanups.push(gameEvents.on('puzzleAdvanced', () => this.updateObjectVisibility()));

    this._eventCleanups.push(gameEvents.on('hintChanged', (text) => {
      this.hintText.setText(text);
      this.hintText.setAlpha(text ? 1 : 0);
      if (text) {
        this.tweens.add({
          targets: this.hintText,
          alpha: 0,
          delay: 1800,
          duration: 200,
        });
      }
    }));

    this._eventCleanups.push(gameEvents.on('animationRequested', (animId) => {
      if (animId === 'dissolvePanel') this.playDissolve();
      if (animId === 'fillBeaker') gameEvents.emit('animationCompleted', 'fillBeaker');
      if (animId === 'openDoor') this.playDoorOpen();
    }));

    this._eventCleanups.push(gameEvents.on('gameWon', () => {
      this.time.delayedCall(600, () => {
        this.scene.start('WinScene');
      });
    }));

    // Clean up event listeners when scene shuts down
    this.events.on('shutdown', () => {
      this._eventCleanups.forEach(fn => fn());
      this._eventCleanups = [];
    });

    this.updateObjectVisibility();
  }

  // ─── Room drawing ───

  drawRooms() {
    for (let r = 0; r < rooms.length; r++) {
      const room = rooms[r];
      const ox = r * ROOM_WIDTH;

      // Background
      this.drawRoomBg(r, ox);

      // Room label
      this.add.text(ox + 90, 10, room.name, {
        fontFamily: 'monospace', fontSize: 14, color: '#ffffff',
      }).setAlpha(0.15);

      // Objects
      for (const obj of room.objects) {
        this.drawObject(obj, ox);
      }
    }
  }

  drawRoomBg(roomIdx, ox) {
    const bg = this.add.graphics();
    const types = ['storage', 'lab', 'corridor'];
    const type = types[roomIdx];
    const bgColors = {
      storage: [0x1a1a2e, 0x2a2a3e],
      lab: [0x0f3460, 0x1e1e3a],
      corridor: [0x1b1b2f, 0x222240],
    };
    const [wall, floor] = bgColors[type];

    bg.fillStyle(wall);
    bg.fillRect(ox, 0, ROOM_WIDTH, SCENE_H);
    bg.fillStyle(floor);
    bg.fillRect(ox, SCENE_H - 80, ROOM_WIDTH, 80);
    bg.lineStyle(2, 0x3a3a5c);
    bg.lineBetween(ox, SCENE_H - 80, ox + ROOM_WIDTH, SCENE_H - 80);

    if (type === 'lab') {
      bg.lineStyle(1, 0x2a2a4e);
      for (let x = 0; x < ROOM_WIDTH; x += 60) {
        bg.strokeRect(ox + x, SCENE_H - 80, 60, 80);
      }
    }
  }

  drawObject(obj, ox) {
    const g = this.add.graphics();
    const x = ox + obj.x;
    const y = obj.y;

    switch (obj.id) {
      case 'shelf_left': case 'shelf_right':
        g.fillStyle(0x3a3a3a); g.fillRect(x, y, 8, obj.h); g.fillRect(x + obj.w - 8, y, 8, obj.h);
        g.fillStyle(0x5c5c5c);
        for (let i = 0; i < 4; i++) g.fillRect(x, y + i * (obj.h / 3), obj.w, 6);
        break;
      case 'beaker': {
        // Erlenmeyer flask — straight lines, no arc (Phaser arc distorts)
        const bw = obj.w, bh = obj.h;
        g.fillStyle(0xa8d8ea, 0.85);
        g.beginPath();
        g.moveTo(x + bw*0.3, y);          // top-left of neck
        g.lineTo(x + bw*0.7, y);          // top-right of neck
        g.lineTo(x + bw*0.65, y + bh*0.2); // right neck taper
        g.lineTo(x + bw*0.85, y + bh*0.5); // right shoulder
        g.lineTo(x + bw - 2, y + bh);      // bottom-right
        g.lineTo(x + 2, y + bh);           // bottom-left
        g.lineTo(x + bw*0.15, y + bh*0.5); // left shoulder
        g.lineTo(x + bw*0.35, y + bh*0.2); // left neck taper
        g.closePath(); g.fillPath();
        g.lineStyle(2, 0x88b8ca);
        g.beginPath();
        g.moveTo(x + bw*0.3, y);
        g.lineTo(x + bw*0.7, y);
        g.lineTo(x + bw*0.65, y + bh*0.2);
        g.lineTo(x + bw*0.85, y + bh*0.5);
        g.lineTo(x + bw - 2, y + bh);
        g.lineTo(x + 2, y + bh);
        g.lineTo(x + bw*0.15, y + bh*0.5);
        g.lineTo(x + bw*0.35, y + bh*0.2);
        g.closePath(); g.strokePath();
        break;
      }
      case 'box1': case 'box2': case 'box3':
        g.fillStyle(0x8b6914); g.fillRect(x, y, obj.w, obj.h);
        g.fillStyle(0x6b4f10); g.fillRect(x, y, obj.w, 6);
        g.lineStyle(1, 0x5a3e0e); g.strokeRect(x, y, obj.w, obj.h);
        break;
      case 'bench':
        g.fillStyle(0x78909c); g.fillRect(x, y, obj.w, 12);
        g.fillStyle(0x5c5c5c); g.fillRect(x + 10, y + 12, 10, obj.h - 12); g.fillRect(x + obj.w - 20, y + 12, 10, obj.h - 12);
        g.fillRect(x + 10, y + obj.h - 15, obj.w - 20, 6);
        break;
      case 'pipe':
        g.fillStyle(0x6b705c); g.fillRect(x + 15, y, 30, obj.h);
        g.fillStyle(0x555555); g.fillRect(x + 10, y, 40, 10); g.fillRect(x + 10, y + obj.h * 0.6, 40, 10);
        // Bright green corrosive leak — highly visible
        g.fillStyle(0x57cc99, 0.7); g.fillRect(x + 10, y + obj.h * 0.6 + 10, 40, 8);
        g.fillStyle(0x80ed99, 0.5); g.fillRect(x + 18, y + obj.h * 0.6 + 18, 24, 4);
        // Drip trail
        g.fillStyle(0x57cc99, 0.4);
        g.fillRect(x + 26, y + obj.h * 0.6 + 22, 8, obj.h * 0.4 - 22);
        // Puddle on floor
        g.fillStyle(0x57cc99, 0.35); g.fillCircle(x + 30, y + obj.h + 10, 20);
        g.fillStyle(0x80ed99, 0.25); g.fillCircle(x + 30, y + obj.h + 10, 12);
        break;
      case 'pipe_warning': {
        const cx = x + obj.w / 2, cy = y + 22;
        // Diamond
        g.fillStyle(0xffbe0b);
        g.beginPath(); g.moveTo(cx, cy-14); g.lineTo(cx+14, cy); g.lineTo(cx, cy+14); g.lineTo(cx-14, cy); g.closePath(); g.fillPath();
        // Skull
        g.fillStyle(0x1a1a2e); g.fillCircle(cx, cy-2, 7);
        g.fillStyle(0xffbe0b); g.fillCircle(cx-3, cy-3, 1.5); g.fillCircle(cx+3, cy-3, 1.5);
        g.fillStyle(0x1a1a2e); g.fillRect(cx-4, cy+3, 8, 3);
        g.fillStyle(0xffbe0b); g.fillRect(cx-3, cy+3, 2, 3); g.fillRect(cx+1, cy+3, 2, 3);
        // Crossbones
        g.lineStyle(2, 0x1a1a2e);
        g.lineBetween(cx-10, cy+12, cx+10, cy+24);
        g.lineBetween(cx+10, cy+12, cx-10, cy+24);
        // TOXIC text
        this.add.text(cx, y + obj.h - 4, 'TOXIC', { fontFamily: 'monospace', fontSize: 8, fontStyle: 'bold', color: '#ffbe0b' }).setOrigin(0.5, 1);
        break;
      }
      case 'panel':
        g.fillStyle(0xbf6b3a); g.fillRect(x, y, obj.w, obj.h);
        g.fillStyle(0x64321e, 0.5);
        for (let i = 0; i < 6; i++) { g.fillCircle(x + 15 + Math.sin(i*2.3)*30+20, y + 15 + Math.cos(i*1.7)*40+20, 8+(i%3)*4); }
        g.fillStyle(0x888888);
        g.fillCircle(x+10,y+10,4); g.fillCircle(x+obj.w-10,y+10,4); g.fillCircle(x+10,y+obj.h-10,4); g.fillCircle(x+obj.w-10,y+obj.h-10,4);
        break;
      case 'panel_dissolved':
        g.fillStyle(0x0a0a15); g.fillRect(x + 5, y + 5, obj.w - 10, obj.h - 10);
        break;
      case 'key':
        g.fillStyle(0xffd166); g.fillCircle(x + 12, y + 15, 10);
        g.fillStyle(0x0a0a15); g.fillCircle(x + 12, y + 15, 4);
        g.fillStyle(0xffd166); g.fillRect(x + 12, y + 10, obj.w - 14, 6);
        g.fillRect(x + obj.w - 8, y + 10, 4, 12); g.fillRect(x + obj.w - 16, y + 10, 4, 10);
        break;
      case 'door':
        g.fillStyle(0x22223b); g.fillRect(x - 10, y - 10, obj.w + 20, obj.h + 10);
        g.fillStyle(0x4a4e69); g.fillRect(x, y, obj.w, obj.h);
        g.lineStyle(2, 0x3a3a5e);
        g.strokeRect(x + 15, y + 20, obj.w - 30, obj.h * 0.35);
        g.strokeRect(x + 15, y + obj.h * 0.45, obj.w - 30, obj.h * 0.35);
        g.fillStyle(0xaaaaaa); g.fillCircle(x + obj.w - 30, y + obj.h * 0.5, 8);
        // Lock indicator
        this._doorLock = this.add.circle(ox + obj.x + obj.w - 30, obj.y + obj.h * 0.5 - 18, 4, 0xff4444);
        break;
      case 'warning_sign': {
        const cx = x + obj.w / 2, cy = y + obj.h / 2, s = obj.w * 0.4;
        g.fillStyle(0xffbe0b);
        g.beginPath(); g.moveTo(cx, cy-s); g.lineTo(cx+s, cy); g.lineTo(cx, cy+s); g.lineTo(cx-s, cy); g.closePath(); g.fillPath();
        this.add.text(cx, cy+2, '!', { fontFamily: 'monospace', fontSize: 28, fontStyle: 'bold', color: '#1a1a2e' }).setOrigin(0.5);
        break;
      }
      case 'vials': case 'vials2':
        g.fillStyle(0xe0aaff, 0.7); g.fillRect(x + 5, y, obj.w - 10, obj.h);
        g.fillStyle(0xc77dff, 0.7); g.fillRect(x + 7, y + obj.h * 0.4, obj.w - 14, obj.h * 0.55);
        break;
      case 'light_storage':
        g.fillStyle(0x666666); g.fillRect(x - 5, y - 5, obj.w + 10, 8);
        g.fillStyle(0xfffacd); g.fillRect(x, y, obj.w, obj.h);
        break;
      case 'wire':
        g.lineStyle(3, 0xff6b6b);
        g.lineBetween(x + obj.w/2, y, x + obj.w/2, y + obj.h);
        break;
      case 'emergency_light':
        g.fillStyle(0x333333); g.fillRect(x - 5, y - 5, obj.w + 10, obj.h + 10);
        g.fillStyle(0xff4444); g.fillCircle(x + obj.w/2, y + obj.h/2, obj.w/2 - 2);
        break;
      default:
        return;
    }

    this.objectSprites[obj.id] = g;

    // Interactive hit zone
    if (obj.type === 'pickup' || obj.type === 'interactive') {
      const zone = this.add.zone(x + obj.w/2, y + obj.h/2, obj.w, obj.h).setInteractive({ cursor: 'pointer' });
      zone.on('pointerdown', () => handleObjectClick(obj.id));
      this.objectSprites[obj.id + '_zone'] = zone;
    }
  }

  // ─── Object visibility ───

  updateObjectVisibility() {
    for (const room of rooms) {
      for (const obj of room.objects) {
        if (!obj.visibleWhen) continue;
        const g = this.objectSprites[obj.id];
        const zone = this.objectSprites[obj.id + '_zone'];
        const visible = obj.visibleWhen(gameState);
        if (g) g.setVisible(visible);
        if (zone) zone.input.enabled = visible;
      }
    }
    // Update door lock color
    if (this._doorLock) {
      this._doorLock.fillColor = gameState.phase === PHASES.WIN ? 0x57cc99 : 0xff4444;
    }
  }

  // ─── Navigation ───

  setupNavigation() {
    // Arrow keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-LEFT', () => navigateRoom(-1));
    this.input.keyboard.on('keydown-RIGHT', () => navigateRoom(1));

    // Click zones (fixed to camera)
    this.leftArrow = this.add.graphics().setScrollFactor(0);
    this.rightArrow = this.add.graphics().setScrollFactor(0);

    this.leftZone = this.add.zone(NAV_ZONE_WIDTH / 2, SCENE_H / 2, NAV_ZONE_WIDTH, SCENE_H)
      .setScrollFactor(0).setInteractive({ cursor: 'pointer' });
    this.leftZone.on('pointerdown', () => navigateRoom(-1));
    this.leftZone.on('pointerover', () => { this.leftArrow.setAlpha(0.7); });
    this.leftZone.on('pointerout', () => { this.leftArrow.setAlpha(0.3); });

    this.rightZone = this.add.zone(CANVAS_WIDTH - NAV_ZONE_WIDTH / 2, SCENE_H / 2, NAV_ZONE_WIDTH, SCENE_H)
      .setScrollFactor(0).setInteractive({ cursor: 'pointer' });
    this.rightZone.on('pointerdown', () => navigateRoom(1));
    this.rightZone.on('pointerover', () => { this.rightArrow.setAlpha(0.7); });
    this.rightZone.on('pointerout', () => { this.rightArrow.setAlpha(0.3); });

    this.drawNavArrows();
  }

  drawNavArrows() {
    this.leftArrow.clear();
    this.rightArrow.clear();

    const s = 24;
    const canGoLeft = gameState.currentRoom > 0;
    const canGoRight = gameState.currentRoom < 2;

    // Left — flush to edge, only when navigable
    if (canGoLeft) {
      this.leftArrow.fillStyle(0xffffff, 0.3);
      this.leftArrow.fillTriangle(
        12, SCENE_H / 2,
        12 + s, SCENE_H / 2 - s,
        12 + s, SCENE_H / 2 + s,
      );
    }
    this.leftArrow.setVisible(canGoLeft);
    this.leftZone.setVisible(canGoLeft);
    if (this.leftZone.input) this.leftZone.input.enabled = canGoLeft;

    // Right — flush to edge, only when navigable
    if (canGoRight) {
      this.rightArrow.fillStyle(0xffffff, 0.3);
      this.rightArrow.fillTriangle(
        CANVAS_WIDTH - 12, SCENE_H / 2,
        CANVAS_WIDTH - 12 - s, SCENE_H / 2 - s,
        CANVAS_WIDTH - 12 - s, SCENE_H / 2 + s,
      );
    }
    this.rightArrow.setVisible(canGoRight);
    this.rightZone.setVisible(canGoRight);
    if (this.rightZone.input) this.rightZone.input.enabled = canGoRight;
  }

  updateNavArrows() {
    this.drawNavArrows();
  }

  // ─── Inventory ───

  buildInventory() {
    const totalSlots = 5;
    const slotSize = 60;
    const pad = 10;
    const totalW = totalSlots * (slotSize + pad) - pad;
    const startX = (CANVAS_WIDTH - totalW) / 2;
    const slotY = SCENE_H + (INVENTORY_HEIGHT - slotSize) / 2;

    // Background bar (fixed)
    const bg = this.add.graphics().setScrollFactor(0);
    bg.fillStyle(0x1a1a2e);
    bg.fillRect(0, SCENE_H, CANVAS_WIDTH, INVENTORY_HEIGHT);
    bg.lineStyle(2, 0x3a3a5c);
    bg.lineBetween(0, SCENE_H, CANVAS_WIDTH, SCENE_H);

    // Label
    this.add.text(startX, SCENE_H + 3, 'INVENTORY', {
      fontFamily: 'monospace', fontSize: 11, color: '#ffffff',
    }).setAlpha(0.3).setScrollFactor(0);

    // Selected label
    this.selectedLabel = this.add.text(startX + totalW, SCENE_H + 3, '', {
      fontFamily: 'monospace', fontSize: 12, color: '#ff8c00',
    }).setOrigin(1, 0).setScrollFactor(0);

    // Hint text
    this.hintText = this.add.text(CANVAS_WIDTH / 2, SCENE_H - 25, '', {
      fontFamily: 'monospace', fontSize: 16, color: '#ffdd57',
    }).setOrigin(0.5, 0).setScrollFactor(0).setAlpha(0);

    // Slots
    for (let i = 0; i < totalSlots; i++) {
      const sx = startX + i * (slotSize + pad);
      const slot = this.add.graphics().setScrollFactor(0);
      slot.fillStyle(0x2a2a4e); slot.fillRect(sx, slotY, slotSize, slotSize);
      slot.lineStyle(1, 0x3a3a5c); slot.strokeRect(sx, slotY, slotSize, slotSize);

      const zone = this.add.zone(sx + slotSize / 2, slotY + slotSize / 2, slotSize, slotSize)
        .setScrollFactor(0).setInteractive({ cursor: 'pointer' });
      const idx = i;
      zone.on('pointerdown', () => {
        if (idx < gameState.inventory.length) {
          selectItem(gameState.inventory[idx]);
        }
      });

      this.inventorySlots.push({ graphics: slot, x: sx, y: slotY, size: slotSize });
    }

    this.refreshInventory();
  }

  refreshInventory() {
    const slotSize = 60;
    const pad = 10;

    // Clear old icons
    for (const icon of this.itemIcons) icon.destroy();
    this.itemIcons = [];

    // Redraw slots
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      const g = slot.graphics;
      g.clear();

      const hasItem = i < gameState.inventory.length;
      const itemId = hasItem ? gameState.inventory[i] : null;
      const isSelected = hasItem && gameState.selectedItem === itemId;

      g.fillStyle(0x2a2a4e);
      g.fillRect(slot.x, slot.y, slotSize, slotSize);

      if (isSelected) {
        g.lineStyle(3, 0xff8c00);
        g.strokeRect(slot.x - 1, slot.y - 1, slotSize + 2, slotSize + 2);
      } else {
        g.lineStyle(1, 0x3a3a5c);
        g.strokeRect(slot.x, slot.y, slotSize, slotSize);
      }

      if (hasItem) {
        const icon = this.drawItemIcon(itemId, slot.x + 8, slot.y + 8, slotSize - 16);
        this.itemIcons.push(icon);
      }
    }

    // Selected label
    if (gameState.selectedItem) {
      const labels = { beaker: 'Empty Beaker', acid: 'Acid Beaker', key: 'Lab Key' };
      this.selectedLabel.setText(`Selected: ${labels[gameState.selectedItem] || ''}`);
    } else {
      this.selectedLabel.setText('');
    }
  }

  drawBeakerIcon(g, x, y, s, hasAcid) {
    // Erlenmeyer flask — straight lines
    g.fillStyle(0xa8d8ea, 0.85);
    g.beginPath();
    g.moveTo(x + s*0.3, y);
    g.lineTo(x + s*0.7, y);
    g.lineTo(x + s*0.65, y + s*0.2);
    g.lineTo(x + s*0.85, y + s*0.5);
    g.lineTo(x + s - 2, y + s);
    g.lineTo(x + 2, y + s);
    g.lineTo(x + s*0.15, y + s*0.5);
    g.lineTo(x + s*0.35, y + s*0.2);
    g.closePath(); g.fillPath();
    g.lineStyle(1.5, 0x88b8ca);
    g.beginPath();
    g.moveTo(x + s*0.3, y);
    g.lineTo(x + s*0.7, y);
    g.lineTo(x + s*0.65, y + s*0.2);
    g.lineTo(x + s*0.85, y + s*0.5);
    g.lineTo(x + s - 2, y + s);
    g.lineTo(x + 2, y + s);
    g.lineTo(x + s*0.15, y + s*0.5);
    g.lineTo(x + s*0.35, y + s*0.2);
    g.closePath(); g.strokePath();
    if (hasAcid) {
      g.fillStyle(0x57cc99, 0.8);
      g.beginPath();
      g.moveTo(x + s*0.2, y + s*0.55);
      g.lineTo(x + s*0.8, y + s*0.55);
      g.lineTo(x + s - 2, y + s);
      g.lineTo(x + 2, y + s);
      g.closePath(); g.fillPath();
    }
  }

  drawItemIcon(itemId, x, y, size) {
    const g = this.add.graphics().setScrollFactor(0);

    if (itemId === 'beaker') {
      this.drawBeakerIcon(g, x, y, size, false);
    } else if (itemId === 'acid') {
      this.drawBeakerIcon(g, x, y, size, true);
    } else if (itemId === 'key') {
      g.fillStyle(0xffd166); g.fillCircle(x+10, y+size/2, 8);
      g.fillStyle(0x0a0a15); g.fillCircle(x+10, y+size/2, 3);
      g.fillStyle(0xffd166); g.fillRect(x+10, y+size/2-3, size-12, 5);
      g.fillRect(x+size-5, y+size/2-3, 3, 10);
    }

    return g;
  }

  // ─── Ambient animations ───

  createParticleTextures() {
    // Create all particle textures upfront so emitters can reference them
    if (!this.textures.exists('drip_particle')) {
      const c = this.textures.createCanvas('drip_particle', 8, 8);
      const ctx = c.getContext();
      ctx.fillStyle = '#57cc99';
      ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }
    if (!this.textures.exists('spark_particle')) {
      const c = this.textures.createCanvas('spark_particle', 6, 6);
      const ctx = c.getContext();
      ctx.fillStyle = '#ffdd57';
      ctx.beginPath(); ctx.arc(3, 3, 2, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }
    if (!this.textures.exists('acid_particle')) {
      const c = this.textures.createCanvas('acid_particle', 6, 6);
      const ctx = c.getContext();
      ctx.fillStyle = '#57cc99';
      ctx.beginPath(); ctx.arc(3, 3, 3, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }
  }

  setupAmbientAnimations() {
    // Flickering light — room 0
    const lightGlow = this.add.graphics();
    lightGlow.fillStyle(0xfffacd, 0.12);
    lightGlow.fillCircle(480, 130, 200);

    this.tweens.add({
      targets: lightGlow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Drip particles — room 1 (texture already created)
    this.add.particles(ROOM_WIDTH + 190, 220, 'drip_particle', {
      speed: { min: 20, max: 60 },
      angle: { min: 80, max: 100 },
      lifespan: 1200,
      quantity: 1,
      frequency: 150,
      alpha: { start: 0.8, end: 0 },
      scale: { start: 0.3, end: 0.1 },
    });

    // Spark particles — room 1
    this.add.particles(ROOM_WIDTH + 780, 180, 'spark_particle', {
      speed: { min: 30, max: 100 },
      angle: { min: 200, max: 340 },
      lifespan: 600,
      quantity: 1,
      frequency: 80,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.4, end: 0.1 },
      gravityY: 80,
    });

    // Emergency pulse — room 2
    const emergencyGlow = this.add.graphics();
    emergencyGlow.fillStyle(0xff4444, 0.15);
    emergencyGlow.fillCircle(2 * ROOM_WIDTH + 500, 60, 150);

    this.tweens.add({
      targets: emergencyGlow,
      alpha: { from: 0.2, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Hero: dissolve panel with timeline ───

  playDissolve() {
    const panel = this.objectSprites['panel'];
    if (!panel) return;

    const panelObj = rooms[1].objects.find(o => o.id === 'panel');
    const px = ROOM_WIDTH + panelObj.x;
    const py = panelObj.y;

    // Timeline-orchestrated dissolve
    const timeline = this.add.timeline([
      {
        at: 0,
        run: () => {
          // Start acid drip
          this.add.particles(px + panelObj.w / 2, py, 'acid_particle', {
            speed: { min: 10, max: 40 },
            angle: { min: 80, max: 100 },
            lifespan: 1000,
            quantity: 3,
            frequency: 50,
            alpha: { start: 0.8, end: 0 },
            scale: { start: 0.3, end: 0.6 },
            duration: 2000,
          });
        },
      },
      {
        at: 200,
        tween: {
          targets: panel,
          alpha: 0.6,
          duration: 800,
          ease: 'Power2',
        },
      },
      {
        at: 800,
        tween: {
          targets: panel,
          alpha: 0.2,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 600,
          ease: 'Power2',
        },
      },
      {
        at: 1600,
        tween: {
          targets: panel,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
        },
      },
      {
        at: 2200,
        run: () => {
          gameEvents.emit('animationCompleted', 'dissolvePanel');
        },
      },
    ]);

    timeline.play();
  }

  playDoorOpen() {
    const door = this.objectSprites['door'];
    const doorZone = this.objectSprites['door_zone'];
    if (door) {
      // Draw an open doorway behind the door
      const doorObj = rooms[2].objects.find(o => o.id === 'door');
      const ox = 2 * ROOM_WIDTH;
      const openDoor = this.add.graphics();
      // Dark opening
      openDoor.fillStyle(0x0a0a15);
      openDoor.fillRect(ox + doorObj.x + 5, doorObj.y + 5, doorObj.w - 10, doorObj.h - 5);
      // Light coming through
      openDoor.fillStyle(0x57cc99, 0.15);
      openDoor.fillRect(ox + doorObj.x + 15, doorObj.y + 15, doorObj.w - 30, doorObj.h - 20);

      // Swing the door open — it stays in place but reveals the opening
      // Simulate perspective by narrowing the door from the right (hinge on left)
      const timeline = this.add.timeline([
        {
          at: 0,
          tween: {
            targets: door,
            alpha: 0.7,
            duration: 200,
            ease: 'Sine.easeOut',
          },
        },
        {
          at: 200,
          tween: {
            targets: door,
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeIn',
          },
        },
        {
          at: 700,
          run: () => {
            gameEvents.emit('animationCompleted', 'openDoor');
          },
        },
      ]);
      timeline.play();
    } else {
      setTimeout(() => gameEvents.emit('animationCompleted', 'openDoor'), 500);
    }
  }
}
