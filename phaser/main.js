// Phaser — Phaser.Game config
// Scene management, camera panning, declarative tweens

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';

const config = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a15',
  scene: [GameScene, WinScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
