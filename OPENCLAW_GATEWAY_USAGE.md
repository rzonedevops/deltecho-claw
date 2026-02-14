# OpenClaw Gateway Integration Guide

This guide explains how to use the integrated OpenClaw Gateway with the Deep Tree Echo Orchestrator for multi-channel AI assistant capabilities.

## Overview

The OpenClaw Gateway integration enables the Deep Tree Echo orchestrator to:

- **Multi-Channel Support**: Connect to multiple messaging platforms (Telegram, Discord, WhatsApp, WebChat, etc.)
- **Unified Cognitive Processing**: Route all messages through Deep Tree Echo's cognitive architecture
- **Skills System**: Expose cognitive capabilities as executable skills
- **Session Management**: Maintain conversation context across channels
- **Proactive Messaging**: Enable AI to initiate conversations across platforms

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Deep Tree Echo Orchestrator                      │
│                                                                  │
│  ┌──────────────────────┐    ┌───────────────────────────────┐ │
│  │  OpenClaw Gateway    │───▶│   Cognitive Processing        │ │
│  │  Integration         │    │   - LLM Service               │ │
│  │                      │◄───│   - Memory Store              │ │
│  │  • Message routing   │    │   - Persona Core              │ │
│  │  • Session mgmt      │    │   - Cognitive Orchestrator    │ │
│  │  • Skills registry   │    └───────────────────────────────┘ │
│  └──────────────────────┘                                       │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         OpenClaw Gateway (packages/openclaw-gateway)      │  │
│  │                                                            │  │
│  │  • WebSocket Server   • Channel Adapters                 │  │
│  │  • Session Manager    • Skills Registry                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Messaging Channels                             │  │
│  │                                                            │  │
│  │  • DeltaChat  • Telegram  • Discord  • WebChat           │  │
│  │  • WhatsApp   • Slack     • Signal   • Matrix            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Basic Configuration

To enable OpenClaw Gateway in the orchestrator:

```typescript
import { Orchestrator } from 'deep-tree-echo-orchestrator'

const orchestrator = new Orchestrator({
  enableOpenClaw: true,
  openclaw: {
    enabled: true,
    gateway: {
      port: 18789,
      host: '127.0.0.1',
      enableWebUI: true,
      enableWebChat: true,
      channels: [
        {
          type: 'webchat',
          enabled: true,
          id: 'web',
          dmPolicy: 'open'
        },
        {
          type: 'deltachat',
          enabled: true,
          id: 'main',
          dmPolicy: 'pairing'
        }
      ],
      security: {
        enableAuth: false,
        rateLimit: {
          enabled: true,
          maxRequests: 100,
          windowMs: 60000
        }
      }
    },
    autoProcessMessages: true,
    enableCognitiveSkills: true,
    enabledChannels: ['webchat', 'deltachat']
  }
})

// Start the orchestrator (includes gateway)
await orchestrator.start()
```

### Advanced Configuration

```typescript
const config = {
  enableOpenClaw: true,
  openclaw: {
    enabled: true,
    gateway: {
      port: 18789,
      host: '0.0.0.0', // Listen on all interfaces
      enableWebUI: true,
      enableWebChat: true,
      channels: [
        // WebChat channel (built-in)
        {
          type: 'webchat',
          enabled: true,
          id: 'web',
          dmPolicy: 'open'
        },
        // DeltaChat channel
        {
          type: 'deltachat',
          enabled: true,
          id: 'main',
          dmPolicy: 'pairing',
          allowFrom: ['trusted@example.com']
        },
        // Telegram channel
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
      }
    },
    autoProcessMessages: true,
    enableCognitiveSkills: true,
    enabledChannels: ['webchat', 'deltachat', 'telegram']
  }
}
```

## Usage

### Starting the Gateway

