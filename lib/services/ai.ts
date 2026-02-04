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
