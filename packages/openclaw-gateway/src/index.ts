/**
 * Deltecho-Claw OpenClaw Gateway
 * Multi-channel AI assistant control plane
 */

export { GatewayServer } from './gateway/GatewayServer.js'
export { SessionManager } from './sessions/SessionManager.js'
export { SkillsRegistry } from './skills/SkillsRegistry.js'

export type {
  GatewayConfig,
  ChannelConfig,
  ChannelAdapter,
  Session,
  SessionContext,
  InboundMessage,
  OutboundMessage,
  Skill,
  SkillContext,
  SkillResult,
  AIConfig,
  SecurityConfig,
  WSMessage,
} from './types/index.js'

export {
  ChannelType,
  MessageType,
  SessionMode,
  DMPolicy,
  GatewayEvent,
  WSMessageType,
} from './types/index.js'
