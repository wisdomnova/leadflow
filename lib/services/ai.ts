import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCampaignContent({ goal, targetAudience, tone, companyInfo, existingContent }: { 
  goal: string; 
  targetAudience: string; 
  tone: string; 
  companyInfo?: string;
  existingContent?: string;
}) {
  const prompt = `
    You are an expert cold email copywriter. ${existingContent ? 'Optimize the following draft for higher conversion and better engagement.' : 'Generate a high-converting cold email sequence based on the following:'}
    
    Goal: ${goal}
    Target Audience: ${targetAudience}
    Tone: ${tone}
    ${companyInfo ? `Company Info: ${companyInfo}` : ''}
    ${existingContent ? `Existing Draft: ${existingContent}` : ''}
    
    Return a JSON object with a 'subject' and a 'body'. 
    The body should be in HTML format and include placeholder tokens like {{first_name}}, {{company}}, and {{job_title}}.
    Keep the email concise, personalized, and focused on the value proposition.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a professional sales outreach assistant." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : null;
}
