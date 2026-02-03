import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'avatar' or 'banner'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const supabase = getAdminClient();
    
    // Check if bucket exists, if not this might fail but we'll try to upload
    // In production, the 'media' bucket should be created via Supabase dashboard
    const fileExt = file.name.split(".").pop();
    const fileName = `${payload.userId}/${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const buffer = await file.arrayBuffer();

    const { data, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
