# Deltecho-Claw Game Engine

**An AI-Enhanced Platformer Game Engine inspired by OpenClaw (Captain Claw)**

The Deltecho-Claw Game Engine is a TypeScript-based 2D platformer game engine that integrates with Deep Tree Echo AI to provide intelligent, context-aware gameplay assistance.

## Features

### Core Game Engine
- ✅ **Physics System**: Gravity, velocity, collision detection
- ✅ **Entity System**: Players, enemies, platforms, collectibles
- ✅ **Player States**: Idle, running, jumping, falling, attacking, climbing, dead
- ✅ **Camera System**: Smooth following camera with level bounds
- ✅ **Level Support**: Load custom levels with entities and tile maps
- ✅ **Input Handling**: Keyboard/gamepad input abstraction
- ✅ **Event System**: Game events for external listeners

### AI Integration
- ✅ **AI-Game Bridge**: Connects AI to game state
- ✅ **Real-time Perception**: AI understands current game situation
- ✅ **Proactive Assistance**: AI provides tips and warnings
- ✅ **Event Analysis**: AI learns from game events
- ✅ **Contextual Suggestions**: Based on player performance

### Rendering
- ✅ **Canvas Renderer**: HTML5 canvas-based 2D rendering
- ✅ **Entity Rendering**: Different visuals for each entity type
- ✅ **UI Overlay**: Score, health, lives display
- ✅ **Debug Mode**: Collision boxes, velocity vectors, FPS
- ✅ **Pause/Game Over**: Full game state management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Deltecho-Claw Game Engine                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐         ┌─────────────────────┐        │
│  │   GameEngine   │────────▶│   CanvasRenderer    │        │
│  │   (Core Loop)  │         │   (Visuals)         │        │
│  └────────┬───────┘         └─────────────────────┘        │
│           │                                                  │
│           │  Events & State                                 │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────┐           │
│  │            AIGameBridge                      │           │
│  │  • Perception (health, score, enemies)      │           │
│  │  • Proactive Suggestions                    │           │
│  │  • Event Analysis                           │           │
│  │  • AI Message Generation                    │           │
│  └──────────────────┬──────────────────────────┘           │
│                     │                                        │
│                     ▼                                        │
│           ┌──────────────────────┐                          │
│           │  Deep Tree Echo AI   │                          │
│           │  (Cognitive Core)    │                          │
│           └──────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
cd packages/game-engine
pnpm install
pnpm build
```

## Quick Start

### Basic Game Setup

```typescript
import { GameEngine, CanvasRenderer, Level, EntityType } from 'deltecho-game-engine'

// Create canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
canvas.width = 800
canvas.height = 600

// Configure game
const config = {
  canvasWidth: 800,
  canvasHeight: 600,
  targetFPS: 60,
  physics: {
    gravity: 980,
    friction: 0.8,
    maxVelocityX: 400,
    maxVelocityY: 1000,
    jumpForce: 450,
    moveSpeed: 200,
  },
  debugMode: false,
  enableAI: true,
}

// Create game engine
const gameEngine = new GameEngine(config)

// Create renderer
const renderer = new CanvasRenderer({
  canvas,
  debugMode: false,
  showFPS: true,
})

// Create a simple level
const level: Level = {
  id: 'level-1',
  name: 'Tutorial Level',
  width: 3200,
  height: 600,
  backgroundColor: '#87CEEB',
  spawnPoint: { x: 100, y: 400 },
  checkpoints: [],
  entities: [
    // Ground platform
    {
      id: 'ground',
      type: EntityType.PLATFORM,
      position: { x: 0, y: 550 },
      velocity: { x: 0, y: 0 },
      width: 3200,
      height: 50,
      active: true,
      visible: true,
    },
    // Floating platform
    {
      id: 'platform-1',
      type: EntityType.PLATFORM,
      position: { x: 300, y: 450 },
      velocity: { x: 0, y: 0 },
      width: 200,
      height: 20,
      active: true,
      visible: true,
    },
    // Collectible coin
    {
      id: 'coin-1',
      type: EntityType.COLLECTIBLE,
      position: { x: 380, y: 400 },
      velocity: { x: 0, y: 0 },
      width: 20,
      height: 20,
      active: true,
      visible: true,
    },
    // Enemy
    {
      id: 'enemy-1',
      type: EntityType.ENEMY,
      position: { x: 600, y: 500 },
      velocity: { x: 0, y: 0 },
      width: 32,
      height: 32,
      active: true,
      visible: true,
    },
  ],
}

// Load level and start
gameEngine.loadLevel(level)
gameEngine.start()

// Render loop
gameEngine.on('stateUpdate', (state) => {
  renderer.render(state)
})

