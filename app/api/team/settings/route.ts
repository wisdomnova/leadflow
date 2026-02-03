import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context || context.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { autoJoinEnabled } = await req.json();

    const { error } = await context.supabase
      .from("organizations")
      .update({
        auto_join_enabled: autoJoinEnabled,
        updated_at: new Date().toISOString()
      })
      .eq("id", context.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating team settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
