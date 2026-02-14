/**
 * OpenClaw Gateway Integration
 * Bridges the OpenClaw multi-channel gateway with Deep Tree Echo cognitive processing
 */

import {
  GatewayServer,
  SessionManager,
  SkillsRegistry,
  GatewayConfig,
  InboundMessage,
  OutboundMessage,
  ChannelType,
  Session,
  Skill,
  SkillContext,
  SkillResult,
} from "deltecho-openclaw-gateway";
import { getLogger, LLMService, RAGMemoryStore, PersonaCore } from "deep-tree-echo-core";
import { CognitiveOrchestrator } from "@deltecho/cognitive";

const log = getLogger("deep-tree-echo-orchestrator/OpenClawIntegration");

/**
 * Configuration for OpenClaw Gateway integration
 */
export interface OpenClawIntegrationConfig {
  /** Enable the gateway */
  enabled: boolean;
  /** Gateway server configuration */
  gateway: Partial<GatewayConfig>;
  /** Enable automatic message processing */
  autoProcessMessages: boolean;
  /** Enable skill integration with cognitive bridge */
  enableCognitiveSkills: boolean;
  /** Channels to enable */
  enabledChannels: ChannelType[];
}

export const DEFAULT_OPENCLAW_CONFIG: OpenClawIntegrationConfig = {
  enabled: false,
  gateway: {
    port: 18789,
    host: "127.0.0.1",
    enableWebUI: true,
    enableWebChat: true,
    channels: [],
    security: {
      enableAuth: false,
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000,
      },
    },
  },
  autoProcessMessages: true,
  enableCognitiveSkills: true,
  enabledChannels: [ChannelType.WEBCHAT, ChannelType.DELTACHAT],
};

/**
 * OpenClaw Gateway Integration with Deep Tree Echo Orchestrator
 * 
 * This class bridges the OpenClaw multi-channel gateway with the Deep Tree Echo
 * cognitive architecture, enabling autonomous AGI operation across multiple
 * messaging platforms.
 */
export class OpenClawIntegration {
  private config: OpenClawIntegrationConfig;
  private gatewayServer?: GatewayServer;
  private running: boolean = false;

  // Cognitive services
  private llmService: LLMService;
  private memoryStore: RAGMemoryStore;
  private personaCore: PersonaCore;
  private cognitiveOrchestrator: CognitiveOrchestrator;

  // Track message processing
  private processingStats = {
    totalMessages: 0,
    successfulResponses: 0,
    failedResponses: 0,
    skillExecutions: 0,
  };

  constructor(
    config: Partial<OpenClawIntegrationConfig>,
    cognitiveServices: {
      llmService: LLMService;
      memoryStore: RAGMemoryStore;
      personaCore: PersonaCore;
      cognitiveOrchestrator: CognitiveOrchestrator;
    }
  ) {
    this.config = { ...DEFAULT_OPENCLAW_CONFIG, ...config };
    this.llmService = cognitiveServices.llmService;
    this.memoryStore = cognitiveServices.memoryStore;
    this.personaCore = cognitiveServices.personaCore;
    this.cognitiveOrchestrator = cognitiveServices.cognitiveOrchestrator;

    log.info("OpenClaw Gateway Integration initialized");
  }

  /**
   * Start the OpenClaw Gateway
   */
  public async start(): Promise<void> {
    if (!this.config.enabled) {
      log.info("OpenClaw Gateway is disabled, skipping start");
      return;
    }

    if (this.running) {
      log.warn("OpenClaw Gateway is already running");
      return;
    }

    log.info("Starting OpenClaw Gateway integration...");

    try {
      // Create gateway server
      this.gatewayServer = new GatewayServer(
        this.config.gateway as GatewayConfig
      );

      // Register cognitive skills if enabled
      if (this.config.enableCognitiveSkills) {
        await this.registerCognitiveSkills();
      }

      // Set up message handlers
      if (this.config.autoProcessMessages) {
        this.setupMessageHandlers();
      }

      // Start the gateway server
      await this.gatewayServer.start();

      this.running = true;
      log.info("OpenClaw Gateway started successfully");
      log.info(`Gateway WebSocket: ws://${this.config.gateway.host || 'localhost'}:${this.config.gateway.port}`);

    } catch (error) {
      log.error("Failed to start OpenClaw Gateway:", error);
      throw error;
    }
  }

  /**
   * Stop the OpenClaw Gateway
   */
  public async stop(): Promise<void> {
    if (!this.running || !this.gatewayServer) {
      return;
    }

    log.info("Stopping OpenClaw Gateway...");

    try {
      await this.gatewayServer.stop();
      this.running = false;
      log.info("OpenClaw Gateway stopped successfully");
      log.info("Processing statistics:", this.processingStats);
    } catch (error) {
      log.error("Error stopping OpenClaw Gateway:", error);
      throw error;
    }
  }

  /**
   * Set up message handlers for processing inbound messages
   */
  private setupMessageHandlers(): void {
    if (!this.gatewayServer) return;

    log.info("Setting up message handlers for cognitive processing");

    // Handle inbound messages from any channel
    this.gatewayServer.on("message:inbound", async (message: InboundMessage) => {
      await this.processInboundMessage(message);
    });

    // Handle session events
    this.gatewayServer.on("session:created", (session: Session) => {
      log.debug(`Session created: ${session.id} on ${session.channelType}`);
    });

    this.gatewayServer.on("session:ended", (session: Session) => {
      log.debug(`Session ended: ${session.id}`);
    });
  }

