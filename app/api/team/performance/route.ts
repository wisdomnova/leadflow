import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const userId = decoded.userId

    // Get user's workspaces (only if they're a member)
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)

    if (workspaceError || !workspaces || workspaces.length === 0) {
      return NextResponse.json({
        teamMembers: [],
        summary: {
          totalMembers: 0,
          activeCampaigns: 0,
          emailsSentLast7d: 0,
        },
        metrics: {
          avgOpenRate: 0,
          avgReplyRate: 0,
        },
      })
    }

    const workspaceIds = workspaces.map((w) => w.workspace_id)

    // Get team members for all user's workspaces
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('user_id, role')
      .in('workspace_id', workspaceIds)

    if (membersError) {
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    const memberIds = members?.map((m) => m.user_id) || []

    // Check permissions: only admins/owners can see all members, members only see their own data
    const { data: currentMemberRole } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceIds[0])
      .eq('user_id', userId)
      .single()

    const canViewAllMembers = currentMemberRole?.role === 'owner' || currentMemberRole?.role === 'admin'
    const visibleMemberIds = canViewAllMembers ? memberIds : [userId]

    // Get campaigns and email events for visible members (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, name, status, created_at')
      .in('user_id', visibleMemberIds)
      .in('workspace_id', workspaceIds)

    if (campaignError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Get email events for these campaigns
    const campaignIds = campaigns?.map((c) => c.id) || []
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select('campaign_id, event_type, user_id')
      .in('campaign_id', campaignIds)
      .gte('timestamp', sevenDaysAgo.toISOString())

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Get user details for team members
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', visibleMemberIds)

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Build team performance data
    const teamMembersMap = new Map()

    visibleMemberIds.forEach((memberId) => {
      const user = usersData?.find((u) => u.id === memberId)
      teamMembersMap.set(memberId, {
        id: memberId,
        name: user?.full_name || 'Unknown',
        email: user?.email || '',
        activeCampaigns: 0,
        openRate: 0,
        replyRate: 0,
        status: 'active',
        campaignCount: 0,
        sent: 0,
        opened: 0,
        replied: 0,
      })
    })

    // Aggregate campaign stats by user
    campaigns?.forEach((campaign) => {
      const member = teamMembersMap.get(campaign.user_id)
      if (member && campaign.status !== 'draft') {
        member.activeCampaigns += 1
        member.campaignCount += 1
      }
    })

    // Calculate rates from events
    const eventsByMember = new Map()
    events?.forEach((event) => {
      const campaign = campaigns?.find((c) => c.id === event.campaign_id)
      if (campaign) {
        const userId = campaign.user_id
        if (!eventsByMember.has(userId)) {
          eventsByMember.set(userId, { sent: 0, opened: 0, replied: 0 })
        }
        const stats = eventsByMember.get(userId)
        if (event.event_type === 'sent') stats.sent += 1
        if (event.event_type === 'open') stats.opened += 1
        if (event.event_type === 'reply') stats.replied += 1
      }
    })

    // Calculate rates
    let totalSent = 0
    let totalOpened = 0
    let totalReplied = 0
    let rateCount = 0

    eventsByMember.forEach((stats, userId) => {
      const member = teamMembersMap.get(userId)
      if (member) {
        member.sent = stats.sent
        member.opened = stats.opened
        member.replied = stats.replied
        if (stats.sent > 0) {
          member.openRate = parseFloat(((stats.opened / stats.sent) * 100).toFixed(2))
          member.replyRate = parseFloat(((stats.replied / stats.sent) * 100).toFixed(2))
          totalSent += stats.sent
          totalOpened += stats.opened
          totalReplied += stats.replied
          rateCount += 1
        }
      }
    })

    // Sort by reply rate descending
    const teamMembers = Array.from(teamMembersMap.values()).sort(
      (a, b) => b.replyRate - a.replyRate
    )

    const avgOpenRate = rateCount > 0 ? parseFloat((totalOpened / totalSent * 100).toFixed(2)) : 0
    const avgReplyRate = rateCount > 0 ? parseFloat((totalReplied / totalSent * 100).toFixed(2)) : 0
    const activeCampaignCount = campaigns?.filter((c) => c.status !== 'draft').length || 0

    return NextResponse.json({
      teamMembers,
      summary: {
        totalMembers: canViewAllMembers ? visibleMemberIds.length : 1,
        activeCampaigns: activeCampaignCount,
        emailsSentLast7d: totalSent,
      },
      metrics: {
        avgOpenRate,
        avgReplyRate,
      },
    })
  } catch (error) {
    console.error('Team performance metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