// Handle keyboard input
const inputState = {
  left: false,
  right: false,
  jump: false,
  attack: false,
  duck: false,
  up: false,
  down: false,
}

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
      inputState.left = true
      break
    case 'ArrowRight':
    case 'd':
      inputState.right = true
      break
    case 'ArrowUp':
    case 'w':
    case ' ':
      inputState.jump = true
      break
    case 'ArrowDown':
    case 's':
      inputState.duck = true
      break
    case 'x':
    case 'j':
      inputState.attack = true
      break
  }
  gameEngine.updateInput(inputState)
})

window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
      inputState.left = false
      break
    case 'ArrowRight':
    case 'd':
      inputState.right = false
      break
    case 'ArrowUp':
    case 'w':
    case ' ':
      inputState.jump = false
      break
    case 'ArrowDown':
    case 's':
      inputState.duck = false
      break
    case 'x':
    case 'j':
      inputState.attack = false
      break
  }
  gameEngine.updateInput(inputState)
})

// Pause on P key
window.addEventListener('keydown', (e) => {
  if (e.key === 'p') {
    const state = gameEngine.getState()
    if (state.paused) {
      gameEngine.resume()
    } else {
      gameEngine.pause()
    }
  }
})
```

### Adding AI Assistance

```typescript
import { AIGameBridge } from 'deltecho-game-engine'

// Create AI bridge
const aiBridge = new AIGameBridge(gameEngine, {
  enableProactiveSuggestions: true,
  suggestionCooldown: 5000, // 5 seconds between suggestions
  enableDangerWarnings: true,
  enableCongratulations: true,
})

// Listen to AI messages
aiBridge.on('aiMessage', (message) => {
  console.log(`[AI ${message.type}]:`, message.content)
  
  // Display in game UI or chat
  displayAIMessage(message)
})

// Get AI perception at any time
const perception = aiBridge.getPerception()
console.log('AI sees:', perception)
// {
//   playerHealth: 100,
//   playerScore: 250,
//   nearbyEnemies: 1,
//   nearbyCollectibles: 2,
//   levelProgress: 15.5,
//   difficulty: 'medium',
//   situation: 'Moving forward',
//   recommendations: ['Collect treasures to increase score', ...]
// }

// Execute AI actions
aiBridge.executeAIAction(AIGameAction.PROVIDE_TIP, {
  tip: 'Try double jumping to reach higher platforms!'
})
```

### React/Frontend Integration

```tsx
import React, { useEffect, useRef, useState } from 'react'
import { GameEngine, CanvasRenderer, AIGameBridge } from 'deltecho-game-engine'

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aiMessages, setAiMessages] = useState<string[]>([])
  const [gameState, setGameState] = useState<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const gameEngine = new GameEngine(config)
    const renderer = new CanvasRenderer({ canvas, showFPS: true })
    const aiBridge = new AIGameBridge(gameEngine, {
      enableProactiveSuggestions: true,
      suggestionCooldown: 5000,
      enableDangerWarnings: true,
      enableCongratulations: true,
    })

    // Load level
    gameEngine.loadLevel(level)
    gameEngine.start()

    // Render loop
    gameEngine.on('stateUpdate', (state) => {
      renderer.render(state)
      setGameState(state)
    })

    // AI messages
    aiBridge.on('aiMessage', (message) => {
      setAiMessages((prev) => [...prev.slice(-5), message.content])
    })

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      // ... input handling
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      gameEngine.stop()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={800} height={600} />
      <div className="ai-messages">
        {aiMessages.map((msg, i) => (
          <div key={i} className="ai-message">{msg}</div>
        ))}
      </div>
      {gameState && (
        <div className="game-stats">
          <div>Score: {gameState.player?.score || 0}</div>
          <div>Health: {gameState.player?.health || 0}/100</div>
          <div>Lives: {gameState.player?.lives || 0}</div>
        </div>
      )}
    </div>
  )
}
```

## Game Events

The engine emits various events you can listen to:

```typescript
gameEngine.on('gameEvent', (event: GameEvent) => {
  switch (event.type) {
    case GameEventType.PLAYER_JUMP:
      console.log('Player jumped!')
      break
    case GameEventType.PLAYER_ATTACK:
      console.log('Player attacked!')
      break
    case GameEventType.PLAYER_DAMAGED:
      console.log('Player took damage:', event.data.damage)
      break
    case GameEventType.COLLECTIBLE_ACQUIRED:
      console.log('Collected item! +', event.data.score)
      break
    case GameEventType.ENEMY_DEFEATED:
      console.log('Enemy defeated!')
      break
    case GameEventType.CHECKPOINT_REACHED:
      console.log('Checkpoint reached!')
      break
    case GameEventType.LEVEL_COMPLETE:
      console.log('Level complete!')
      break
    case GameEventType.GAME_OVER:
      console.log('Game over!')
      break
  }
})
```

## Level Design

Create custom levels with JSON:

```typescript
const customLevel: Level = {
  id: 'custom-1',
  name: 'My Custom Level',
  width: 5000,
  height: 800,
  backgroundColor: '#4A90E2',
  spawnPoint: { x: 100, y: 600 },
  checkpoints: [
    { x: 1000, y: 600 },
    { x: 2500, y: 600 },
  ],
  entities: [
    // Platforms
    { id: 'ground', type: EntityType.PLATFORM, position: { x: 0, y: 750 }, ... },
    { id: 'plat1', type: EntityType.PLATFORM, position: { x: 300, y: 650 }, ... },
    
    // Enemies
    { id: 'enemy1', type: EntityType.ENEMY, position: { x: 500, y: 700 }, ... },
    
    // Collectibles
    { id: 'coin1', type: EntityType.COLLECTIBLE, position: { x: 350, y: 600 }, ... },
    { id: 'coin2', type: EntityType.COLLECTIBLE, position: { x: 400, y: 600 }, ... },
    
    // Checkpoint
    { id: 'cp1', type: EntityType.CHECKPOINT, position: { x: 1000, y: 680 }, ... },
  ],
}
```

## Physics Configuration

Fine-tune physics for different gameplay feels:

```typescript
// Floaty, moon-like physics
const floatyPhysics = {
  gravity: 300,
  friction: 0.95,
  maxVelocityX: 300,
  maxVelocityY: 500,
  jumpForce: 600,
  moveSpeed: 150,
}

