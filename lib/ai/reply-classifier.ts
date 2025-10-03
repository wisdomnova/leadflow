// lib/ai/reply-classifier.ts
import { openai, isOpenAIConfigured } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export interface ReplyClassification {
  intent: 'interested' | 'not_interested' | 'objection' | 'question' | 'auto_reply' | 'neutral' | 'complaint'
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  reasoning: string
  suggested_response?: string
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  requires_human_attention: boolean
  next_action: 'follow_up' | 'schedule_call' | 'send_info' | 'no_action' | 'escalate'
}

export interface ClassificationRule {
  id: string
  organization_id: string
  name: string
  description: string
  conditions: {
    intent?: string[]
    sentiment?: string[]
    keywords?: string[]
    sender_domain?: string[]
  }
  actions: {
    auto_tag?: string[]
    priority?: 'high' | 'medium' | 'low'
    assign_to?: string
    auto_reply?: boolean
    auto_reply_template?: string
  }
  is_active: boolean
  created_at: string
}

export class ReplyClassifierService {

  static async classifyReply(
    messageContent: string,
    subject: string,
    senderEmail: string,
    campaignContext?: {
      campaignName: string
      campaignType: string
      originalMessage: string
    }
  ): Promise<ReplyClassification> {
    
    if (!isOpenAIConfigured || !openai) {
      // Fallback classification without AI
      return this.getFallbackClassification(messageContent, subject)
    }

    try {
      const prompt = this.buildClassificationPrompt(
        messageContent, 
        subject, 
        senderEmail, 
        campaignContext
      )

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using mini for cost efficiency
        messages: [
          {
            role: "system",
            content: `You are an expert email reply classifier for B2B cold email campaigns. 
            Your job is to analyze replies and provide structured classification data.
            Always respond with valid JSON only, no additional text.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 800,
        response_format: { type: "json_object" }
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      const classification = JSON.parse(responseContent) as ReplyClassification
      
      // Validate and sanitize the response 
      return this.validateClassification(classification)
      
    } catch (error) {
      console.error('OpenAI classification failed:', error)
      // Fallback to rule-based classification
      return this.getFallbackClassification(messageContent, subject)
    }
  }

  private static buildClassificationPrompt(
    messageContent: string,
    subject: string,
    senderEmail: string,
    campaignContext?: {
      campaignName: string
      campaignType: string  
      originalMessage: string
    }
  ): string {
    return `
Analyze this email reply from a B2B cold email campaign and classify it:

EMAIL DETAILS:
- Subject: ${subject}
- From: ${senderEmail}
- Content: ${messageContent}

${campaignContext ? `
CAMPAIGN CONTEXT:
- Campaign: ${campaignContext.campaignName}
- Type: ${campaignContext.campaignType}
- Original Message: ${campaignContext.originalMessage.substring(0, 500)}...
` : ''}

Classify this reply with the following JSON structure:

{
  "intent": "interested|not_interested|objection|question|auto_reply|neutral|complaint",
  "sentiment": "positive|negative|neutral", 
  "confidence": 0.85,
  "reasoning": "Brief explanation of the classification",
  "suggested_response": "Optional suggested reply text",
  "priority": "high|medium|low",
  "tags": ["relevant", "keywords", "from", "content"],
  "requires_human_attention": true|false,
  "next_action": "follow_up|schedule_call|send_info|no_action|escalate"
}

CLASSIFICATION GUIDELINES:
- "interested": Shows genuine interest, asks for more info, wants to schedule a call
- "not_interested": Polite decline, not a fit, already has a solution  
- "objection": Concerns about price, timing, features, authority
- "question": Asking for clarification, more details, or has concerns
- "auto_reply": Out of office, vacation messages, auto-responders
- "neutral": Acknowledgment without clear intent
- "complaint": Negative feedback, spam complaints, unsubscribe requests

PRIORITY LEVELS:
- "high": Interested prospects, hot leads, complaints
- "medium": Questions, objections, lukewarm responses  
- "low": Auto-replies, not interested, neutral responses

HUMAN ATTENTION NEEDED:
- High-priority responses
- Complex objections
- Complaints or negative sentiment
- Unclear intent requiring judgment

Respond with valid JSON only.
`
  }

  private static validateClassification(classification: any): ReplyClassification {
    const validIntents = ['interested', 'not_interested', 'objection', 'question', 'auto_reply', 'neutral', 'complaint']
    const validSentiments = ['positive', 'negative', 'neutral']
    const validPriorities = ['high', 'medium', 'low']
    const validNextActions = ['follow_up', 'schedule_call', 'send_info', 'no_action', 'escalate']

    return {
      intent: validIntents.includes(classification.intent) ? classification.intent : 'neutral',
      sentiment: validSentiments.includes(classification.sentiment) ? classification.sentiment : 'neutral',
      confidence: Math.min(Math.max(classification.confidence || 0.5, 0), 1),
      reasoning: classification.reasoning || 'Automated classification',
      suggested_response: classification.suggested_response,
      priority: validPriorities.includes(classification.priority) ? classification.priority : 'medium',
      tags: Array.isArray(classification.tags) ? classification.tags.slice(0, 10) : [],
      requires_human_attention: Boolean(classification.requires_human_attention),
      next_action: validNextActions.includes(classification.next_action) ? classification.next_action : 'no_action'
    }
  }

  private static getFallbackClassification(messageContent: string, subject: string): ReplyClassification {
    const content = messageContent.toLowerCase()
    const subjectLower = subject.toLowerCase()

    // Simple keyword-based classification
    const interestedKeywords = ['interested', 'tell me more', 'schedule', 'call', 'meeting', 'demo', 'yes', 'sounds good']
    const notInterestedKeywords = ['not interested', 'no thank you', 'remove me', 'unsubscribe', 'stop', 'not a fit']
    const autoReplyKeywords = ['out of office', 'vacation', 'auto', 'away', 'automatic']
    const objectionKeywords = ['expensive', 'cost', 'price', 'budget', 'timing', 'busy']
    const complaintKeywords = ['spam', 'harassment', 'abuse', 'report', 'legal', 'lawyer', 'violation']

    let intent: ReplyClassification['intent'] = 'neutral'
    let sentiment: ReplyClassification['sentiment'] = 'neutral'
    let priority: ReplyClassification['priority'] = 'medium'

    if (interestedKeywords.some(keyword => content.includes(keyword))) {
      intent = 'interested'
      sentiment = 'positive'
      priority = 'high'
    } else if (notInterestedKeywords.some(keyword => content.includes(keyword))) {
      intent = 'not_interested'
      sentiment = 'negative'
      priority = 'low'
    } else if (autoReplyKeywords.some(keyword => content.includes(keyword))) {
      intent = 'auto_reply'
      priority = 'low'
    } else if (objectionKeywords.some(keyword => content.includes(keyword))) {
      intent = 'objection'
      priority = 'medium'
    } else if (complaintKeywords.some(keyword => content.includes(keyword))) {
      intent = 'complaint'
      sentiment = 'negative'
      priority = 'high' 
    }

    return {
      intent,
      sentiment,
      confidence: 0.6, // Lower confidence for fallback
      reasoning: 'Keyword-based classification (AI unavailable)',
      priority,
      tags: [],
      requires_human_attention: priority === 'high' || intent === 'complaint',
      next_action: intent === 'interested' ? 'follow_up' : 'no_action'
    }
  }

  // Apply classification rules
  static async applyClassificationRules(
    messageId: string,
    classification: ReplyClassification,
    organizationId: string
  ): Promise<void> {
    try {
      // Get active classification rules for the organization
      const { data: rules } = await supabase
        .from('classification_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (!rules || rules.length === 0) return

      for (const rule of rules) {
        const matchesRule = this.checkRuleConditions(rule, classification)
        
        if (matchesRule) {
          await this.executeRuleActions(messageId, rule, classification)
        }
      }

    } catch (error) {
      console.error('Failed to apply classification rules:', error)
    }
  }

  private static checkRuleConditions(rule: ClassificationRule, classification: ReplyClassification): boolean {
    const conditions = rule.conditions

    // Check intent conditions
    if (conditions.intent && conditions.intent.length > 0) {
      if (!conditions.intent.includes(classification.intent)) {
        return false
      }
    }

    // Check sentiment conditions  
    if (conditions.sentiment && conditions.sentiment.length > 0) {
      if (!conditions.sentiment.includes(classification.sentiment)) {
        return false
      }
    }

    // Check keyword conditions
    if (conditions.keywords && conditions.keywords.length > 0) {
      const hasKeyword = conditions.keywords.some(keyword =>
        classification.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      )
      if (!hasKeyword) {
        return false
      }
    }

    return true
  }

  private static async executeRuleActions(
    messageId: string,
    rule: ClassificationRule,
    classification: ReplyClassification
  ): Promise<void> {
    const actions = rule.actions
    const updates: any = {}

    // Apply auto-tagging
    if (actions.auto_tag && actions.auto_tag.length > 0) {
      const existingTags = classification.tags || []
      updates.tags = [...new Set([...existingTags, ...actions.auto_tag])]
    }

    // Override priority if specified
    if (actions.priority) {
      updates.priority = actions.priority
    }

    // Update requires_human_attention if high priority
    if (actions.priority === 'high') {
      updates.requires_human_attention = true
    }

    // Update the inbox message with rule-based modifications
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('inbox_messages')
        .update({
          tags: updates.tags,
          classification: JSON.stringify({
            ...classification,
            ...updates,
            applied_rules: [rule.name]
          })
        })
        .eq('id', messageId)

      if (error) {
        console.error('Failed to update message with rule actions:', error)
      }
    }

    // Log rule application
    await supabase
      .from('classification_rule_logs')
      .insert({
        message_id: messageId,
        rule_id: rule.id,
        actions_applied: actions,
        applied_at: new Date().toISOString()
      })
  }

  // Create or update classification rules
  static async createClassificationRule(
    organizationId: string,
    rule: Omit<ClassificationRule, 'id' | 'organization_id' | 'created_at'>
  ): Promise<ClassificationRule> {
    const { data, error } = await supabase
      .from('classification_rules')
      .insert({
        ...rule,
        organization_id: organizationId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create classification rule: ${error.message}`)
    }

    return data
  }

  // Get classification rules for an organization
  static async getClassificationRules(organizationId: string): Promise<ClassificationRule[]> {
    const { data, error } = await supabase
      .from('classification_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch classification rules: ${error.message}`)
    }

    return data || []
  }

  // Update classification rule
  static async updateClassificationRule(
    ruleId: string,
    updates: Partial<ClassificationRule>
  ): Promise<void> {
    const { error } = await supabase
      .from('classification_rules')
      .update(updates)
      .eq('id', ruleId)

    if (error) {
      throw new Error(`Failed to update classification rule: ${error.message}`)
    }
  }

  // Delete classification rule
  static async deleteClassificationRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('classification_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      throw new Error(`Failed to delete classification rule: ${error.message}`)
    }
  }
}