/**
 * Canvas Renderer for Deltecho-Claw Game Engine
 * Handles rendering game state to HTML5 canvas
 */

import type { GameState, GameEntity, PlayerEntity, EntityType } from '../types/index.js'

export interface RendererConfig {
  canvas: HTMLCanvasElement
  debugMode?: boolean
  showFPS?: boolean
}

/**
 * Simple 2D renderer for the game
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private debugMode: boolean
  private showFPS: boolean
  private frameCount: number = 0
  private lastFPSUpdate: number = 0
  private currentFPS: number = 0

  constructor(config: RendererConfig) {
    this.canvas = config.canvas
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D rendering context')
    }
    this.ctx = ctx
    this.debugMode = config.debugMode ?? false
    this.showFPS = config.showFPS ?? false
  }

  /**
   * Render the current game state
   */
  public render(state: GameState): void {
    this.clear()

    if (!state.currentLevel) {
      this.renderNoLevel()
      return
    }

    // Save context for camera transformation
    this.ctx.save()

    // Apply camera transformation
    this.ctx.translate(-state.camera.x, -state.camera.y)

    // Render background
    this.renderBackground(state)

    // Render entities
    for (const entity of state.entities) {
      if (entity.visible && this.isInView(entity, state.camera)) {
        this.renderEntity(entity)
      }
    }

    // Restore context
    this.ctx.restore()

    // Render UI (not affected by camera)
    this.renderUI(state)

    // Update FPS counter
    this.updateFPS()
  }

  /**
   * Clear canvas
   */
  private clear(): void {
    this.ctx.fillStyle = '#87CEEB' // Sky blue
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Render background
   */
  private renderBackground(state: GameState): void {
    if (!state.currentLevel) return

    this.ctx.fillStyle = state.currentLevel.backgroundColor || '#87CEEB'
    this.ctx.fillRect(
      state.camera.x,
      state.camera.y,
      this.canvas.width,
      this.canvas.height
    )
  }

  /**
   * Render a single entity
   */
  private renderEntity(entity: GameEntity): void {
    switch (entity.type) {
      case EntityType.PLAYER:
        this.renderPlayer(entity as PlayerEntity)
        break
      case EntityType.PLATFORM:
        this.renderPlatform(entity)
        break
      case EntityType.ENEMY:
        this.renderEnemy(entity)
        break
      case EntityType.COLLECTIBLE:
        this.renderCollectible(entity)
        break
      case EntityType.CHECKPOINT:
        this.renderCheckpoint(entity)
        break
      default:
        this.renderDefault(entity)
    }

    if (this.debugMode) {
      this.renderDebugInfo(entity)
    }
  }

  /**
   * Render player
   */
  private renderPlayer(player: PlayerEntity): void {
    const { x, y } = player.position

    // Body
    this.ctx.fillStyle = '#FF6B35'
    this.ctx.fillRect(x, y, player.width, player.height)

    // Face direction indicator
    this.ctx.fillStyle = '#FFD700'
    const faceX = player.facing === 'right' ? x + player.width - 8 : x + 4
    this.ctx.fillRect(faceX, y + 10, 4, 4)

    // Health bar
    this.renderHealthBar(x, y - 10, player.width, player.health, player.maxHealth)

    // State indicator (for debug)
    if (this.debugMode) {
      this.ctx.fillStyle = '#000'
      this.ctx.font = '10px monospace'
      this.ctx.fillText(player.state, x, y - 15)
    }
  }

  /**
   * Render platform
   */
  private renderPlatform(entity: GameEntity): void {
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(entity.position.x, entity.position.y, entity.width, entity.height)

    // Border
    this.ctx.strokeStyle = '#654321'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(entity.position.x, entity.position.y, entity.width, entity.height)
  }

  /**
   * Render enemy
   */
  private renderEnemy(entity: GameEntity): void {
    this.ctx.fillStyle = '#DC143C'
    this.ctx.fillRect(entity.position.x, entity.position.y, entity.width, entity.height)

    // Eyes
    this.ctx.fillStyle = '#FFF'
    this.ctx.fillRect(entity.position.x + 8, entity.position.y + 8, 6, 6)
    this.ctx.fillRect(entity.position.x + 18, entity.position.y + 8, 6, 6)
  }

  /**
   * Render collectible
   */
  private renderCollectible(entity: GameEntity): void {
    const { x, y } = entity.position
    const centerX = x + entity.width / 2
    const centerY = y + entity.height / 2
    const radius = Math.min(entity.width, entity.height) / 2

    // Coin/gem
    this.ctx.fillStyle = '#FFD700'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Shine
    this.ctx.fillStyle = '#FFF'
    this.ctx.beginPath()
    this.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  /**
   * Render checkpoint
   */
  private renderCheckpoint(entity: GameEntity): void {
    this.ctx.fillStyle = '#32CD32'
    this.ctx.fillRect(entity.position.x, entity.position.y, entity.width, entity.height)

    // Flag pattern
    this.ctx.fillStyle = '#FFF'
    for (let i = 0; i < 3; i++) {
      this.ctx.fillRect(
        entity.position.x + i * 8,
        entity.position.y + i * 8,
        4,
        4
      )
    }
  }

  /**
   * Render default entity
   */
  private renderDefault(entity: GameEntity): void {
    this.ctx.fillStyle = '#808080'
    this.ctx.fillRect(entity.position.x, entity.position.y, entity.width, entity.height)
  }

  /**
   * Render health bar
   */
  private renderHealthBar(
    x: number,
    y: number,
    width: number,
    current: number,
    max: number
  ): void {
    const barHeight = 4
    const healthPercent = Math.max(0, Math.min(1, current / max))

    // Background
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(x, y, width, barHeight)

    // Health
    const healthColor = healthPercent > 0.5 ? '#0F0' : healthPercent > 0.25 ? '#FF0' : '#F00'
    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x, y, width * healthPercent, barHeight)
  }

  /**
   * Render UI elements
   */
  private renderUI(state: GameState): void {
    if (!state.player) return

    const padding = 20

    // Score
    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.fillText(`Score: ${state.player.score}`, padding, padding + 24)

    // Lives
    this.ctx.fillText(`Lives: ${state.player.lives}`, padding, padding + 54)

    // Health
    const healthText = `Health: ${Math.round(state.player.health)}/${state.player.maxHealth}`
    this.ctx.fillText(healthText, padding, padding + 84)

    // Paused indicator
    if (state.paused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = '#FFF'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.textAlign = 'left'
    }

    // Game over
    if (state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = '#F00'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2)

      this.ctx.fillStyle = '#FFF'
      this.ctx.font = '24px Arial'
      this.ctx.fillText(
        `Final Score: ${state.player.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 50
      )
      this.ctx.textAlign = 'left'
    }

    // FPS counter
    if (this.showFPS) {
      this.ctx.fillStyle = '#FFF'
      this.ctx.font = '16px monospace'
      this.ctx.textAlign = 'right'
      this.ctx.fillText(`FPS: ${this.currentFPS}`, this.canvas.width - padding, padding + 16)
      this.ctx.textAlign = 'left'
    }
  }

  /**
   * Render debug info for entity
   */
  private renderDebugInfo(entity: GameEntity): void {
    const { x, y } = entity.position

    // Bounding box
    this.ctx.strokeStyle = '#0F0'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, entity.width, entity.height)

    // Velocity vector
    if (entity.velocity.x !== 0 || entity.velocity.y !== 0) {
      this.ctx.strokeStyle = '#F00'
      this.ctx.beginPath()
      this.ctx.moveTo(x + entity.width / 2, y + entity.height / 2)
      this.ctx.lineTo(
        x + entity.width / 2 + entity.velocity.x * 10,
        y + entity.height / 2 + entity.velocity.y * 10
      )
      this.ctx.stroke()
    }
  }

  /**
   * Render "no level loaded" message
   */
  private renderNoLevel(): void {
    this.ctx.fillStyle = '#000'
    this.ctx.font = '24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('No level loaded', this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.textAlign = 'left'
  }

  /**
   * Check if entity is in camera view
   */
  private isInView(
    entity: GameEntity,
    camera: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      entity.position.x + entity.width >= camera.x &&
      entity.position.x <= camera.x + camera.width &&
      entity.position.y + entity.height >= camera.y &&
      entity.position.y <= camera.y + camera.height
    )
  }

  /**
   * Update FPS counter
   */
  private updateFPS(): void {
    this.frameCount++
    const now = performance.now()

    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate))
      this.frameCount = 0
      this.lastFPSUpdate = now
    }
  }

  /**
   * Set debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Set FPS display
   */
  public setShowFPS(enabled: boolean): void {
    this.showFPS = enabled
  }
}
