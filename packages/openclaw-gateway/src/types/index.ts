/**
 * OpenClaw Gateway Types
 * Core type definitions for the gateway control plane
 */

/**
 * Message types supported by the gateway
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
}

/**
 * Channel types (messaging platforms)
 */
export enum ChannelType {
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
  WHATSAPP = 'whatsapp',
  SLACK = 'slack',
  SIGNAL = 'signal',
  IMESSAGE = 'imessage',
  MSTEAMS = 'msteams',
  MATRIX = 'matrix',
  DELTACHAT = 'deltachat',
  WEBCHAT = 'webchat',
}

/**
 * Session activation modes
 */
export enum SessionMode {
  DIRECT = 'direct', // Direct messages to AI
  MENTION = 'mention', // Only respond when mentioned
  REPLY = 'reply', // Only respond to replies
  AUTO = 'auto', // Auto-respond based on context
}

/**
 * Message direction
 */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

/**
 * Inbound message from a channel
 */
export interface InboundMessage {
  id: string
  channelType: ChannelType
  channelId: string
  senderId: string
  senderName?: string
  recipientId: string
  chatId: string
  messageType: MessageType
  content: string
  timestamp: number
  replyTo?: string
  mentions?: string[]
  attachments?: Attachment[]
  metadata?: Record<string, any>
}

/**
 * Outbound message to a channel
 */
export interface OutboundMessage {
  channelType: ChannelType
  channelId: string
  recipientId: string
  chatId: string
  messageType: MessageType
  content: string
  replyTo?: string
  attachments?: Attachment[]
  options?: MessageOptions
}

/**
 * Message attachment
 */
export interface Attachment {
  type: MessageType
  url?: string
  data?: Buffer
  filename?: string
  mimeType?: string
  size?: number
  metadata?: Record<string, any>
}

/**
 * Message options
 */
export interface MessageOptions {
  silent?: boolean
  disablePreview?: boolean
  markdown?: boolean
  parseMode?: 'markdown' | 'html' | 'none'
  keyboard?: any[]
  inline?: boolean
}

/**
 * Session data
 */
export interface Session {
  id: string
  channelType: ChannelType
  channelId: string
  userId: string
  chatId: string
  mode: SessionMode
  active: boolean
  createdAt: number
  lastActivityAt: number
  messageCount: number
  context: SessionContext
  metadata?: Record<string, any>
}

/**
 * Session context (conversation history)
 */
export interface SessionContext {
  messages: ContextMessage[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  model?: string
}

/**
 * Context message
 */
export interface ContextMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  messageId?: string
}

/**
 * Channel adapter interface
 */
export interface ChannelAdapter {
  type: ChannelType
  id: string
  name: string
  connected: boolean

  connect(): Promise<void>
  disconnect(): Promise<void>
  sendMessage(message: OutboundMessage): Promise<void>
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
}

/**
 * Channel configuration
 */
export interface ChannelConfig {
  type: ChannelType
  enabled: boolean
  id: string
  name?: string
  credentials?: Record<string, any>
  options?: Record<string, any>
  dmPolicy?: DMPolicy
  allowFrom?: string[]
}

/**
 * DM (Direct Message) policy
 */
export enum DMPolicy {
  OPEN = 'open', // Accept all DMs
  PAIRING = 'pairing', // Require pairing code
  CLOSED = 'closed', // Reject all DMs
}

/**
 * Pairing request
 */
export interface PairingRequest {
  id: string
  channelType: ChannelType
  channelId: string
  senderId: string
  senderName?: string
  code: string
  createdAt: number
  expiresAt: number
}

/**
 * Skill definition
 */
export interface Skill {
  id: string
  name: string
  description: string
  version: string
  author?: string
  enabled: boolean
  parameters?: SkillParameter[]
  execute: (context: SkillContext) => Promise<SkillResult>
}

/**
 * Skill parameter
 */
export interface SkillParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  required?: boolean
  default?: any
}

/**
 * Skill execution context
 */
export interface SkillContext {
  session: Session
  message: InboundMessage
  parameters: Record<string, any>
  gateway: any // GatewayServer instance
}

/**
 * Skill execution result
 */
export interface SkillResult {
  success: boolean
  response?: string
  data?: any
  error?: string
  shouldReply?: boolean
}

/**
 * Gateway configuration
 */
export interface GatewayConfig {
  port: number
  host?: string
  enableWebUI?: boolean
  enableWebChat?: boolean
  channels: ChannelConfig[]
  security?: SecurityConfig
  ai?: AIConfig
  logging?: LoggingConfig
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableAuth?: boolean
  authToken?: string
  allowedOrigins?: string[]
  rateLimit?: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
}

/**
 * AI configuration
 */
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local'
  model: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  console?: boolean
  file?: string
}

/**
 * Gateway event types
 */
export enum GatewayEvent {
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_SENT = 'message:sent',
  CHANNEL_CONNECTED = 'channel:connected',
  CHANNEL_DISCONNECTED = 'channel:disconnected',
  SESSION_CREATED = 'session:created',
  SESSION_UPDATED = 'session:updated',
  SESSION_ENDED = 'session:ended',
  SKILL_EXECUTED = 'skill:executed',
  ERROR = 'error',
}

/**
 * WebSocket message types
 */
export enum WSMessageType {
  PING = 'ping',
  PONG = 'pong',
  AUTH = 'auth',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  SEND_MESSAGE = 'send_message',
  EVENT = 'event',
  ERROR = 'error',
}

/**
 * WebSocket message
 */
export interface WSMessage {
  type: WSMessageType
  id?: string
  payload?: any
  timestamp?: number
}
