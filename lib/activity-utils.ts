import { SupabaseClient } from "@supabase/supabase-js";

export type ActivityType = 
  | 'lead_created'
  | 'lead_updated'
  | 'lead_tagged'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'campaign_enrolled'
  | 'status_changed';

interface LogActivityParams {
  supabase: SupabaseClient;
  leadId: string;
  orgId: string;
  type: ActivityType;
  description: string;
  metadata?: any;
}

export async function logLeadActivity({
  supabase,
  leadId,
  orgId,
  type,
  description,
  metadata = {}
}: LogActivityParams) {
  try {
    const { error } = await (supabase as any)
      .from("activity_log")
      .insert([{
        org_id: orgId,
        action_type: type,
        description,
        metadata: {
          ...metadata,
          lead_id: leadId
        },
        created_at: new Date().toISOString()
      }] as any);

    if (error) {
      console.error("Failed to log activity:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Error logging activity:", err);
    return { success: false, error: err };
  }
}
