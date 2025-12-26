import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type ReplyCategory =
  | 'interested'
  | 'not_interested'
  | 'question'
  | 'out_of_office'
  | 'meeting_request'
  | 'objection'
  | 'other'

export type ReplyAnalysis = {
  category: ReplyCategory
  sentiment: number // -1.0 to 1.0
  summary: string
}

const SYSTEM_PROMPT = `You are an AI assistant analyzing email replies to sales/marketing campaigns. 
Classify each reply into one of these categories and provide a sentiment score:

Categories:
- interested: Positive response, wants to learn more or engage
- not_interested: Clear rejection or no interest
- question: Asking for clarification or more information
- out_of_office: Automated out-of-office reply
- meeting_request: Requesting a call, demo, or meeting
- objection: Has concerns (pricing, timing, fit)
- other: Doesn't fit above categories

Sentiment: -1.0 (very negative) to 1.0 (very positive)

Respond with valid JSON only: { "category": "...", "sentiment": 0.5, "summary": "Brief one-line summary" }`

export async function classifyReply(emailBody: string): Promise<ReplyAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this email reply:\n\n${emailBody}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      category: result.category || 'other',
      sentiment: Math.max(-1, Math.min(1, result.sentiment || 0)),
      summary: result.summary || '',
    }
  } catch (error) {
    console.error('OpenAI classification error:', error)
    return { category: 'other', sentiment: 0, summary: 'Failed to classify' }
  }
}
