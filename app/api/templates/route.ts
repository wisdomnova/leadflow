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
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
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

    // Validate input lengths
    if (!name || name.length > 200) {
      return NextResponse.json({ error: "Template name is required and must be under 200 characters" }, { status: 400 });
    }
    if (subject && subject.length > 1000) {
      return NextResponse.json({ error: "Subject must be under 1000 characters" }, { status: 400 });
    }
    if (templateBody && templateBody.length > 100000) {
      return NextResponse.json({ error: "Template body must be under 100KB" }, { status: 400 });
    }
    if (category && category.length > 100) {
      return NextResponse.json({ error: "Category must be under 100 characters" }, { status: 400 });
    }

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
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