```typescript
import { Orchestrator } from 'deep-tree-echo-orchestrator'

const orchestrator = new Orchestrator({
  enableOpenClaw: true,
  openclaw: { /* config */ }
})

// Start orchestrator (automatically starts gateway)
await orchestrator.start()

console.log('OpenClaw Gateway is running!')
console.log('WebSocket: ws://localhost:18789')
console.log('WebChat: http://localhost:18789/webchat')
```

### Accessing the Gateway

```typescript
// Get the OpenClaw integration instance
const openclawIntegration = orchestrator.getOpenClawIntegration()

if (openclawIntegration) {
  // Check if running
  console.log('Gateway running:', openclawIntegration.isRunning())
  
  // Get statistics
  const stats = openclawIntegration.getStats()
  console.log('Messages processed:', stats.totalMessages)
  console.log('Success rate:', stats.successfulResponses / stats.totalMessages)
  
  // Access gateway server directly if needed
  const gateway = openclawIntegration.getGatewayServer()
}
```

### Stopping the Gateway

```typescript
// Stop the orchestrator (automatically stops gateway)
await orchestrator.stop()
```

## Cognitive Skills

The integration automatically registers cognitive skills with the gateway:

### Available Skills

1. **get_personality** - Retrieve current AI personality
   ```javascript
   {
     "skillId": "get_personality"
   }
   ```

2. **cognitive_analysis** - Analyze text using cognitive orchestrator
   ```javascript
   {
     "skillId": "cognitive_analysis",
     "parameters": {
       "text": "Your text to analyze"
     }
   }
   ```

### Using Skills via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18789')

ws.onopen = () => {
  // Execute a skill
  ws.send(JSON.stringify({
    type: 'execute_skill',
    payload: {
      skillId: 'get_personality'
    }
  }))
}

ws.onmessage = (event) => {
  const response = JSON.parse(event.data)
  console.log('Skill result:', response)
}
```

## Message Flow

### Inbound Message Processing

1. Message arrives on any channel (Telegram, Discord, WebChat, etc.)
2. Gateway routes to session manager
3. Session context retrieved/created
4. Message forwarded to OpenClaw integration
5. Integration processes through cognitive orchestrator
6. Response generated using LLM, memory, and personality
7. Response stored in memory
8. Response sent back through gateway to original channel

### Example Flow

```
User (Telegram) → "Hello, how are you?"
    ↓
Gateway (channel adapter)
    ↓
Session Manager (context)
    ↓
OpenClaw Integration
    ↓
Cognitive Orchestrator (LLM + Memory + Personality)
    ↓
Response: "Hi! I'm doing well, thank you for asking..."
    ↓
Memory Store (conversation saved)
    ↓
Gateway (channel adapter)
    ↓
User (Telegram) ← Response delivered
```

## Memory Integration

All messages processed through the gateway are automatically stored in the RAG memory store:

- **User messages** stored with channel context
- **AI responses** stored with cognitive state
- **Session history** maintained per user/channel
- **Memory retrieval** available for context-aware responses

## Session Management

Sessions are automatically managed per user and channel:

- **Session ID**: `{channelType}:{channelId}:{userId}:{chatId}`
- **Context Window**: Last 50 messages per session
- **Timeout**: 24 hours of inactivity
- **Modes**: Direct, Mention, Reply, Auto

## Channel Adapters

### Currently Implemented

- **WebChat** - Built-in web-based chat interface
- **DeltaChat** - E2EE messaging via DeltaChat protocol

### Planned

- **Telegram** - via grammY
- **Discord** - via discord.js
- **WhatsApp** - via Baileys
- **Slack** - via @slack/bolt
- **Signal** - via signal-cli
- **Matrix** - via matrix-js-sdk

### Adding Custom Channels

Implement the `ChannelAdapter` interface:

```typescript
import { ChannelAdapter, InboundMessage, OutboundMessage } from 'deltecho-openclaw-gateway'

class MyChannelAdapter implements ChannelAdapter {
  async connect(): Promise<void> {
    // Connect to your messaging platform
  }

