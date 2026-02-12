/**
 * Deltecho-Claw Game Engine Types
 * OpenClaw-inspired platformer game type definitions
 */

/**
 * 2D Vector for positions and velocities
 */
export interface Vector2D {
  x: number
  y: number
}

/**
 * Game entity types based on OpenClaw
 */
export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PLATFORM = 'platform',
  COLLECTIBLE = 'collectible',
  CHECKPOINT = 'checkpoint',
  TREASURE = 'treasure',
  POWERUP = 'powerup',
}

/**
 * Player state
 */
export enum PlayerState {
  IDLE = 'idle',
  RUNNING = 'running',
  JUMPING = 'jumping',
  FALLING = 'falling',
  ATTACKING = 'attacking',
  CLIMBING = 'climbing',
  DEAD = 'dead',
}

/**
 * Game entity base interface
 */
export interface GameEntity {
  id: string
  type: EntityType
  position: Vector2D
  velocity: Vector2D
  width: number
  height: number
  active: boolean
  visible: boolean
}

/**
 * Player entity with extended properties
 */
export interface PlayerEntity extends GameEntity {
  type: EntityType.PLAYER
  state: PlayerState
  health: number
  maxHealth: number
  score: number
  lives: number
  facing: 'left' | 'right'
  onGround: boolean
  canDoubleJump: boolean
}

/**
 * Enemy entity
 */
export interface EnemyEntity extends GameEntity {
  type: EntityType.ENEMY
  health: number
  damage: number
  aiType: 'patrol' | 'chase' | 'static'
  patrolPath?: Vector2D[]
}

/**
 * Level data structure
 */
export interface Level {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  entities: GameEntity[]
  tileMap?: number[][]
  spawnPoint: Vector2D
  checkpoints: Vector2D[]
}

/**
 * Game state
 */
export interface GameState {
  currentLevel?: Level
  player?: PlayerEntity
  entities: GameEntity[]
  camera: {
    x: number
    y: number
    width: number
    height: number
  }
  paused: boolean
  gameOver: boolean
  levelComplete: boolean
  elapsedTime: number
}

/**
 * Input state
 */
export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  attack: boolean
  duck: boolean
  up: boolean
  down: boolean
}

/**
 * Game event types
 */
export enum GameEventType {
  PLAYER_JUMP = 'player_jump',
  PLAYER_ATTACK = 'player_attack',
  PLAYER_DAMAGED = 'player_damaged',
  PLAYER_DIED = 'player_died',
  ENEMY_DEFEATED = 'enemy_defeated',
  COLLECTIBLE_ACQUIRED = 'collectible_acquired',
  CHECKPOINT_REACHED = 'checkpoint_reached',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over',
  SCORE_CHANGED = 'score_changed',
}

/**
 * Game event data
 */
export interface GameEvent {
  type: GameEventType
  timestamp: number
  data?: any
}

/**
 * Physics configuration
 */
export interface PhysicsConfig {
  gravity: number
  friction: number
  maxVelocityX: number
  maxVelocityY: number
  jumpForce: number
  moveSpeed: number
}

/**
 * Game configuration
 */
export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  targetFPS: number
  physics: PhysicsConfig
  debugMode: boolean
  enableAI: boolean
}

/**
 * AI action types for cognitive bridge
 */
export enum AIGameAction {
  SUGGEST_MOVE = 'suggest_move',
  SUGGEST_JUMP = 'suggest_jump',
  SUGGEST_ATTACK = 'suggest_attack',
  WARN_DANGER = 'warn_danger',
  CONGRATULATE = 'congratulate',
  PROVIDE_TIP = 'provide_tip',
  ANALYZE_SITUATION = 'analyze_situation',
}

/**
 * AI perception of game state
 */
export interface AIGamePerception {
  playerHealth: number
  playerScore: number
  nearbyEnemies: number
  nearbyCollectibles: number
  levelProgress: number
  difficulty: 'easy' | 'medium' | 'hard'
  situation: string
  recommendations: string[]
}
