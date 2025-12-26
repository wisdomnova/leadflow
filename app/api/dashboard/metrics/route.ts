import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/dashboard/metrics
 * Comprehensive dashboard metrics from campaigns
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const userId = decoded.userId;

    // Get all campaigns for this user
    const { data: campaigns, error: campaignErr } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        sent_count,
        delivered_count,
        opened_count,
        clicked_count,
        replied_count,
        bounced_count,
        total_recipients,
        created_at,
        updated_at
      `)
      .eq('user_id', userId);

    if (campaignErr) {
      return NextResponse.json({ error: campaignErr.message }, { status: 500 });
    }

    // Calculate aggregate metrics
    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => ['sending', 'queued', 'scheduled'].includes(c.status)).length || 0;
    const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;
    const pausedCampaigns = campaigns?.filter(c => c.status === 'paused').length || 0;

    const totalSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
    const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.delivered_count || 0), 0) || 0;
    const totalOpened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0;
    const totalClicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0;
    const totalReplied = campaigns?.reduce((sum, c) => sum + (c.replied_count || 0), 0) || 0;
    const totalBounced = campaigns?.reduce((sum, c) => sum + (c.bounced_count || 0), 0) || 0;

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0';
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

    // Get recent campaigns for quick view
    const recentCampaigns = (campaigns || [])
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sent: c.sent_count || 0,
        opened: c.opened_count || 0,
        clicked: c.clicked_count || 0,
        replied: c.replied_count || 0,
        openRate: c.sent_count > 0 ? ((c.opened_count || 0) / c.sent_count * 100).toFixed(1) : '0',
        clickRate: c.sent_count > 0 ? ((c.clicked_count || 0) / c.sent_count * 100).toFixed(1) : '0',
        replyRate: c.sent_count > 0 ? ((c.replied_count || 0) / c.sent_count * 100).toFixed(1) : '0',
      }));

    // Get top performing campaigns
    const topCampaigns = (campaigns || [])
      .filter(c => c.sent_count > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        sent: c.sent_count || 0,
        openRate: c.sent_count > 0 ? parseFloat(((c.opened_count || 0) / c.sent_count * 100).toFixed(1)) : 0,
        engagement: ((c.opened_count || 0) + (c.clicked_count || 0) + (c.replied_count || 0)) / (c.sent_count || 1),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // Get contacts overview
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId);

    const totalContacts = contacts?.length || 0;

    return NextResponse.json(
      {
        summary: {
          totalCampaigns,
          activeCampaigns,
          completedCampaigns,
          pausedCampaigns,
          totalContacts,
        },
        metrics: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalReplied,
          totalBounced,
          openRate: parseFloat(openRate),
          clickRate: parseFloat(clickRate),
          replyRate: parseFloat(replyRate),
          deliveryRate: parseFloat(deliveryRate),
          bounceRate: parseFloat(bounceRate),
        },
        recent: recentCampaigns,
        topPerforming: topCampaigns,
        allCampaigns: campaigns || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
