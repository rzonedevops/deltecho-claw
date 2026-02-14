# Deltecho-Claw OpenClaw Gateway

**Multi-channel AI assistant control plane inspired by OpenClaw**

> **Status: ✅ Fully Integrated**  
> The OpenClaw Gateway is now fully integrated with the Deep Tree Echo Orchestrator!  
> See [OPENCLAW_GATEWAY_USAGE.md](../../OPENCLAW_GATEWAY_USAGE.md) for complete documentation.

The gateway provides a WebSocket-based control plane for managing AI assistant interactions across multiple messaging platforms.

## Features

- ✅ **WebSocket Server**: Real-time bidirectional communication
- ✅ **Session Management**: Per-user, per-channel conversation isolation
- ✅ **Skills System**: Extensible plugin architecture
- ✅ **Multi-Channel Ready**: Abstract interfaces for any messaging platform
- ✅ **Event-Driven**: React to messages, sessions, and skill executions
- ✅ **Security**: DM policies, allowlists, rate limiting

## Quick Start

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run example
node dist/example.js
```

## Usage

```typescript
import { GatewayServer, ChannelType, DMPolicy } from 'deltecho-openclaw-gateway'

const gateway = new GatewayServer({
  port: 18789,
  host: '127.0.0.1',
  channels: [
    {
      type: ChannelType.WEBCHAT,
      enabled: true,
      id: 'web',
      dmPolicy: DMPolicy.OPEN,
    },
  ],
  ai: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_KEY,
  },
})

await gateway.start()
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              GatewayServer (Control Plane)            │
│                                                       │
│  WebSocket API ◄──► SessionManager ◄──► AI Core     │
│                          ▲                            │
│                          │                            │
│                          ▼                            │
│                   SkillsRegistry                      │
│                          ▲                            │
│                          │                            │
│                          ▼                            │
│              Channel Adapters (Multi-platform)        │
└──────────────────────────────────────────────────────┘
```

## Built-in Skills

- **echo**: Echo back text (test skill)
- **time**: Get current date/time
- **help**: List available skills
- **session_info**: Show session information

## Creating Custom Skills

```typescript
import { Skill, SkillContext, SkillResult } from 'deltecho-openclaw-gateway'

const weatherSkill: Skill = {
  id: 'weather',
  name: 'Weather',
  description: 'Get weather forecast',
  version: '1.0.0',
  enabled: true,
  parameters: [
    { name: 'location', type: 'string', required: true },
  ],
  execute: async (context: SkillContext): Promise<SkillResult> => {
    const location = context.parameters.location
    const weather = await fetchWeather(location)
    
    return {
      success: true,
      response: `Weather in ${location}: ${weather.temp}°C`,
      shouldReply: true,
    }
  },
}

gateway.getSkillsRegistry().registerSkill(weatherSkill)
```

## Environment Variables

```bash
ANTHROPIC_KEY=sk-ant-...           # Anthropic API key
OPENAI_API_KEY=sk-...              # OpenAI API key
GATEWAY_PORT=18789                  # Gateway port
GATEWAY_HOST=127.0.0.1             # Gateway host
```

## WebSocket API

Connect to `ws://localhost:18789` and send JSON messages:

### Ping/Pong
```json
{ "type": "ping" }
{ "type": "pong" }
```

### Send Message
```json
{
  "type": "send_message",
  "payload": {
    "channelType": "webchat",
    "channelId": "web",
    "recipientId": "user123",
    "chatId": "chat123",
    "messageType": "text",
    "content": "Hello!"
  }
}
```

### Subscribe to Events
```json
{
  "type": "subscribe",
  "payload": ["message:received", "session:created"]
}
```

## Events

The gateway emits these events:

- `message:received` - Inbound message from channel
- `message:sent` - Outbound message sent
- `session:created` - New session started
- `session:updated` - Session context updated
- `session:ended` - Session terminated
- `skill:executed` - Skill ran successfully
- `channel:connected` - Channel adapter connected
- `channel:disconnected` - Channel adapter disconnected
- `error` - Error occurred

## Channel Adapters

Create custom channel adapters by implementing the `ChannelAdapter` interface:

```typescript
import { ChannelAdapter, ChannelType, InboundMessage, OutboundMessage } from 'deltecho-openclaw-gateway'
import { EventEmitter } from 'events'

class MyChannelAdapter extends EventEmitter implements ChannelAdapter {
  type = ChannelType.TELEGRAM // or your channel type
  id = 'my-channel'
  name = 'My Channel'
  connected = false

  async connect(): Promise<void> {
    // Connect to the messaging platform
    this.connected = true
  }

  async disconnect(): Promise<void> {
    // Disconnect
    this.connected = false
  }

  async sendMessage(message: OutboundMessage): Promise<void> {
    // Send message to platform
  }
}

// Register with gateway
gateway.registerChannel(new MyChannelAdapter())
```

## Integration with Deep Tree Echo

The gateway is designed to integrate with Deep Tree Echo cognitive architecture:

```typescript
import { DeepTreeEcho } from 'deep-tree-echo-core'

const deepTreeEcho = new DeepTreeEcho(config)

gateway.on('message:received', async (message) => {
  const session = gateway.getSessionManager().getSession(sessionId)
  
  // Process with AI
  const response = await deepTreeEcho.processMessage(
    message.content,
    session.context
  )
  
  // Send response
  await gateway.sendMessage({
    channelType: message.channelType,
    channelId: message.channelId,
    recipientId: message.senderId,
    chatId: message.chatId,
    messageType: 'text',
    content: response,
  })
})
```

## Security

### DM Policies

- `DMPolicy.OPEN`: Accept all direct messages
- `DMPolicy.PAIRING`: Require pairing code
- `DMPolicy.CLOSED`: Reject all DMs

### Rate Limiting

```typescript
security: {
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  }
}
```

### Channel Allowlists

```typescript
{
  type: ChannelType.TELEGRAM,
  dmPolicy: DMPolicy.PAIRING,
  allowFrom: ['user123', 'user456'],
}
```

## Testing

```bash
pnpm test
```

## Documentation

See [OPENCLAW_INTEGRATION.md](../../OPENCLAW_INTEGRATION.md) for complete documentation.

## License

GPL-3.0-or-later

---

Part of the **Deltecho-Claw** platform 🌳🦞
