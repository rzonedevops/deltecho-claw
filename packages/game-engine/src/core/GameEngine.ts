/**
 * Deltecho-Claw Game Engine Core
 * Main game engine implementation inspired by OpenClaw
 */

import { EventEmitter } from 'events'
import type {
  GameState,
  GameConfig,
  InputState,
  GameEvent,
  GameEventType,
  PlayerEntity,
  GameEntity,
  Vector2D,
  Level,
  EntityType,
  PlayerState,
} from '../types/index.js'

export class GameEngine extends EventEmitter {
  private config: GameConfig
  private gameState: GameState
  private inputState: InputState
  private lastFrameTime: number = 0
  private animationFrameId?: number
  private running: boolean = false

  constructor(config: GameConfig) {
    super()
    this.config = config
    this.gameState = this.createInitialGameState()
    this.inputState = this.createInitialInputState()
  }

  /**
   * Initialize the game with a level
   */
  public loadLevel(level: Level): void {
    this.gameState.currentLevel = level
    this.gameState.entities = [...level.entities]

    // Create player entity at spawn point
    this.gameState.player = this.createPlayer(level.spawnPoint)
    this.gameState.entities.push(this.gameState.player)

    // Reset camera to follow player
    this.gameState.camera.x = level.spawnPoint.x - this.config.canvasWidth / 2
    this.gameState.camera.y = level.spawnPoint.y - this.config.canvasHeight / 2

    this.emitEvent(GameEventType.LEVEL_COMPLETE, { level: level.id })
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) return
    this.running = true
    this.lastFrameTime = performance.now()
    this.gameLoop(this.lastFrameTime)
  }

  /**
   * Pause the game
   */
  public pause(): void {
    this.gameState.paused = true
  }

  /**
   * Resume the game
   */
  public resume(): void {
    this.gameState.paused = false
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.running = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  /**
   * Update input state
   */
  public updateInput(input: Partial<InputState>): void {
    Object.assign(this.inputState, input)
  }

  /**
   * Get current game state (immutable copy)
   */
  public getState(): Readonly<GameState> {
    return { ...this.gameState }
  }

  /**
   * Main game loop
   */
  private gameLoop(timestamp: number): void {
    if (!this.running) return

    const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1)
    this.lastFrameTime = timestamp

    if (!this.gameState.paused && !this.gameState.gameOver) {
      this.update(deltaTime)
    }

    // Emit state update for rendering
    this.emit('stateUpdate', this.gameState)

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t))
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    this.gameState.elapsedTime += deltaTime

    if (!this.gameState.player) return

    // Update player based on input
    this.updatePlayer(this.gameState.player, deltaTime)

    // Update other entities
    this.updateEntities(deltaTime)

    // Check collisions
    this.checkCollisions()

    // Update camera to follow player
    this.updateCamera()

    // Check win/lose conditions
    this.checkGameConditions()
  }

  /**
   * Update player entity
   */
  private updatePlayer(player: PlayerEntity, deltaTime: number): void {
    const { physics } = this.config

    // Apply gravity
    if (!player.onGround) {
      player.velocity.y += physics.gravity * deltaTime
    }

    // Handle horizontal movement
    if (this.inputState.left) {
      player.velocity.x = -physics.moveSpeed
      player.facing = 'left'
      player.state = player.onGround ? PlayerState.RUNNING : player.state
    } else if (this.inputState.right) {
      player.velocity.x = physics.moveSpeed
      player.facing = 'right'
      player.state = player.onGround ? PlayerState.RUNNING : player.state
    } else {
      player.velocity.x *= physics.friction
      if (player.onGround && Math.abs(player.velocity.x) < 0.1) {
        player.state = PlayerState.IDLE
        player.velocity.x = 0
      }
    }

    // Handle jumping
    if (this.inputState.jump && player.onGround) {
      player.velocity.y = -physics.jumpForce
      player.onGround = false
      player.state = PlayerState.JUMPING
      this.emitEvent(GameEventType.PLAYER_JUMP)
    }

    // Handle attack
    if (this.inputState.attack && player.state !== PlayerState.ATTACKING) {
      player.state = PlayerState.ATTACKING
      this.emitEvent(GameEventType.PLAYER_ATTACK)
      // Reset attack state after animation
      setTimeout(() => {
        if (player.state === PlayerState.ATTACKING) {
          player.state = player.onGround ? PlayerState.IDLE : PlayerState.FALLING
        }
      }, 300)
    }

    // Clamp velocities
    player.velocity.x = Math.max(
      -physics.maxVelocityX,
      Math.min(physics.maxVelocityX, player.velocity.x)
    )
    player.velocity.y = Math.max(
      -physics.maxVelocityY,
      Math.min(physics.maxVelocityY, player.velocity.y)
    )

    // Update position
    player.position.x += player.velocity.x * deltaTime
    player.position.y += player.velocity.y * deltaTime

    // Update state based on velocity
    if (!player.onGround && player.velocity.y > 0) {
      player.state = PlayerState.FALLING
    }
  }

  /**
   * Update all entities
   */
  private updateEntities(deltaTime: number): void {
    // Simple entity updates - can be extended for AI behavior
    for (const entity of this.gameState.entities) {
      if (entity.type !== EntityType.PLAYER && entity.active) {
        // Basic entity physics
        entity.velocity.y += this.config.physics.gravity * deltaTime
        entity.position.x += entity.velocity.x * deltaTime
        entity.position.y += entity.velocity.y * deltaTime
      }
    }
  }

  /**
   * Check collisions between entities
   */
  private checkCollisions(): void {
    if (!this.gameState.player) return

    const player = this.gameState.player
    player.onGround = false

    for (const entity of this.gameState.entities) {
      if (entity === player || !entity.active) continue

      if (this.checkAABB(player, entity)) {
        this.handleCollision(player, entity)
      }
    }
  }

  /**
   * AABB collision detection
   */
  private checkAABB(a: GameEntity, b: GameEntity): boolean {
    return (
      a.position.x < b.position.x + b.width &&
      a.position.x + a.width > b.position.x &&
      a.position.y < b.position.y + b.height &&
      a.position.y + a.height > b.position.y
    )
  }

  /**
   * Handle collision between entities
   */
  private handleCollision(player: PlayerEntity, entity: GameEntity): void {
    switch (entity.type) {
      case EntityType.PLATFORM:
        // Simple ground collision
        if (player.velocity.y > 0) {
          player.position.y = entity.position.y - player.height
          player.velocity.y = 0
          player.onGround = true
        }
        break

      case EntityType.ENEMY:
        // Damage player
        player.health -= 10
        this.emitEvent(GameEventType.PLAYER_DAMAGED, { damage: 10 })
        if (player.health <= 0) {
          this.handlePlayerDeath()
        }
        break

      case EntityType.COLLECTIBLE:
        // Collect item
        entity.active = false
        player.score += 100
        this.emitEvent(GameEventType.COLLECTIBLE_ACQUIRED, { score: 100 })
        this.emitEvent(GameEventType.SCORE_CHANGED, { score: player.score })
        break

      case EntityType.CHECKPOINT:
        this.emitEvent(GameEventType.CHECKPOINT_REACHED, {
          position: entity.position,
        })
        break
    }
  }

  /**
   * Update camera to follow player
   */
  private updateCamera(): void {
    if (!this.gameState.player) return

    const player = this.gameState.player
    const targetX = player.position.x - this.config.canvasWidth / 2
    const targetY = player.position.y - this.config.canvasHeight / 2

    // Smooth camera movement
    this.gameState.camera.x += (targetX - this.gameState.camera.x) * 0.1
    this.gameState.camera.y += (targetY - this.gameState.camera.y) * 0.1

    // Keep camera within level bounds
    if (this.gameState.currentLevel) {
      this.gameState.camera.x = Math.max(
        0,
        Math.min(
          this.gameState.currentLevel.width - this.config.canvasWidth,
          this.gameState.camera.x
        )
      )
      this.gameState.camera.y = Math.max(
        0,
        Math.min(
          this.gameState.currentLevel.height - this.config.canvasHeight,
          this.gameState.camera.y
        )
      )
    }
  }

  /**
   * Check game win/lose conditions
   */
  private checkGameConditions(): void {
    if (!this.gameState.player) return

    // Check if player fell off the map
    if (
      this.gameState.currentLevel &&
      this.gameState.player.position.y > this.gameState.currentLevel.height
    ) {
      this.handlePlayerDeath()
    }
  }

  /**
   * Handle player death
   */
  private handlePlayerDeath(): void {
    if (!this.gameState.player) return

    this.gameState.player.state = PlayerState.DEAD
    this.gameState.player.lives -= 1

    this.emitEvent(GameEventType.PLAYER_DIED, {
      lives: this.gameState.player.lives,
    })

    if (this.gameState.player.lives <= 0) {
      this.gameState.gameOver = true
      this.emitEvent(GameEventType.GAME_OVER)
    } else {
      // Respawn player
      setTimeout(() => {
        this.respawnPlayer()
      }, 2000)
    }
  }

  /**
   * Respawn player at spawn point
   */
  private respawnPlayer(): void {
    if (!this.gameState.player || !this.gameState.currentLevel) return

    this.gameState.player.position = { ...this.gameState.currentLevel.spawnPoint }
    this.gameState.player.velocity = { x: 0, y: 0 }
    this.gameState.player.health = this.gameState.player.maxHealth
    this.gameState.player.state = PlayerState.IDLE
  }

  /**
   * Create initial game state
   */
  private createInitialGameState(): GameState {
    return {
      entities: [],
      camera: {
        x: 0,
        y: 0,
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
      },
      paused: false,
      gameOver: false,
      levelComplete: false,
      elapsedTime: 0,
    }
  }

  /**
   * Create initial input state
   */
  private createInitialInputState(): InputState {
    return {
      left: false,
      right: false,
      jump: false,
      attack: false,
      duck: false,
      up: false,
      down: false,
    }
  }

  /**
   * Create player entity
   */
  private createPlayer(spawnPoint: Vector2D): PlayerEntity {
    return {
      id: 'player',
      type: EntityType.PLAYER,
      position: { ...spawnPoint },
      velocity: { x: 0, y: 0 },
      width: 32,
      height: 48,
      active: true,
      visible: true,
      state: PlayerState.IDLE,
      health: 100,
      maxHealth: 100,
      score: 0,
      lives: 3,
      facing: 'right',
      onGround: false,
      canDoubleJump: false,
    }
  }

  /**
   * Emit game event
   */
  private emitEvent(type: GameEventType, data?: any): void {
    const event: GameEvent = {
      type,
      timestamp: Date.now(),
      data,
    }
    this.emit('gameEvent', event)
  }
}
