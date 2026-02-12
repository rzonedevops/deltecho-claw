/**
 * AI-Game Bridge
 * Connects Deep Tree Echo AI with the game engine
 */

import { EventEmitter } from 'events'
import type { GameEngine } from '../core/GameEngine.js'
import type {
  GameState,
  GameEvent,
  AIGameAction,
  AIGamePerception,
  GameEventType,
} from '../types/index.js'

export interface AIGameBridgeConfig {
  enableProactiveSuggestions: boolean
  suggestionCooldown: number // milliseconds
  enableDangerWarnings: boolean
  enableCongratulations: boolean
}

/**
 * Bridge between AI companions and game engine
 */
export class AIGameBridge extends EventEmitter {
  private gameEngine: GameEngine
  private config: AIGameBridgeConfig
  private lastSuggestionTime: number = 0
  private gameEventHistory: GameEvent[] = []
  private maxHistorySize: number = 100

  constructor(gameEngine: GameEngine, config: AIGameBridgeConfig) {
    super()
    this.gameEngine = gameEngine
    this.config = config

    // Listen to game events
    this.gameEngine.on('gameEvent', (event: GameEvent) => {
      this.handleGameEvent(event)
    })

    this.gameEngine.on('stateUpdate', (state: GameState) => {
      this.analyzeGameState(state)
    })
  }

  /**
   * Get AI perception of current game state
   */
  public getPerception(): AIGamePerception {
    const state = this.gameEngine.getState()
    const player = state.player

    if (!player) {
      return {
        playerHealth: 0,
        playerScore: 0,
        nearbyEnemies: 0,
        nearbyCollectibles: 0,
        levelProgress: 0,
        difficulty: 'medium',
        situation: 'No player found',
        recommendations: [],
      }
    }

    // Count nearby entities
    const nearbyRange = 200
    const nearbyEnemies = state.entities.filter(
      (e) =>
        e.type === 'enemy' &&
        e.active &&
        this.distance(player.position, e.position) < nearbyRange
    ).length

    const nearbyCollectibles = state.entities.filter(
      (e) =>
        e.type === 'collectible' &&
        e.active &&
        this.distance(player.position, e.position) < nearbyRange
    ).length

    // Calculate level progress
    const levelProgress = state.currentLevel
      ? (player.position.x / state.currentLevel.width) * 100
      : 0

    // Determine difficulty based on recent events
    const recentDamage = this.gameEventHistory
      .slice(-20)
      .filter((e) => e.type === GameEventType.PLAYER_DAMAGED).length
    const difficulty = recentDamage > 5 ? 'hard' : recentDamage > 2 ? 'medium' : 'easy'

    // Analyze situation
    const situation = this.analyzeSituation(state)
    const recommendations = this.generateRecommendations(state)

    return {
      playerHealth: player.health,
      playerScore: player.score,
      nearbyEnemies,
      nearbyCollectibles,
      levelProgress,
      difficulty,
      situation,
      recommendations,
    }
  }

  /**
   * Execute AI-suggested action
   */
  public executeAIAction(action: AIGameAction, params?: any): void {
    switch (action) {
      case AIGameAction.SUGGEST_MOVE:
        this.suggestMove(params?.direction)
        break
      case AIGameAction.SUGGEST_JUMP:
        this.suggestJump()
        break
      case AIGameAction.SUGGEST_ATTACK:
        this.suggestAttack()
        break
      case AIGameAction.WARN_DANGER:
        this.warnDanger(params?.message)
        break
      case AIGameAction.CONGRATULATE:
        this.congratulate(params?.achievement)
        break
      case AIGameAction.PROVIDE_TIP:
        this.provideTip(params?.tip)
        break
      case AIGameAction.ANALYZE_SITUATION:
        this.emit('aiMessage', {
          type: 'analysis',
          content: this.analyzeSituation(this.gameEngine.getState()),
        })
        break
    }
  }

  /**
   * Get recent game events for AI context
   */
  public getRecentEvents(count: number = 10): GameEvent[] {
    return this.gameEventHistory.slice(-count)
  }

