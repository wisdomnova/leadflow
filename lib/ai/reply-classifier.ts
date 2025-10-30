// lib/ai/reply-classifier.ts
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

// Only create OpenAI client on server-side
const getOpenAIClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI client cannot be used on client-side')
  }
  
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  
  return new OpenAI({ apiKey })
}

interface ReplyClassification {
  category: 'interested' | 'not_interested' | 'question' | 'out_of_office' | 'bounce' | 'neutral'
  sentiment: 'positive' | 'negative' | 'neutral'
  needsResponse: boolean
  confidence: number
  summary: string
}

export interface AIClassification {
  intent: string
  sentiment: string
  confidence: number
  reasoning: string
  suggested_response?: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  requires_human_attention: boolean
  next_action?: string
}

export class ReplyClassifierService {
  /**
   * Enhanced AI classification for email replies
   */
  static async classifyReply(
    content: string,
    subject: string,
    fromEmail: string,
    campaignContext?: {
      campaignName: string
      campaignType: string
      originalMessage: string
    }
  ): Promise<AIClassification> {
    try {
      // Ensure this runs only on server-side
      if (typeof window !== 'undefined') {
        throw new Error('AI classification must run on server-side')
      }

      const openai = getOpenAIClient()
      
      const contextPrompt = campaignContext 
        ? `Original campaign: "${campaignContext.campaignName}" (${campaignContext.campaignType})\nOriginal message: ${campaignContext.originalMessage.substring(0, 500)}...\n\n`
        : ''

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI that classifies email replies from sales/marketing campaigns. Analyze the email and provide a JSON response with:

- intent: "interested" | "not_interested" | "question" | "objection" | "out_of_office" | "bounce" | "neutral" | "meeting_request" | "price_inquiry"
- sentiment: "positive" | "negative" | "neutral"
- confidence: number (0-1)
- reasoning: string (brief explanation)
- suggested_response: string (optional, what to reply)
- priority: "low" | "medium" | "high"
- tags: string[] (relevant tags like ["hot_lead", "budget_question", "competitor_mention"])
- requires_human_attention: boolean
- next_action: string (what should be done next)

Intent definitions:
- interested: Person wants to learn more, continue conversation
- not_interested: Explicit rejection, unsubscribe request
- question: Asks questions about product/service/pricing
- objection: Raises concerns or objections
- out_of_office: Automated reply
- bounce: Delivery failure
- meeting_request: Wants to schedule a call/meeting
- price_inquiry: Specifically asking about pricing
- neutral: General acknowledgment`
          },
          {
            role: 'user',
            content: `${contextPrompt}Subject: ${subject}\nFrom: ${fromEmail}\nContent: ${content}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        intent: result.intent || 'neutral',
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || 'No reasoning provided',
        suggested_response: result.suggested_response,
        priority: result.priority || 'medium',
        tags: result.tags || [],
        requires_human_attention: result.requires_human_attention || false,
        next_action: result.next_action || 'no_action'
      }
    } catch (error) {
      console.error('AI classification error:', error)
      
      // Fallback to simple keyword matching
      return this.classifyWithKeywords(content, subject)
    }
  }

  /**
   * Fallback keyword-based classification
   */
  static classifyWithKeywords(content: string, subject: string): AIClassification {
    const lowerBody = content.toLowerCase()
    const lowerSubject = subject.toLowerCase()

    // Out of office
    if (lowerBody.includes('out of office') || lowerBody.includes('away from desk') || 
        lowerSubject.includes('out of office')) {
      return {
        intent: 'out_of_office',
        sentiment: 'neutral',
        confidence: 0.9,
        reasoning: 'Detected out of office keywords',
        priority: 'low',
        tags: ['auto_reply'],
        requires_human_attention: false,
        next_action: 'ignore'
      }
    }

    // Not interested
    if (lowerBody.includes('not interested') || lowerBody.includes('unsubscribe') || 
        lowerBody.includes('remove me') || lowerBody.includes('stop emailing')) {
      return {
        intent: 'not_interested',
        sentiment: 'negative',
        confidence: 0.8,
        reasoning: 'Explicit rejection detected',
        priority: 'low',
        tags: ['rejection'],
        requires_human_attention: false,
        next_action: 'unsubscribe'
      }
    }

    // Meeting request
    if (lowerBody.includes('schedule') || lowerBody.includes('meeting') ||
        lowerBody.includes('call') || lowerBody.includes('demo') ||
        lowerBody.includes('available')) {
      return {
        intent: 'meeting_request',
        sentiment: 'positive',
        confidence: 0.7,
        reasoning: 'Meeting/call keywords detected',
        priority: 'high',
        tags: ['hot_lead', 'meeting'],
        requires_human_attention: true,
        next_action: 'schedule_meeting'
      }
    }

    // Price inquiry
    if (lowerBody.includes('price') || lowerBody.includes('cost') ||
        lowerBody.includes('budget') || lowerBody.includes('expensive')) {
      return {
        intent: 'price_inquiry',
        sentiment: 'neutral',
        confidence: 0.6,
        reasoning: 'Price-related keywords detected',
        priority: 'medium',
        tags: ['pricing'],
        requires_human_attention: true,
        next_action: 'send_pricing'
      }
    }

    // Interested
    if (lowerBody.includes('interested') || lowerBody.includes('tell me more')) {
      return {
        intent: 'interested',
        sentiment: 'positive',
        confidence: 0.7,
        reasoning: 'Interest keywords detected',
        priority: 'high',
        tags: ['interested'],
        requires_human_attention: true,
        next_action: 'follow_up'
      }
    }

    // Question
    if (lowerBody.includes('?') || lowerBody.includes('how') || 
        lowerBody.includes('what') || lowerBody.includes('when')) {
      return {
        intent: 'question',
        sentiment: 'neutral',
        confidence: 0.6,
        reasoning: 'Question patterns detected',
        priority: 'medium',
        tags: ['question'],
        requires_human_attention: true,
        next_action: 'answer_question'
      }
    }

    return {
      intent: 'neutral',
      sentiment: 'neutral',
      confidence: 0.5,
      reasoning: 'No specific patterns detected',
      priority: 'low',
      tags: [],
      requires_human_attention: false,
      next_action: 'monitor'
    }
  }

  /**
   * Apply automated rules based on classification
   */
  static async applyClassificationRules(
    messageId: string,
    classification: AIClassification,
    organizationId: string
  ): Promise<void> {
    try {
      // Auto-archive out of office replies
      if (classification.intent === 'out_of_office') {
        await supabase
          .from('inbox_messages')
          .update({ is_archived: true })
          .eq('id', messageId)
      }

      // Auto-star high priority messages
      if (classification.priority === 'high') {
        await supabase
          .from('inbox_messages')
          .update({ is_starred: true })
          .eq('id', messageId)
      }

      // Create tasks for messages requiring attention
      if (classification.requires_human_attention && classification.next_action !== 'ignore') {
        await supabase
          .from('tasks')
          .insert({
            organization_id: organizationId,
            title: `Follow up on ${classification.intent} reply`,
            description: `Message classified as ${classification.intent} with ${classification.sentiment} sentiment. ${classification.reasoning}`,
            type: 'follow_up',
            priority: classification.priority,
            related_message_id: messageId,
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            status: 'pending'
          })
      }

    } catch (error) {
      console.error('Failed to apply classification rules:', error)
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function classifyReplyWithAI(emailBody: string): Promise<ReplyClassification> {
  try {
    const classification = await ReplyClassifierService.classifyReply(emailBody, '', '')
    
    return {
      category: classification.intent as any,
      sentiment: classification.sentiment as any,
      needsResponse: classification.requires_human_attention,
      confidence: classification.confidence,
      summary: classification.reasoning
    }
  } catch (error) {
    console.error('Legacy AI classification error:', error)
    
    return {
      category: 'neutral',
      sentiment: 'neutral',
      needsResponse: false,
      confidence: 0.5,
      summary: 'Classification failed'
    }
  }
}

// Default export
export default ReplyClassifierService