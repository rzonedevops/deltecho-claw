# OpenClaw Integration in Deltecho-Claw

This document explains how OpenClaw AI Assistant features have been integrated into Deltecho Chat to create the **Deltecho-Claw** hybrid platform.

## Overview

**Deltecho-Claw** combines:
- **Deltecho Chat**: DeltaChat secure messaging with Deep Tree Echo cognitive architecture
- **OpenClaw**: Personal AI assistant framework with multi-channel support and skills system

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Deltecho-Claw Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌───────────────────────────────┐ │
│  │  OpenClaw Gateway    │    │   Deep Tree Echo Cognitive    │ │
│  │  Control Plane       │◄──►│   Architecture                │ │
│  │                      │    │                               │ │
│  │  • Multi-channel     │    │   • HyperDimensional Memory   │ │
│  │  • Session mgmt      │    │   • Active Inference          │ │
│  │  • Skills registry   │    │   • Personality Core          │ │
│  │  • WebSocket API     │    │   • RAG Store                 │ │
│  └──────────────────────┘    └───────────────────────────────┘ │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Channel Adapters (Messaging Platforms)          │  │
│  │                                                            │  │
│  │  • DeltaChat  • Telegram  • Discord  • WhatsApp          │  │
│  │  • Slack      • Signal    • Matrix   • WebChat           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. OpenClaw Gateway (`packages/openclaw-gateway`)

The gateway serves as the central control plane for the platform.

**Key Features:**
- **WebSocket Server**: Real-time bidirectional communication
- **Session Management**: Per-user, per-channel session isolation
- **Channel Routing**: Routes messages between channels and AI
- **Skills Registry**: Manages and executes assistant capabilities
- **Security**: DM pairing, allowlists, rate limiting

**Main Classes:**
- `GatewayServer`: Core WebSocket server and event router
- `SessionManager`: Conversation session lifecycle management
- `SkillsRegistry`: Plugin/tool execution system
- `ChannelAdapter`: Abstract interface for messaging platforms

### 2. Game Engine (`packages/game-engine`)

An OpenClaw-inspired platformer game engine integrated with AI.

**Key Features:**
- **Physics Engine**: Box2D-style platformer physics
- **Entity System**: Players, enemies, collectibles, platforms
- **AI-Game Bridge**: AI can observe and assist with gameplay
- **Canvas Renderer**: HTML5 canvas-based rendering

**Use Case:**
AI companions can provide gameplay tips, warn about dangers, and celebrate achievements in real-time.

### 3. Channel Adapters

Each messaging platform has a dedicated adapter implementing the `ChannelAdapter` interface.

**Supported Channels:**
- DeltaChat (native integration)
- Telegram (via grammY)
- Discord (via discord.js)
- WhatsApp (via Baileys)
- WebChat (built-in)

**Future Channels:**
- Slack, Signal, Matrix, MS Teams, iMessage

### 4. Skills System

Skills are the core of OpenClaw's extensibility. They act as tools the AI can use.

**Built-in Skills:**
- `echo`: Test skill for debugging
- `time`: Returns current date/time
- `help`: Lists available skills
- `session_info`: Shows session details

**Custom Skills:**
Skills are JavaScript/TypeScript modules that implement the `Skill` interface:

```typescript
interface Skill {
  id: string
  name: string
  description: string
  version: string
  enabled: boolean
  parameters?: SkillParameter[]
  execute: (context: SkillContext) => Promise<SkillResult>
}
```

## Key OpenClaw Features Implemented

### ✅ Implemented

1. **Gateway Control Plane**
   - WebSocket server for real-time communication
   - Event-driven architecture
   - Session management with context persistence

2. **Multi-Channel Foundation**
   - Abstract channel adapter interface
   - Message routing and transformation
   - Unified message format across channels

3. **Skills System**
   - Plugin registry with enable/disable
   - Sandboxed skill execution
   - Built-in essential skills

4. **Session Management**
   - Per-user/chat session isolation
   - Context window management
   - Session modes (direct, mention, reply, auto)

5. **Security Features**
   - DM policy configuration (open/pairing/closed)
   - Pairing code system (foundation)
   - Channel allowlists

### 🚧 Planned

6. **Full Channel Implementations**
   - Complete Telegram adapter
   - Discord with full features
   - WhatsApp via Baileys
   - Slack and Signal

7. **Browser Control**
   - Chrome DevTools Protocol integration
   - Page automation and scraping
   - Screenshot capture

8. **Voice Features**
   - Voice Wake (always-on speech)
   - Talk Mode overlay
   - TTS/STT integration

9. **Canvas/A2UI**
   - Agent-driven visual workspace
   - UI automation capabilities

10. **Node System**
    - Multi-device coordination
    - Remote command execution
    - Camera and sensor access

11. **Cron & Webhooks**
    - Scheduled task execution
    - Webhook receivers
    - Proactive messaging triggers

12. **Advanced Security**
    - Rate limiting per channel
    - Token-based authentication
    - Skill permission system

## Integration with Deep Tree Echo

The OpenClaw gateway integrates seamlessly with Deep Tree Echo's cognitive architecture:

### Message Flow

1. **Inbound**: Channel → Gateway → Session Manager → Deep Tree Echo → AI Response
2. **Outbound**: AI Response → Gateway → Channel Adapter → User

### Cognitive Enhancement

