import { NextRequest, NextResponse } from "next/server";
import { generateCampaignContent } from "@/lib/services/ai";
import { getSessionContext } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionContext();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { goal, audience, tone, companyInfo, existingContent, fullSequence, currentStepIndex } = body;

    const suggestion = await generateCampaignContent({ 
        goal: goal || "Optimize sequence", 
        targetAudience: audience || "Prospect", 
        tone: tone || "Professional", 
        companyInfo,
        existingContent,
        fullSequence,
        currentStepIndex
    });

    return NextResponse.json(suggestion);
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate content" }, { status: 500 });
  }
}
