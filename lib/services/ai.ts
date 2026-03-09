import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCampaignContent({ 
  goal, 
  targetAudience, 
  tone, 
  companyInfo, 
  existingContent,
  fullSequence,
  currentStepIndex
}: { 
  goal: string; 
  targetAudience: string; 
  tone: string; 
  companyInfo?: string;
  existingContent?: string;
  fullSequence?: any[];
  currentStepIndex?: number;
}) {
  let sequenceContext = "";
  if (fullSequence && fullSequence.length > 0) {
    sequenceContext = `
    CURRENT SEQUENCE CONTEXT:
    This is a multi-step campaign. The user is currently editing Step ${ (currentStepIndex || 0) + 1} out of ${fullSequence.length}.
    Full Sequence Overview:
    ${fullSequence.map((s, i) => `Step ${i+1} (${s.type}): ${s.subject || '(No subject)'}`).join('\n')}
    `;
  }

  const prompt = `
    You are a world-class cold email copywriter and sequence strategist.
    
    TASK:
    ${existingContent ? 'Analyze and optimize the current email draft.' : 'Generate a new high-performing cold email.'}
    ${sequenceContext}
    
    CONTEXT:
    - Goal: ${goal}
    - Target Audience: ${targetAudience}
    - Tone: ${tone}
    ${companyInfo ? `- Company Info: ${companyInfo}` : ''}
    ${existingContent ? `- Current Draft: ${existingContent}` : ''}
    
    CORE DIRECTIVES:
    1. SEQUENCE AWARENESS: If this is a follow-up (not Step 1), ensure it references the previous steps naturally without being repetitive.
    2. STRATEGIC ANALYSIS: Evaluate if the current content is already optimal. 
       - If the content is excellent and follows all best practices (brief, clear CTA, no spam), return "Nothing is recommended as your content is already highly optimized for deliverability and conversion" in the 'recommendation' field.
    3. FORMATTING: Use PLAIN TEXT with double line breaks (\\n\\n). No HTML tags.
    4. SPAM AVOIDANCE: Avoid spam triggers (free, guaranteed, urgent, etc.).
    5. CALL TO ACTION: Use low-friction CTAs.
    
    Return a JSON object with:
    - 'subject': Optimized subject line.
    - 'body': Optimized body.
    - 'recommendation': A brief explanation of WHY you made these changes, or the "Nothing is recommended..." string if no changes needed.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are a professional sales outreach consultant. You analyze email sequences for conversion and deliverability. If a draft is already perfect, you admit it." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : null;
}

// ─── Reply Classification ────────────────────────────────────────────────────

export type ReplyClassification = 
  | "Interested" 
  | "Not Interested" 
  | "Out of Office" 
  | "Follow-up" 
  | "Closed Won";

export interface ClassifyResult {
  classification: ReplyClassification;
  confidence: number;
  reasoning: string;
}

/**
 * Classify a campaign reply using GPT-4o-mini.
 * Returns the classification label, confidence (0-1), and brief reasoning.
 */
export async function classifyReply({
  replyText,
  originalSubject,
  leadName,
  campaignContext,
}: {
  replyText: string;
  originalSubject?: string;
  leadName?: string;
  campaignContext?: string;
}): Promise<ClassifyResult> {
  const prompt = `Classify this email reply from a cold outreach campaign into exactly one category.

CATEGORIES:
- "Interested": The lead shows genuine interest, wants to learn more, asks for a demo, pricing, or next steps.
- "Not Interested": The lead declines, asks to be removed, says no, or shows clear disinterest.
- "Out of Office": Auto-reply, vacation notice, OOO, or any automated "not available" response.
- "Follow-up": The lead asks a question, requests more info but hasn't committed, or gives a neutral/ambiguous reply.
- "Closed Won": The lead explicitly agrees to a deal, signs up, confirms a purchase, or says "let's do it".

CONTEXT:
${originalSubject ? `- Original Subject: ${originalSubject}` : ''}
${leadName ? `- Lead Name: ${leadName}` : ''}
${campaignContext ? `- Campaign: ${campaignContext}` : ''}

REPLY:
"""
${replyText.slice(0, 2000)}
"""

Return a JSON object:
{
  "classification": "<one of the 5 categories exactly>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one sentence explanation>"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert B2B sales assistant. You classify email replies from cold outreach campaigns with high accuracy. Be concise. Always return valid JSON."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 150,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return { classification: "Follow-up", confidence: 0.5, reasoning: "Unable to classify" };
  }

  try {
    const parsed = JSON.parse(content);
    const validCategories: ReplyClassification[] = ["Interested", "Not Interested", "Out of Office", "Follow-up", "Closed Won"];
    
    if (!validCategories.includes(parsed.classification)) {
      return { classification: "Follow-up", confidence: 0.5, reasoning: "Unknown classification returned" };
    }
    
    return {
      classification: parsed.classification,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { classification: "Follow-up", confidence: 0.5, reasoning: "Failed to parse AI response" };
  }
}