- **Memory**: Sessions stored in HyperDimensional memory
- **Context**: Deep Tree Echo maintains long-term conversation context
- **Skills**: AI can invoke skills through the cognitive bridge
- **Proactive**: Orchestrator can trigger messages via gateway

### Example Integration

```typescript
// AI responds to a message with skill execution
const session = sessionManager.getOrCreateSession(...)
const aiResponse = await deepTreeEcho.processMessage(message, session.context)

// AI decides to use a skill
if (aiResponse.useSkill) {
  const skillResult = await skillsRegistry.executeSkill(
    aiResponse.skillId,
    { session, message, parameters: aiResponse.skillParams, gateway }
  )
  
  // Send skill result back to user
  await channelAdapter.sendMessage({
    ...message,
    content: skillResult.response
  })
}
```

## Configuration

Example gateway configuration:

```typescript
{
  port: 18789,
  host: '127.0.0.1',
  enableWebUI: true,
  enableWebChat: true,
  channels: [
    {
      type: 'deltachat',
      enabled: true,
      id: 'main',
      dmPolicy: 'pairing',
      allowFrom: ['trusted-user@example.com']
    },
    {
      type: 'telegram',
      enabled: true,
      id: 'bot',
      credentials: {
        token: process.env.TELEGRAM_BOT_TOKEN
      },
      dmPolicy: 'open'
    }
  ],
  security: {
    enableAuth: true,
    authToken: process.env.GATEWAY_TOKEN,
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  ai: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_KEY,
    temperature: 0.7,
    maxTokens: 4096
  }
}
```

## Usage

### Starting the Gateway

```bash
# Install dependencies
pnpm install

# Build the gateway
pnpm --filter=deltecho-openclaw-gateway build

# Start the gateway
pnpm --filter=deltecho-openclaw-gateway start
```

### Connecting Channels

Each channel needs its own configuration. See channel-specific documentation:
- [DeltaChat Integration](./DELTACHAT_CHANNEL.md)
- [Telegram Setup](./TELEGRAM_CHANNEL.md)
- [Discord Setup](./DISCORD_CHANNEL.md)

### Creating Custom Skills

Create a new skill by implementing the `Skill` interface:

```typescript
import { Skill, SkillContext, SkillResult } from 'deltecho-openclaw-gateway'

export const weatherSkill: Skill = {
  id: 'weather',
  name: 'Weather Forecast',
  description: 'Get current weather for a location',
  version: '1.0.0',
  author: 'Your Name',
  enabled: true,
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'City name or coordinates',
      required: true
    }
  ],
  execute: async (context: SkillContext): Promise<SkillResult> => {
    const location = context.parameters.location
    
    // Fetch weather data
    const weather = await fetchWeather(location)
    
    return {
      success: true,
      response: `Weather in ${location}: ${weather.description}, ${weather.temp}°C`,
      data: weather,
      shouldReply: true
    }
  }
}

// Register the skill
skillsRegistry.registerSkill(weatherSkill)
```

## Development Roadmap

### Phase 1: Foundation (Current)
- ✅ Gateway architecture and types
- ✅ Session management
- ✅ Skills registry with built-in skills
- ✅ Game engine integration
- ✅ Documentation

### Phase 2: Channel Expansion
- [ ] Complete Telegram adapter
- [ ] Discord adapter with full features
- [ ] WhatsApp via Baileys
- [ ] WebChat UI implementation

### Phase 3: Advanced Features
- [ ] Browser control via CDP
- [ ] Voice Wake and Talk Mode
- [ ] Canvas/A2UI workspace
- [ ] Node system for multi-device

### Phase 4: Automation
- [ ] Cron job scheduler
- [ ] Webhook system
- [ ] Gmail Pub/Sub integration
- [ ] Proactive messaging engine

### Phase 5: Ecosystem
- [ ] Skill marketplace
- [ ] Community skill sharing
- [ ] Plugin development tools
- [ ] Advanced security features

## Comparison with OpenClaw

| Feature | OpenClaw | Deltecho-Claw | Notes |
|---------|----------|---------------|-------|
| Gateway | ✅ Full | ✅ Core | WebSocket control plane |
| Channels | ✅ 10+ | 🚧 5 | Foundation complete |
| Skills | ✅ 3000+ | ✅ 4 | Registry ready for more |
| Browser | ✅ Full | 🚧 Planned | CDP integration needed |
| Voice | ✅ Full | 🚧 Planned | TTS/STT integration |
| Canvas | ✅ A2UI | 🚧 Game | Game engine as alternative |
| Nodes | ✅ Full | 🚧 Planned | Multi-device coordination |
| Security | ✅ Full | ✅ Core | DM pairing, allowlists |
| Cog AI | ❌ N/A | ✅ Deep Tree Echo | Unique advantage |
| Memory | ✅ JSONL | ✅ Hypergraph | Advanced cognitive memory |

## Contributing

To contribute to the OpenClaw integration:

1. **Add Channel Adapters**: Implement the `ChannelAdapter` interface
2. **Create Skills**: Add new capabilities as skill modules
3. **Enhance Security**: Improve authentication and sandboxing
4. **Documentation**: Help document features and usage

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Resources

- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Documentation](https://docs.openclaw.ai)
- [Deep Tree Echo](https://github.com/o9nn/deltecho)
- [DeltaChat](https://delta.chat)

## License

GPL-3.0-or-later (consistent with both Deltecho Chat and OpenClaw)

---

**Deltecho-Claw**: Where cognitive AI meets personal assistant automation. 🌳🦞
