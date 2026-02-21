// Phaser WinScene — victory screen with tweened effects

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';
import { resetGame } from '../../shared/gameState.js';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor(0x0a0a15);

    // Glow circle
    const glow = this.add.graphics();
    glow.fillStyle(0x57cc99, 0.15);
    glow.fillCircle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 150);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title
    const title = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, 'ESCAPED!', {
      fontFamily: 'monospace',
      fontSize: 48,
      fontStyle: 'bold',
      color: '#57cc99',
    }).setOrigin(0.5);

    // Entry animation
    title.setScale(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Subtitle
    const sub = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20, 'You escaped the abandoned lab.', {
      fontFamily: 'monospace',
      fontSize: 18,
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: sub,
      alpha: 0.6,
      delay: 400,
      duration: 500,
    });

    // Restart text
    const restart = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70, 'Click to play again', {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: restart,
      alpha: { from: 0.3, to: 0.7 },
      delay: 800,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Click to restart
    this.input.once('pointerdown', () => {
      resetGame();
      this.scene.start('GameScene');
    });
  }
}
