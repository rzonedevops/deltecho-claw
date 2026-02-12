/**
 * OpenClaw Gateway Server
 * WebSocket-based control plane for multi-channel AI assistant
 */

import { EventEmitter } from 'events'
import { WebSocketServer, WebSocket } from 'ws'
import type { Server as HTTPServer } from 'http'
import { SessionManager } from '../sessions/SessionManager.js'
import { SkillsRegistry } from '../skills/SkillsRegistry.js'
import type {
  GatewayConfig,
  GatewayEvent,
  InboundMessage,
  OutboundMessage,
  ChannelAdapter,
  WSMessage,
  WSMessageType,
  ChannelType,
} from '../types/index.js'

export class GatewayServer extends EventEmitter {
  private config: GatewayConfig
  private wss?: WebSocketServer
  private sessionManager: SessionManager
  private skillsRegistry: SkillsRegistry
  private channelAdapters: Map<string, ChannelAdapter> = new Map()
  private wsClients: Set<WebSocket> = new Set()
  private isRunning: boolean = false

  constructor(config: GatewayConfig) {
    super()
    this.config = config
    this.sessionManager = new SessionManager()
    this.skillsRegistry = new SkillsRegistry()

    // Forward session events
    this.sessionManager.on('session:created', (session) => {
      this.emit('session:created' as GatewayEvent, session)
      this.broadcastToClients({ type: WSMessageType.EVENT, payload: { event: 'session:created', session } })
    })

    this.sessionManager.on('session:updated', (session) => {
      this.emit('session:updated' as GatewayEvent, session)
    })

    this.sessionManager.on('session:ended', (session) => {
      this.emit('session:ended' as GatewayEvent, session)
      this.broadcastToClients({ type: WSMessageType.EVENT, payload: { event: 'session:ended', session } })
    })

    // Forward skill events
    this.skillsRegistry.on('skill:executed', (data) => {
      this.emit('skill:executed' as GatewayEvent, data)
    })
  }

  /**
   * Start the gateway server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Gateway] Already running')
      return
    }

    console.log(`[Gateway] Starting on ${this.config.host || '0.0.0.0'}:${this.config.port}`)

    // Create WebSocket server
    this.wss = new WebSocketServer({
      port: this.config.port,
      host: this.config.host,
    })

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleClientConnection(ws)
    })

    this.wss.on('error', (error: Error) => {
      console.error('[Gateway] WebSocket error:', error)
      this.emit('error' as GatewayEvent, error)
    })

    // Start periodic session cleanup
    this.sessionManager.startPeriodicCleanup()

    // Connect enabled channels
    await this.connectChannels()

    this.isRunning = true
    console.log('[Gateway] Started successfully')
    console.log(`[Gateway] WebSocket: ws://${this.config.host || 'localhost'}:${this.config.port}`)

    if (this.config.enableWebUI) {
      console.log(`[Gateway] Web UI: http://${this.config.host || 'localhost'}:${this.config.port}/ui`)
    }
  }

  /**
   * Stop the gateway server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('[Gateway] Stopping...')

    // Disconnect all channels
    await this.disconnectChannels()

    // Close all WebSocket connections
    for (const client of this.wsClients) {
      client.close()
    }

    // Close WebSocket server
    if (this.wss) {
      this.wss.close()
    }

    this.isRunning = false
    console.log('[Gateway] Stopped')
  }

  /**
   * Register a channel adapter
   */
  public registerChannel(adapter: ChannelAdapter): void {
    const key = `${adapter.type}:${adapter.id}`
    this.channelAdapters.set(key, adapter)

    // Forward channel messages to gateway
    adapter.on('message', (message: InboundMessage) => {
      this.handleInboundMessage(message)
    })

    console.log(`[Gateway] Registered channel: ${key}`)
  }

  /**
   * Send a message through a channel
   */
  public async sendMessage(message: OutboundMessage): Promise<void> {
    const key = `${message.channelType}:${message.channelId}`
    const adapter = this.channelAdapters.get(key)

    if (!adapter) {
      throw new Error(`Channel not found: ${key}`)
    }

    if (!adapter.connected) {
      throw new Error(`Channel not connected: ${key}`)
    }

    await adapter.sendMessage(message)
    this.emit('message:sent' as GatewayEvent, message)
  }

  /**
   * Get session manager
   */
  public getSessionManager(): SessionManager {
    return this.sessionManager
  }

  /**
   * Get skills registry
   */
  public getSkillsRegistry(): SkillsRegistry {
    return this.skillsRegistry
  }

  /**
   * Get all connected channels
   */
  public getConnectedChannels(): ChannelAdapter[] {
    return Array.from(this.channelAdapters.values()).filter((a) => a.connected)
  }

