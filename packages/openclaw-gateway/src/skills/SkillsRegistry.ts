/**
 * Skills Registry
 * Manages and executes AI assistant skills (tools/plugins)
 */

import { EventEmitter } from 'events'
import type {
  Skill,
  SkillContext,
  SkillResult,
  GatewayEvent,
} from '../types/index.js'

export class SkillsRegistry extends EventEmitter {
  private skills: Map<string, Skill> = new Map()

  constructor() {
    super()
    this.registerBuiltInSkills()
  }

  /**
   * Register a skill
   */
  public registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill)
    console.log(`[SkillsRegistry] Registered skill: ${skill.id} (${skill.name})`)
  }

  /**
   * Unregister a skill
   */
  public unregisterSkill(skillId: string): boolean {
    return this.skills.delete(skillId)
  }

  /**
   * Get a skill by ID
   */
  public getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId)
  }

  /**
   * Get all skills
   */
  public getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get enabled skills
   */
  public getEnabledSkills(): Skill[] {
    return Array.from(this.skills.values()).filter((s) => s.enabled)
  }

  /**
   * Execute a skill
   */
  public async executeSkill(
    skillId: string,
    context: SkillContext
  ): Promise<SkillResult> {
    const skill = this.skills.get(skillId)

    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
      }
    }

    if (!skill.enabled) {
      return {
        success: false,
        error: `Skill is disabled: ${skillId}`,
      }
    }

    try {
      const result = await skill.execute(context)
      this.emit('skill:executed' as GatewayEvent, {
        skill: skillId,
        success: result.success,
        context,
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[SkillsRegistry] Error executing skill ${skillId}:`, errorMessage)
      return {
        success: false,
        error: `Skill execution failed: ${errorMessage}`,
      }
    }
  }

  /**
   * Find skills by keyword in name or description
   */
  public findSkills(query: string): Skill[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.skills.values()).filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Register built-in skills
   */
  private registerBuiltInSkills(): void {
    // Echo skill - simple test skill
    this.registerSkill({
      id: 'echo',
      name: 'Echo',
      description: 'Echoes back the input text',
      version: '1.0.0',
      author: 'Deltecho',
      enabled: true,
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to echo back',
          required: true,
        },
      ],
      execute: async (context) => {
        const text = context.parameters.text || context.message.content
        return {
          success: true,
          response: `Echo: ${text}`,
          shouldReply: true,
        }
      },
    })

    // Time skill - returns current time
    this.registerSkill({
      id: 'time',
      name: 'Current Time',
      description: 'Returns the current date and time',
      version: '1.0.0',
      author: 'Deltecho',
      enabled: true,
      parameters: [],
      execute: async (context) => {
        const now = new Date()
        return {
          success: true,
          response: `Current time: ${now.toLocaleString()}`,
          data: { timestamp: now.getTime(), iso: now.toISOString() },
          shouldReply: true,
        }
      },
    })

    // Help skill - lists available skills
    this.registerSkill({
      id: 'help',
      name: 'Help',
      description: 'Lists available skills and commands',
      version: '1.0.0',
      author: 'Deltecho',
      enabled: true,
      parameters: [],
      execute: async (context) => {
        const skills = this.getEnabledSkills()
        const skillsList = skills
          .map((s) => `• ${s.name} (${s.id}): ${s.description}`)
          .join('\n')

        return {
          success: true,
          response: `Available skills:\n\n${skillsList}\n\nUse /skill <name> to execute a skill.`,
          shouldReply: true,
        }
      },
    })

    // Session info skill
    this.registerSkill({
      id: 'session_info',
      name: 'Session Info',
      description: 'Shows information about the current session',
      version: '1.0.0',
      author: 'Deltecho',
      enabled: true,
      parameters: [],
      execute: async (context) => {
        const session = context.session
        const info = [
          `Session ID: ${session.id}`,
          `Channel: ${session.channelType}`,
          `Mode: ${session.mode}`,
          `Messages: ${session.messageCount}`,
          `Active since: ${new Date(session.createdAt).toLocaleString()}`,
          `Context size: ${session.context.messages.length}`,
        ].join('\n')

        return {
          success: true,
          response: `Session Information:\n\n${info}`,
          shouldReply: true,
        }
      },
    })
  }

  /**
   * Get skill capabilities for AI context
   */
  public getSkillsForAI(): Array<{
    name: string
    description: string
    parameters: any[]
  }> {
    return this.getEnabledSkills().map((skill) => ({
      name: skill.id,
      description: skill.description,
      parameters: skill.parameters || [],
    }))
  }
}
