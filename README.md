# Abandoned Lab — 3-Engine Comparison

A point-and-click browser game implemented 3 times (Vanilla Canvas, PixiJS, Phaser) to compare developer experience, rendering capabilities, and code reuse.

**Core insight:** game logic is fully decoupled from the renderer. A shared module handles all puzzle/state logic; each engine only handles drawing and input.

## How to Run

Requires any local HTTP server (ES modules need HTTP, not `file://`).

```bash
# Option 1: Node.js
npx serve

# Option 2: Python
python3 -m http.server 8080
```

Then open `http://localhost:3000` (serve) or `http://localhost:8080` (python).

## How to Play

- Click left/right screen edges or use arrow keys to navigate between rooms
- Click objects to interact
- Click inventory slots to select an item, then click a target to use it
- **Puzzle chain:** Find beaker (Storage) → fill at pipe (Lab) → pour acid on panel (Lab) → grab key → use on door (Corridor)

## Project Structure

```
pac_poc/
├── index.html              # Landing page with comparison table
├── shared/                 # Engine-agnostic game logic
│   ├── constants.js        # Canvas size, colors, phases
│   ├── gameState.js        # Event emitter + reactive state
│   ├── puzzleEngine.js     # Puzzle state machine
│   └── roomData.js         # Declarative room/object definitions
├── vanilla/                # Canvas2D — 0 KB framework
├── pixi/                   # PixiJS v8 — GPU scene graph
└── phaser/                 # Phaser 3 — full game framework
```

## Engine Comparison

| Feature | Vanilla Canvas | PixiJS | Phaser |
|---|---|---|---|
| Bundle size | 0 KB | ~200 KB | ~1 MB |
| Rendering | Canvas2D immediate | WebGL scene graph | WebGL via Phaser |
| Room navigation | Instant redraw | Container toggle | Smooth camera pan |
| Panel dissolve | Pixel manipulation | DisplacementFilter | Timeline tweens |
| Hit testing | Manual AABB | eventMode | Zone + setInteractive |
