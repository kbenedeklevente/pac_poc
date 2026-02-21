// Vanilla Canvas — requestAnimationFrame loop
// Zero dependencies, pure Canvas2D

import { CANVAS_WIDTH, CANVAS_HEIGHT, NAV_ZONE_WIDTH, INVENTORY_HEIGHT, COLORS } from '../shared/constants.js';
import { gameState, gameEvents, resetGame } from '../shared/gameState.js';
import { handleObjectClick } from '../shared/puzzleEngine.js';
import { renderRoom, startDissolve, updateDissolve, isDissolveActive } from './renderer.js';
import { updateAnimations, clearParticles } from './animations.js';
import { setupInput, getHoverArrow } from './input.js';
import { renderInventory, renderHint, setHint } from './inventoryUI.js';

// ─── Setup ───
const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

setupInput(canvas);

// ─── Event wiring ───
gameEvents.on('roomChanged', () => {
  clearParticles();
});

gameEvents.on('hintChanged', (text) => {
  setHint(text);
});

gameEvents.on('animationRequested', (animId) => {
  if (animId === 'dissolvePanel') {
    startDissolve(ctx);
  }
  if (animId === 'fillBeaker') {
    // Simple flash effect — complete immediately
    gameEvents.emit('animationCompleted', 'fillBeaker');
  }
  if (animId === 'openDoor') {
    // Trigger win after brief delay
    setTimeout(() => {
      gameEvents.emit('animationCompleted', 'openDoor');
    }, 500);
  }
});

gameEvents.on('gameWon', () => {
  showWinScreen = true;
});

// ─── Game loop ───
let lastTime = 0;
let showWinScreen = false;

const SCENE_H = CANVAS_HEIGHT - INVENTORY_HEIGHT;

function gameLoop(timestamp) {
  const time = timestamp / 1000;
  const dt = Math.min(time - lastTime, 0.1);
  lastTime = time;

  if (showWinScreen) {
    drawWinScreen(ctx, time);
    requestAnimationFrame(gameLoop);
    return;
  }

  // Clear and render scene
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, CANVAS_WIDTH, SCENE_H);
  ctx.clip();

  renderRoom(ctx, gameState.currentRoom, time);
  updateAnimations(ctx, gameState.currentRoom, time, dt);

  // Panel dissolve animation
  if (isDissolveActive()) {
    const done = updateDissolve(ctx, dt);
    if (done) {
      gameEvents.emit('animationCompleted', 'dissolvePanel');
    }
  }

  // Navigation arrows
  drawNavArrows(ctx, time);

  ctx.restore();

  // Inventory
  renderInventory(ctx);

  // Hint text
  renderHint(ctx, dt);

  requestAnimationFrame(gameLoop);
}

function drawNavArrows(ctx, time) {
  const hover = getHoverArrow();
  const s = 24;

  // Left arrow — flush to edge
  if (gameState.currentRoom > 0) {
    const alpha = hover === 'left' ? 0.7 : 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(12, SCENE_H / 2);
    ctx.lineTo(12 + s, SCENE_H / 2 - s);
    ctx.lineTo(12 + s, SCENE_H / 2 + s);
    ctx.closePath();
    ctx.fill();
  }

  // Right arrow — flush to edge
  if (gameState.currentRoom < 2) {
    const alpha = hover === 'right' ? 0.7 : 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH - 12, SCENE_H / 2);
    ctx.lineTo(CANVAS_WIDTH - 12 - s, SCENE_H / 2 - s);
    ctx.lineTo(CANVAS_WIDTH - 12 - s, SCENE_H / 2 + s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWinScreen(ctx, time) {
  // Background
  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Animated glow
  const pulse = (Math.sin(time * 2) + 1) / 2;
  const grd = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 200 + pulse * 50
  );
  grd.addColorStop(0, 'rgba(87,204,153,0.3)');
  grd.addColorStop(1, 'rgba(87,204,153,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#57cc99';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '18px monospace';
  ctx.fillText('You escaped the abandoned lab.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Play again
  ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.3})`;
  ctx.font = '14px monospace';
  ctx.fillText('Click to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

  // One-time click handler for restart
  if (!drawWinScreen._bound) {
    drawWinScreen._bound = true;
    canvas.addEventListener('click', function restart() {
      canvas.removeEventListener('click', restart);
      drawWinScreen._bound = false;
      showWinScreen = false;
      resetGame();
      clearParticles();
    }, { once: false });
  }
}

// ─── Start ───
requestAnimationFrame(gameLoop);
