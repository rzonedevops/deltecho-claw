#!/usr/bin/env node
/**
 * OpenClaw Gateway Integration Example
 * 
 * This example demonstrates how to start the Deep Tree Echo orchestrator
 * with OpenClaw Gateway enabled for multi-channel AI assistant capabilities.
 * 
 * Usage:
 *   pnpm --filter=deep-tree-echo-orchestrator start:openclaw
 * 
 * Or directly:
 *   node packages/orchestrator/examples/openclaw-gateway-example.js
 */

import { Orchestrator } from '../dist/index.js'

async function main() {
  console.log('🌳 Starting Deep Tree Echo Orchestrator with OpenClaw Gateway...\n')

  // Configure the orchestrator with OpenClaw Gateway enabled
  const orchestrator = new Orchestrator({
    // Enable core services
    enableDeltaChat: false, // Disabled for this example
    enableDovecot: false,   // Disabled for this example
    enableIPC: false,        // Disabled for this example
    enableScheduler: false,  // Disabled for this example
    enableWebhooks: false,   // Disabled for this example

    // Enable cognitive tiers
    enableDove9: false,
    enableSys6: false,
    enableDoubleMembrane: false,
    enableAAR: false,

    // Enable OpenClaw Gateway
    enableOpenClaw: true,
    openclaw: {
      enabled: true,
      gateway: {
        port: 18789,
        host: '127.0.0.1',
        enableWebUI: true,
        enableWebChat: true,
        channels: [
          // WebChat channel (built-in)
          {
            type: 'webchat',
            enabled: true,
            id: 'web',
            dmPolicy: 'open'
          }
        ],
        security: {
          enableAuth: false, // No auth for local testing
          rateLimit: {
            enabled: true,
            maxRequests: 100,
            windowMs: 60000
          }
        }
      },
      autoProcessMessages: true,
      enableCognitiveSkills: true,
      enabledChannels: ['webchat']
    }
  })

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...')
    await orchestrator.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down...')
    await orchestrator.stop()
    process.exit(0)
  })

  try {
    // Start the orchestrator
    await orchestrator.start()

    const openclawIntegration = orchestrator.getOpenClawIntegration()

    console.log('✅ OpenClaw Gateway started successfully!\n')
    console.log('📊 Gateway Information:')
    console.log('   - WebSocket: ws://127.0.0.1:18789')
    console.log('   - WebChat:   http://127.0.0.1:18789/webchat')
    console.log('   - Web UI:    http://127.0.0.1:18789/ui\n')
    
    if (openclawIntegration) {
      console.log('🧠 Cognitive Skills Available:')
      console.log('   - get_personality: Retrieve AI personality')
      console.log('   - cognitive_analysis: Analyze text\n')
      
      console.log('💬 You can now:')
      console.log('   1. Open WebChat at http://127.0.0.1:18789/webchat')
      console.log('   2. Connect via WebSocket at ws://127.0.0.1:18789')
      console.log('   3. Send messages and get AI responses\n')

      // Monitor statistics every 30 seconds
      setInterval(() => {
        const stats = openclawIntegration.getStats()
        if (stats.totalMessages > 0) {
          console.log('\n📈 Processing Statistics:')
          console.log(`   - Total Messages: ${stats.totalMessages}`)
          console.log(`   - Successful: ${stats.successfulResponses}`)
          console.log(`   - Failed: ${stats.failedResponses}`)
          console.log(`   - Success Rate: ${((stats.successfulResponses / stats.totalMessages) * 100).toFixed(1)}%`)
          console.log(`   - Skills Executed: ${stats.skillExecutions}`)
        }
      }, 30000)
    }

    console.log('🚀 Gateway is running. Press Ctrl+C to stop.\n')

  } catch (error) {
    console.error('❌ Failed to start orchestrator:', error)
    process.exit(1)
  }
}

main()