  /**
   * Process an inbound message through the cognitive pipeline
   */
  private async processInboundMessage(message: InboundMessage): Promise<void> {
    this.processingStats.totalMessages++;

    log.info(
      `Processing message from ${message.channelType}:${message.channelId} - ${message.content.substring(0, 50)}...`
    );

    try {
      // Get or create session context
      const session = await this.getSession(message);

      // Build conversation history from session
      const history = this.buildConversationHistory(session);

      // Get personality
      const personality = await this.personaCore.getPersonality();

      // Process through cognitive orchestrator
      const response = await this.cognitiveOrchestrator.processMessage(
        message.content,
        {
          chatId: 0, // Use 0 for openclaw channel messages
        }
      );

      // Store in memory (user message)
      await this.memoryStore.storeMemory({
        chatId: 0,
        messageId: 0,
        sender: "user",
        text: message.content,
      });

      // Store in memory (bot response)
      const responseText = typeof response.response === 'string' 
        ? response.response 
        : response.response.content;
      
      await this.memoryStore.storeMemory({
        chatId: 0,
        messageId: 0,
        sender: "bot",
        text: responseText,
      });

      // Send response back through gateway
      await this.sendResponse(message, responseText);

      this.processingStats.successfulResponses++;

      log.info(
        `Successfully processed message and sent response (${responseText.length} chars)`
      );
    } catch (error) {
      this.processingStats.failedResponses++;
      log.error("Failed to process inbound message:", error);

      // Send error response
      try {
        await this.sendResponse(
          message,
          "I apologize, but I encountered an error processing your message. Please try again."
        );
      } catch (sendError) {
        log.error("Failed to send error response:", sendError);
      }
    }
  }

  /**
   * Get or create session for a message
   */
  private async getSession(message: InboundMessage): Promise<Session> {
    if (!this.gatewayServer) {
      throw new Error("Gateway server not initialized");
    }

    const sessionManager = (this.gatewayServer as any).sessionManager as SessionManager;
    return sessionManager.getOrCreateSession(
      message.channelType,
      message.channelId,
      message.senderId,
      message.chatId
    );
  }

  /**
   * Build conversation history from session context
   */
  private buildConversationHistory(
    session: Session
  ): Array<{ role: string; content: string }> {
    return session.context.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Send a response back through the gateway
   */
  private async sendResponse(
    originalMessage: InboundMessage,
    responseContent: string
  ): Promise<void> {
    if (!this.gatewayServer) {
      throw new Error("Gateway server not initialized");
    }

    const outboundMessage: OutboundMessage = {
      channelType: originalMessage.channelType,
      channelId: originalMessage.channelId,
      recipientId: originalMessage.senderId,
      chatId: originalMessage.chatId,
      messageType: originalMessage.messageType,
      content: responseContent,
      replyTo: originalMessage.id,
    };

    await this.gatewayServer.sendMessage(outboundMessage);
  }

  /**
   * Register cognitive skills with the gateway's skill registry
   */
  private async registerCognitiveSkills(): Promise<void> {
    if (!this.gatewayServer) return;

    const skillsRegistry = (this.gatewayServer as any)
      .skillsRegistry as SkillsRegistry;

    log.info("Registering cognitive skills with gateway...");

    // Skill: Get personality
    const getPersonalitySkill: Skill = {
      id: "get_personality",
      name: "Get Personality",
      description: "Retrieve current AI personality and characteristics",
      version: "1.0.0",
      author: "Deep Tree Echo",
      enabled: true,
      execute: async (_context: SkillContext): Promise<SkillResult> => {
        try {
          const personality = await this.personaCore.getPersonality();

          return {
            success: true,
            response: `Current personality: ${personality}`,
            data: { personality },
            shouldReply: true,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to get personality: ${error}`,
            shouldReply: true,
          };
        }
      },
    };

    // Skill: Cognitive analysis
    const cognitiveAnalysisSkill: Skill = {
      id: "cognitive_analysis",
      name: "Cognitive Analysis",
      description: "Analyze a message using the cognitive orchestrator",
      version: "1.0.0",
      author: "Deep Tree Echo",
      enabled: true,
      parameters: [
        {
          name: "text",
          type: "string",
          description: "Text to analyze",
          required: true,
        },
      ],
      execute: async (context: SkillContext): Promise<SkillResult> => {
        try {
          const text = context.parameters.text as string;
          const result = await this.cognitiveOrchestrator.processMessage(text, {
            chatId: 0,
          });

          const responseText = typeof result.response === 'string' 
            ? result.response 
            : result.response.content;

          return {
            success: true,
            response: `Cognitive Analysis:\nResponse: ${responseText}\nMetrics: ${JSON.stringify(result.metrics, null, 2)}`,
            data: result,
            shouldReply: true,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed cognitive analysis: ${error}`,
            shouldReply: true,
          };
        }
      },
    };

    skillsRegistry.registerSkill(getPersonalitySkill);
    skillsRegistry.registerSkill(cognitiveAnalysisSkill);

    this.processingStats.skillExecutions += 2;
    log.info("Registered 2 cognitive skills with gateway");
  }

  /**
   * Get gateway server instance (for direct access if needed)
   */
  public getGatewayServer(): GatewayServer | undefined {
    return this.gatewayServer;
  }

  /**
   * Check if gateway is running
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Get processing statistics
   */
  public getStats() {
    return { ...this.processingStats };
  }
}