// Heavy, realistic physics
const heavyPhysics = {
  gravity: 1500,
  friction: 0.7,
  maxVelocityX: 500,
  maxVelocityY: 1500,
  jumpForce: 400,
  moveSpeed: 250,
}

// Fast-paced arcade physics
const arcadePhysics = {
  gravity: 800,
  friction: 0.85,
  maxVelocityX: 600,
  maxVelocityY: 1200,
  jumpForce: 500,
  moveSpeed: 350,
}
```

## AI Suggestions

The AI can provide various types of assistance:

```typescript
// Danger warnings
aiBridge.on('aiMessage', (msg) => {
  if (msg.type === 'warning') {
    showWarning(msg.content) // "Low health and multiple enemies nearby!"
  }
})

// Congratulations
if (msg.type === 'congratulation') {
  showCelebration(msg.content) // "Amazing! Level complete!"
}

// Tips
if (msg.type === 'tip') {
  showTip(msg.content) // "There are collectibles nearby worth grabbing!"
}

// Strategic suggestions
if (msg.type === 'suggestion') {
  showSuggestion(msg.content) // "I suggest moving right"
}

// Situation analysis
if (msg.type === 'analysis') {
  showAnalysis(msg.content) // "In combat - health is low"
}
```

## Future Enhancements

### Planned Features
- [ ] **Sprite Animations**: Replace colored rectangles with sprites
- [ ] **Sound Effects**: Jump, attack, collect sounds
- [ ] **Background Music**: MIDI/MP3 soundtrack support
- [ ] **Power-ups**: Speed boost, invincibility, double jump
- [ ] **Boss Battles**: Complex enemy AI patterns
- [ ] **Cutscenes**: Story progression between levels
- [ ] **Save System**: Progress persistence
- [ ] **Achievements**: Unlock system with rewards

### Advanced Features
- [ ] **Level Editor**: Visual level design tool
- [ ] **Multiplayer**: Co-op and versus modes
- [ ] **Procedural Generation**: Infinite random levels
- [ ] **AI-Generated Levels**: Custom levels based on skill
- [ ] **Mobile Support**: Touch controls
- [ ] **Gamepad Support**: Full controller integration
- [ ] **WebGL Renderer**: Hardware-accelerated graphics
- [ ] **Particle Systems**: Visual effects
- [ ] **Dialogue System**: NPC conversations

## Inspired By

This engine is inspired by:
- **OpenClaw** (Captain Claw reimplementation)
- **Super Mario Bros** (classic platformer mechanics)
- **Celeste** (tight controls and AI assistance concept)
- **Deep Tree Echo** (cognitive AI integration)

## Performance

- Target: 60 FPS
- Entity limit: ~1000 entities per level
- Canvas size: 800x600 recommended, scalable
- Physics updates: 60 Hz
- Input polling: Every frame
- AI analysis: Throttled (configurable cooldown)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ⚠️ Needs touch controls

## Contributing

Want to enhance the game engine?

1. **Graphics**: Create sprite sheets and animations
2. **Levels**: Design challenging level layouts
3. **Features**: Implement new mechanics (wall-jump, dash, etc.)
4. **AI**: Improve AI assistance algorithms
5. **Performance**: Optimize rendering and physics
6. **Documentation**: Add tutorials and examples

## License

GPL-3.0-or-later

---

**Deltecho-Claw Game Engine**: Where AI meets platforming! 🎮🌳