  async disconnect(): Promise<void> {
    // Disconnect gracefully
  }

  async sendMessage(message: OutboundMessage): Promise<void> {
    // Send message to your platform
  }

  // Emit 'message' event when receiving messages
  onMessage(callback: (message: InboundMessage) => void) {
    // Listen for messages and call callback
  }
}
```

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:18789')
```

### Message Types

1. **PING/PONG** - Heartbeat
   ```javascript
   ws.send(JSON.stringify({ type: 'ping' }))
   // Response: { type: 'pong' }
   ```

2. **AUTH** - Authentication (if enabled)
   ```javascript
   ws.send(JSON.stringify({ 
     type: 'auth',
     payload: { token: 'your-token' }
   }))
   ```

3. **SEND_MESSAGE** - Send a message
   ```javascript
   ws.send(JSON.stringify({
     type: 'send_message',
     payload: {
       channelType: 'webchat',
       channelId: 'web',
       content: 'Hello!'
     }
   }))
   ```

4. **SUBSCRIBE** - Subscribe to events
   ```javascript
   ws.send(JSON.stringify({
     type: 'subscribe',
     payload: { events: ['session:created', 'message:inbound'] }
   }))
   ```

## Security

### DM Policies

- **OPEN** - Accept messages from anyone
- **PAIRING** - Require pairing code
- **CLOSED** - Only accept from allowlist

### Rate Limiting

```typescript
security: {
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
}
```

### Authentication

```typescript
security: {
  enableAuth: true,
  authToken: process.env.GATEWAY_TOKEN
}
```

## Monitoring

### Statistics

```typescript
const stats = openclawIntegration.getStats()

console.log({
  totalMessages: stats.totalMessages,
  successfulResponses: stats.successfulResponses,
  failedResponses: stats.failedResponses,
  skillExecutions: stats.skillExecutions
})
```

### Events

Listen to gateway events:

```typescript
const gateway = openclawIntegration.getGatewayServer()

gateway.on('message:inbound', (message) => {
  console.log('New message:', message)
})

gateway.on('session:created', (session) => {
  console.log('New session:', session)
})

gateway.on('skill:executed', (data) => {
  console.log('Skill executed:', data)
})
```

## Troubleshooting

### Gateway Not Starting

- Check if port 18789 is available
- Verify configuration is correct
- Check logs for errors

### Messages Not Processing

- Ensure `autoProcessMessages` is true
- Check cognitive services are initialized
- Verify channel adapters are connected

### Skills Not Working

- Ensure `enableCognitiveSkills` is true
- Check skill registry has skills registered
- Verify parameters are correct

## Examples

### Minimal Setup

```typescript
import { Orchestrator } from 'deep-tree-echo-orchestrator'

const orchestrator = new Orchestrator({
  enableOpenClaw: true,
  openclaw: {
    enabled: true,
    gateway: {
      port: 18789,
      enableWebChat: true
    }
  }
})

await orchestrator.start()
console.log('Chat at: http://localhost:18789/webchat')
```

### Full Featured Setup

See the complete example in `packages/orchestrator/examples/openclaw-gateway-example.ts`

## API Reference

### OpenClawIntegration

- `start()` - Start the gateway
- `stop()` - Stop the gateway
- `isRunning()` - Check if gateway is running
- `getStats()` - Get processing statistics
- `getGatewayServer()` - Get gateway server instance

### Configuration Types

See `packages/orchestrator/src/openclaw-integration.ts` for full type definitions:

- `OpenClawIntegrationConfig`
- `DEFAULT_OPENCLAW_CONFIG`

## Contributing

To add features to the OpenClaw integration:

1. Extend `OpenClawIntegration` class
2. Add new skills via `registerCognitiveSkills()`
3. Implement new channel adapters
4. Update documentation

## License

GPL-3.0-or-later

---

**Deltecho-Claw**: Where cognitive AI meets personal assistant automation. 🌳🦞
