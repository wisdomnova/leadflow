import { getAdminClient } from "./supabase";

/**
 * Creates a notification for a specific user or organization
 */
export async function createNotification({
  userId,
  orgId,
  title,
  description,
  type = 'info',
  category = 'system',
  link
}: {
  userId?: string;
  orgId: string;
  title: string;
  description?: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  category?: 'email_events' | 'billing_alerts' | 'campaign_updates' | 'system';
  link?: string;
}) {
  const supabase = getAdminClient();

  // If userId is not provided, we notify all admins in the organization
  if (!userId) {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("org_id", orgId)
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        org_id: orgId,
        title,
        description,
        type,
        category,
        link,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) console.error("Failed to batch create notifications:", error);
    }
  } else {
    // Notify specific user
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      org_id: orgId,
      title,
      description,
      type,
      category,
      link,
    });
    if (error) console.error("Failed to create notification:", error);
  }
}
