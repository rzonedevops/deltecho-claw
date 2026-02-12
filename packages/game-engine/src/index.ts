/**
 * Deltecho-Claw Game Engine
 * OpenClaw-inspired platformer game engine for Deltecho Chat
 *
 * This module provides a game engine that integrates with Deep Tree Echo AI,
 * allowing AI companions to observe, assist, and interact with gameplay.
 */

export { GameEngine } from './core/GameEngine.js'
export { AIGameBridge } from './bridge/AIGameBridge.js'
export { CanvasRenderer } from './renderer/CanvasRenderer.js'

export type {
  Vector2D,
  GameEntity,
  PlayerEntity,
  EnemyEntity,
  Level,
  GameState,
  InputState,
  GameEvent,
  PhysicsConfig,
  GameConfig,
  AIGamePerception,
} from './types/index.js'

export { EntityType, PlayerState, GameEventType, AIGameAction } from './types/index.js'