  /**
   * Handle client WebSocket connection
   */
  private handleClientConnection(ws: WebSocket): void {
    console.log('[Gateway] Client connected')
    this.wsClients.add(ws)

    // Send welcome message
    this.sendToClient(ws, {
      type: WSMessageType.EVENT,
      payload: {
        event: 'connected',
        gateway: 'Deltecho-Claw Gateway',
        version: '1.0.0',
      },
    })

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())
        this.handleClientMessage(ws, message)
      } catch (error) {
        console.error('[Gateway] Error parsing client message:', error)
      }
    })

    ws.on('close', () => {
      console.log('[Gateway] Client disconnected')
      this.wsClients.delete(ws)
    })

    ws.on('error', (error: Error) => {
      console.error('[Gateway] Client error:', error)
    })
  }

  /**
   * Handle client message
   */
  private handleClientMessage(ws: WebSocket, message: WSMessage): void {
    switch (message.type) {
      case WSMessageType.PING:
        this.sendToClient(ws, { type: WSMessageType.PONG })
        break

      case WSMessageType.AUTH:
        // TODO: Implement authentication
        this.sendToClient(ws, {
          type: WSMessageType.EVENT,
          payload: { event: 'authenticated' },
        })
        break

      case WSMessageType.SUBSCRIBE:
        // TODO: Implement subscriptions
        console.log('[Gateway] Client subscribed to:', message.payload)
        break

      case WSMessageType.SEND_MESSAGE:
        // Send message through channel
        this.sendMessage(message.payload).catch((error) => {
          this.sendToClient(ws, {
            type: WSMessageType.ERROR,
            payload: { error: error.message },
          })
        })
        break

      default:
        console.warn('[Gateway] Unknown message type:', message.type)
    }
  }

  /**
   * Handle inbound message from a channel
   */
  private async handleInboundMessage(message: InboundMessage): Promise<void> {
    console.log(`[Gateway] Inbound message from ${message.channelType}:${message.channelId}`)

    this.emit('message:received' as GatewayEvent, message)

    // Get or create session
    const session = this.sessionManager.getOrCreateSession(
      message.channelType,
      message.channelId,
      message.senderId,
      message.chatId
    )

    // Add user message to session context
    this.sessionManager.addMessage(session.id, 'user', message.content, message.id)

    // Check for skill commands
    if (message.content.startsWith('/')) {
      await this.handleSkillCommand(message, session.id)
      return
    }

    // TODO: Process message with AI (Deep Tree Echo integration)
    // For now, echo back
    const response = `Echo: ${message.content}`

    // Add assistant response to session
    this.sessionManager.addMessage(session.id, 'assistant', response)

    // Send response back
    await this.sendMessage({
      channelType: message.channelType,
      channelId: message.channelId,
      recipientId: message.senderId,
      chatId: message.chatId,
      messageType: message.messageType,
      content: response,
      replyTo: message.id,
    })
  }

  /**
   * Handle skill command
   */
  private async handleSkillCommand(message: InboundMessage, sessionId: string): Promise<void> {
    const parts = message.content.slice(1).split(' ')
    const skillId = parts[0]
    const args = parts.slice(1)

    const session = this.sessionManager.getSession(sessionId)
    if (!session) return

    // Parse parameters
    const parameters: Record<string, any> = {}
    for (let i = 0; i < args.length; i += 2) {
      if (args[i] && args[i + 1]) {
        parameters[args[i]] = args[i + 1]
      }
    }

    // Execute skill
    const result = await this.skillsRegistry.executeSkill(skillId, {
      session,
      message,
      parameters,
      gateway: this,
    })

    if (result.shouldReply && result.response) {
      // Add to session
      this.sessionManager.addMessage(sessionId, 'assistant', result.response)

      // Send response
      await this.sendMessage({
        channelType: message.channelType,
        channelId: message.channelId,
        recipientId: message.senderId,
        chatId: message.chatId,
        messageType: message.messageType,
        content: result.response,
        replyTo: message.id,
      })
    }
  }

  /**
   * Send message to a WebSocket client
   */
  private sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  /**
   * Broadcast message to all WebSocket clients
   */
  private broadcastToClients(message: WSMessage): void {
    for (const client of this.wsClients) {
      this.sendToClient(client, message)
    }
  }

  /**
   * Connect all enabled channels
   */
  private async connectChannels(): Promise<void> {
    const enabledChannels = this.config.channels.filter((c) => c.enabled)

    for (const channelConfig of enabledChannels) {
      const key = `${channelConfig.type}:${channelConfig.id}`
      const adapter = this.channelAdapters.get(key)

      if (adapter) {
        try {
          await adapter.connect()
          console.log(`[Gateway] Connected channel: ${key}`)
          this.emit('channel:connected' as GatewayEvent, adapter)
        } catch (error) {
          console.error(`[Gateway] Failed to connect channel ${key}:`, error)
        }
      } else {
        console.warn(`[Gateway] No adapter registered for ${key}`)
      }
    }
  }

  /**
   * Disconnect all channels
   */
  private async disconnectChannels(): Promise<void> {
    for (const adapter of this.channelAdapters.values()) {
      if (adapter.connected) {
        try {
          await adapter.disconnect()
          console.log(`[Gateway] Disconnected channel: ${adapter.type}:${adapter.id}`)
          this.emit('channel:disconnected' as GatewayEvent, adapter)
        } catch (error) {
          console.error(`[Gateway] Error disconnecting channel:`, error)
        }
      }
    }
  }
}
