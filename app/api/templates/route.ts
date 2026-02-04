import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

// GET /api/templates - List all templates for an organization
export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: templates, error } = await context.supabase
      .from("email_templates")
      .select("*")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, subject, body: templateBody, category } = body;

    const { data: template, error } = await (context.supabase as any)
      .from("email_templates")
      .insert([{
        org_id: context.orgId,
        name,
        subject,
        body: templateBody,
        category: category || "Cold Outreach",
      }] as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
