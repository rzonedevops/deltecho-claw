/**
 * Session Manager
 * Manages conversation sessions across different channels
 */

import { EventEmitter } from 'events'
import type {
  Session,
  ChannelType,
  InboundMessage,
  ContextMessage,
  GatewayEvent,
} from '../types/index.js'
import { SessionMode } from '../types/index.js'

export class SessionManager extends EventEmitter {
  private sessions: Map<string, Session> = new Map()
  private readonly maxContextMessages: number = 50
  private readonly sessionTimeoutMs: number = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    super()
  }

  /**
   * Get or create a session for a user/chat
   */
  public getOrCreateSession(
    channelType: ChannelType,
    channelId: string,
    userId: string,
    chatId: string,
    mode: SessionMode = SessionMode.AUTO
  ): Session {
    const sessionId = this.generateSessionId(channelType, channelId, userId, chatId)

    let session = this.sessions.get(sessionId)

    if (!session) {
      session = this.createSession(channelType, channelId, userId, chatId, mode)
      this.sessions.set(sessionId, session)
      this.emit('session:created' as GatewayEvent, session)
    } else {
      // Update last activity
      session.lastActivityAt = Date.now()
    }

    return session
  }

  /**
   * Get a session by ID
   */
  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Add a message to the session context
   */
  public addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageId?: string
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const contextMessage: ContextMessage = {
      role,
      content,
      timestamp: Date.now(),
      messageId,
    }

    session.context.messages.push(contextMessage)
    session.messageCount++
    session.lastActivityAt = Date.now()

    // Trim context if it exceeds max
    if (session.context.messages.length > this.maxContextMessages) {
      const systemMessages = session.context.messages.filter((m) => m.role === 'system')
      const otherMessages = session.context.messages
        .filter((m) => m.role !== 'system')
        .slice(-this.maxContextMessages + systemMessages.length)
      session.context.messages = [...systemMessages, ...otherMessages]
    }

    this.emit('session:updated' as GatewayEvent, session)
  }

  /**
   * Update session mode
   */
  public updateSessionMode(sessionId: string, mode: SessionMode): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.mode = mode
    this.emit('session:updated' as GatewayEvent, session)
  }

  /**
   * End a session
   */
  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.active = false
    this.emit('session:ended' as GatewayEvent, session)
    this.sessions.delete(sessionId)
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter((s) => s.active)
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > this.sessionTimeoutMs) {
        this.endSession(sessionId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Create a new session
   */
  private createSession(
    channelType: ChannelType,
    channelId: string,
    userId: string,
    chatId: string,
    mode: SessionMode
  ): Session {
    const sessionId = this.generateSessionId(channelType, channelId, userId, chatId)

    return {
      id: sessionId,
      channelType,
      channelId,
      userId,
      chatId,
      mode,
      active: true,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      messageCount: 0,
      context: {
        messages: [],
      },
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(
    channelType: ChannelType,
    channelId: string,
    userId: string,
    chatId: string
  ): string {
    return `${channelType}:${channelId}:${chatId}:${userId}`
  }

  /**
   * Start periodic cleanup
   */
  public startPeriodicCleanup(intervalMs: number = 3600000): void {
    // Default: 1 hour
    setInterval(() => {
      const cleaned = this.cleanupExpiredSessions()
      if (cleaned > 0) {
        console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`)
      }
    }, intervalMs)
  }
}
