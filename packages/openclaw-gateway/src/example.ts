/**
 * Example Gateway Server
 * Demonstrates how to set up and run the Deltecho-Claw gateway
 */

import { GatewayServer, ChannelType, DMPolicy } from './index.js'
import type { GatewayConfig } from './index.js'

// Example configuration
const config: GatewayConfig = {
  port: 18789,
  host: '127.0.0.1',
  enableWebUI: true,
  enableWebChat: true,
  channels: [
    {
      type: ChannelType.DELTACHAT,
      enabled: true,
      id: 'main',
      name: 'DeltaChat Main',
      dmPolicy: DMPolicy.PAIRING,
      allowFrom: [],
    },
    {
      type: ChannelType.WEBCHAT,
      enabled: true,
      id: 'web',
      name: 'Web Chat',
      dmPolicy: DMPolicy.OPEN,
    },
  ],
  security: {
    enableAuth: false,
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000,
    },
  },
  ai: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    apiKey: process.env.ANTHROPIC_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are a helpful AI assistant integrated with Deltecho-Claw.',
  },
  logging: {
    level: 'info',
    console: true,
  },
}

// Create and start gateway
async function main() {
  console.log('🌳🦞 Deltecho-Claw Gateway Starting...\n')

  const gateway = new GatewayServer(config)

  // Listen to gateway events
  gateway.on('message:received', (message) => {
    console.log(`📨 Message received: ${message.content}`)
  })

  gateway.on('message:sent', (message) => {
    console.log(`📤 Message sent: ${message.content}`)
  })

  gateway.on('session:created', (session) => {
    console.log(`🆕 Session created: ${session.id}`)
  })

  gateway.on('skill:executed', (data) => {
    console.log(`🔧 Skill executed: ${data.skill}`)
  })

  gateway.on('channel:connected', (adapter) => {
    console.log(`✅ Channel connected: ${adapter.type}:${adapter.id}`)
  })

  gateway.on('error', (error) => {
    console.error('❌ Gateway error:', error)
  })

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...')
    await gateway.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down...')
    await gateway.stop()
    process.exit(0)
  })

  // Start the gateway
  try {
    await gateway.start()
    
    console.log('\n✨ Gateway is running!')
    console.log('   Press Ctrl+C to stop\n')
    
    // Display available skills
    const skills = gateway.getSkillsRegistry().getEnabledSkills()
    console.log(`📚 Available skills (${skills.length}):`)
    skills.forEach((skill) => {
      console.log(`   • ${skill.name} (/${skill.id}): ${skill.description}`)
    })
    console.log()
    
  } catch (error) {
    console.error('Failed to start gateway:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main }