  /**
   * Handle game events
   */
  private handleGameEvent(event: GameEvent): void {
    // Store event in history
    this.gameEventHistory.push(event)
    if (this.gameEventHistory.length > this.maxHistorySize) {
      this.gameEventHistory.shift()
    }

    // React to important events
    switch (event.type) {
      case GameEventType.PLAYER_DAMAGED:
        if (this.config.enableDangerWarnings) {
          this.warnDanger('You took damage! Be careful!')
        }
        break

      case GameEventType.COLLECTIBLE_ACQUIRED:
        if (this.config.enableCongratulations && Math.random() > 0.7) {
          this.congratulate('Nice find!')
        }
        break

      case GameEventType.CHECKPOINT_REACHED:
        if (this.config.enableCongratulations) {
          this.congratulate('Checkpoint reached! Progress saved.')
        }
        break

      case GameEventType.LEVEL_COMPLETE:
        if (this.config.enableCongratulations) {
          this.congratulate('Amazing! Level complete!')
        }
        break

      case GameEventType.PLAYER_DIED:
        this.emit('aiMessage', {
          type: 'support',
          content: "Don't give up! You can do this!",
        })
        break
    }
  }

  /**
   * Analyze game state and provide proactive suggestions
   */
  private analyzeGameState(state: GameState): void {
    if (!this.config.enableProactiveSuggestions) return
    if (!state.player) return

    const now = Date.now()
    if (now - this.lastSuggestionTime < this.config.suggestionCooldown) {
      return
    }

    const perception = this.getPerception()

    // Suggest actions based on situation
    if (perception.nearbyEnemies > 2 && perception.playerHealth < 30) {
      this.warnDanger('Low health and multiple enemies nearby! Consider retreating.')
      this.lastSuggestionTime = now
    } else if (perception.nearbyCollectibles > 0 && perception.playerScore < 500) {
      this.provideTip('There are collectibles nearby worth grabbing!')
      this.lastSuggestionTime = now
    }
  }

  /**
   * Analyze current situation
   */
  private analyzeSituation(state: GameState): string {
    if (!state.player) return 'No active player'

    const player = state.player
    const recentEvents = this.gameEventHistory.slice(-10)

    if (player.health < 20) {
      return 'Critical health - immediate danger!'
    } else if (player.health < 50) {
      return 'Health is low - proceed with caution'
    } else if (recentEvents.some((e) => e.type === GameEventType.PLAYER_ATTACK)) {
      return 'In combat'
    } else if (player.state === 'jumping' || player.state === 'falling') {
      return 'Platforming'
    } else if (player.state === 'running') {
      return 'Moving forward'
    } else {
      return 'Idle - ready for action'
    }
  }

  /**
   * Generate gameplay recommendations
   */
  private generateRecommendations(state: GameState): string[] {
    const recommendations: string[] = []
    const player = state.player

    if (!player) return recommendations

    if (player.health < 50) {
      recommendations.push('Find health pickups to restore HP')
    }

    if (player.score < 1000) {
      recommendations.push('Collect treasures to increase score')
    }

    const perception = this.getPerception()
    if (perception.nearbyEnemies > 0) {
      recommendations.push('Watch out for enemies - time your attacks')
    }

    if (perception.levelProgress < 30) {
      recommendations.push('Keep moving forward to progress')
    }

    return recommendations
  }

  /**
   * Suggest movement direction
   */
  private suggestMove(direction: 'left' | 'right'): void {
    this.emit('aiMessage', {
      type: 'suggestion',
      content: `I suggest moving ${direction}`,
      action: AIGameAction.SUGGEST_MOVE,
      params: { direction },
    })
  }

  /**
   * Suggest jump
   */
  private suggestJump(): void {
    this.emit('aiMessage', {
      type: 'suggestion',
      content: 'Try jumping here!',
      action: AIGameAction.SUGGEST_JUMP,
    })
  }

  /**
   * Suggest attack
   */
  private suggestAttack(): void {
    this.emit('aiMessage', {
      type: 'suggestion',
      content: 'Now would be a good time to attack!',
      action: AIGameAction.SUGGEST_ATTACK,
    })
  }

  /**
   * Warn about danger
   */
  private warnDanger(message: string): void {
    this.emit('aiMessage', {
      type: 'warning',
      content: message,
      action: AIGameAction.WARN_DANGER,
    })
  }

  /**
   * Congratulate player
   */
  private congratulate(achievement: string): void {
    this.emit('aiMessage', {
      type: 'congratulation',
      content: achievement,
      action: AIGameAction.CONGRATULATE,
    })
  }

  /**
   * Provide gameplay tip
   */
  private provideTip(tip: string): void {
    this.emit('aiMessage', {
      type: 'tip',
      content: tip,
      action: AIGameAction.PROVIDE_TIP,
    })
  }

  /**
   * Calculate distance between two points
   */
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  }
}
