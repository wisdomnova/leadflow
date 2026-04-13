'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import { 
  Zap, 
  Server, 
  ShieldCheck, 
  Send, 
  Activity, 
  RefreshCw, 
  Plus, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Globe,
  BarChart3,
  Search,
  ArrowUpRight,
  Settings2,
  TrendingUp,
  Target,
  Users,
  Trash2,
  HelpCircle,
  X,
  ArrowRight,
  Flame,
  Play,
  Pause,
  Timer,
  Calendar,
  Mail,
  Upload,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  FileText,
  Loader2
} from 'lucide-react';

interface ServerMailbox {
  id: string;
  server_id: string;
  email: string;
  display_name: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_username: string | null;
  imap_password: string | null;
  status: 'active' | 'warming' | 'paused' | 'error' | 'disabled';
  reputation_score: number;
  daily_limit: number;
  current_usage: number;
  total_sends: number;
  last_sent_at: string | null;
  error_message: string | null;
  warmup_enabled: boolean;
  warmup_day: number;
  warmup_daily_sends: number;
  created_at: string;
}

interface SmartServer {
  id: string;
  name: string;
  provider: string;
  domain_name: string;
  ip_address: string;
  status: 'active' | 'warming' | 'paused' | 'failed';
  reputation_score: number;
  daily_limit: number;
  current_usage: number;
  total_sends: number;
  last_sent_at: string | null;
  last_health_check: string | null;
  bounce_rate: number;
  complaint_rate: number;
  delivery_rate: number;
  auto_warmup_at: string | null;
  warmup_enabled: boolean;
  warmup_day: number;
  warmup_started_at: string | null;
  warmup_completed_at: string | null;
  warmup_target_limit: number;
  warmup_daily_sends: number;
  mailbox_count: number;
  default_smtp_host: string | null;
  default_smtp_port: number | null;
  default_imap_host: string | null;
  default_imap_port: number | null;
  created_at: string;
}

export default function PowerSendPage() {
  const [servers, setServers] = useState<SmartServer[]>([]);
  const [stats, setStats] = useState({
    totalNodes: 0,
    activeNodes: 0,
    avgReputation: 0,
    totalSends: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; description: string; onConfirm: () => void; type: 'danger' | 'warning' }>({ show: false, title: '', description: '', onConfirm: () => {}, type: 'danger' });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isWarmupModalOpen, setIsWarmupModalOpen] = useState(false);
  const [warmupTarget, setWarmupTarget] = useState<SmartServer | null>(null);
  const [warmupTargetLimit, setWarmupTargetLimit] = useState(500);
  const [isWarmupSubmitting, setIsWarmupSubmitting] = useState(false);
  const [editingServer, setEditingServer] = useState<SmartServer | null>(null);
  
  // Mailbox pool states
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [serverMailboxes, setServerMailboxes] = useState<Record<string, ServerMailbox[]>>({});
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [mailboxServer, setMailboxServer] = useState<SmartServer | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [mailboxFormData, setMailboxFormData] = useState({
    email: '',
    display_name: '',
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    imap_host: '',
    imap_port: '',
    imap_username: '',
    imap_password: '',
    daily_limit: 30,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    ip_address: '',
    daily_limit: 500,
    api_key: '',
    status: 'active' as string,
    smtp_config: {
      host: '',
      port: '465',
      username: '',
      password: '',
      from_email: ''
    }
  });
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    domain_name: '',
    ip_address: '',
    daily_limit: 500,
    api_key: '',
    default_smtp_host: '',
    default_smtp_port: '465',
    default_imap_host: '',
    default_imap_port: '993',
    smtp_config: {
      host: '',
      port: '465',
      username: '',
      password: '',
      from_email: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/powersend');
      const data = await res.json();
      
      if (data.restricted) {
        setIsRestricted(true);
        return;
      }

      setServers(data.servers || []);
      setStats(data.stats || {
        totalNodes: 0,
        activeNodes: 0,
        avgReputation: 0,
        totalSends: 0
      });
    } catch (error) {
      console.error('Failed to fetch PowerSend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch('/api/powersend');
      const data = await res.json();
      if (data.restricted) { setIsRestricted(true); return; }
      setServers(data.servers || []);
      setStats(data.stats || { totalNodes: 0, activeNodes: 0, avgReputation: 0, totalSends: 0 });
    } catch (error) {
      console.error('Failed to refresh PowerSend data:', error);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/powersend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || 'Failed to add server');
      }

      const newServer = await res.json();

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        provider: 'custom',
        domain_name: '',
        ip_address: '',
        daily_limit: 500,
        api_key: '',
        default_smtp_host: '',
        default_smtp_port: '465',
        default_imap_host: '',
        default_imap_port: '993',
        smtp_config: {
          host: '',
          port: '465',
          username: '',
          password: '',
          from_email: ''
        }
      });
      showToast('Smart server added — now add your mailboxes!');
      await refreshData();
      // Auto-expand the new server so mailbox buttons are immediately visible
      if (newServer?.id) {
        setExpandedServerId(newServer.id);
        setServerMailboxes(prev => ({ ...prev, [newServer.id]: [] }));
      }
    } catch (error: any) {
      console.error('Add server error:', error);
      showToast(error.message || 'Failed to add server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServer = (id: string) => {
    const server = servers.find(s => s.id === id); 
    setConfirmModal({
      show: true,
      title: 'Remove Smart Server?',
      description: `Are you sure you want to remove "${server?.name || 'this server'}"? All associated mailboxes and warmup data will be lost.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setActionLoadingId(id);
        try {
          const res = await fetch(`/api/powersend/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setServers(prev => prev.filter(s => s.id !== id));
            showToast('Server removed successfully');
            await refreshData();
          } else {
            showToast('Failed to remove server', 'error');
          }
        } catch (error) {
          console.error('Delete server error:', error);
          showToast('Failed to remove server', 'error');
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  const openEditModal = (server: SmartServer) => {
    setEditingServer(server);
    setEditFormData({
      name: server.name,
      ip_address: server.ip_address || '',
      daily_limit: server.daily_limit,
      api_key: '',
      status: server.status,
      smtp_config: {
        host: '',
        port: '465',
        username: '',
        password: '',
        from_email: ''
      }
    });
    setIsEditModalOpen(true);
  };

  const handleEditServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServer) return;
    try {
      setIsSubmitting(true);
      // Only send fields that have values (don't overwrite SMTP with blanks)
      const payload: any = {
        name: editFormData.name,
        ip_address: editFormData.ip_address || null,
        daily_limit: editFormData.daily_limit,
        status: editFormData.status,
      };
      if (editFormData.api_key) payload.api_key = editFormData.api_key;
      if (editFormData.smtp_config.host) payload.smtp_config = editFormData.smtp_config;

      const res = await fetch(`/api/powersend/${editingServer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || 'Failed to update server');
      }

      setIsEditModalOpen(false);
      setEditingServer(null);
      showToast('Server updated successfully');
      await refreshData();
    } catch (error: any) {
      console.error('Edit server error:', error);
      showToast(error.message || 'Failed to update server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      setIsHealthChecking(true);
      const res = await fetch('/api/powersend/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Health check failed');
      // Refresh data to show updated scores
      showToast('Health check complete');
      await refreshData();
    } catch (error) {
      console.error('Health check error:', error);
      showToast('Health check failed', 'error');
    } finally {
      setIsHealthChecking(false);
    }
  };

  const openWarmupModal = (server: SmartServer) => {
    setWarmupTarget(server);
    setWarmupTargetLimit(server.warmup_target_limit || server.daily_limit || 500);
    setIsWarmupModalOpen(true);
  };

  const handleStartWarmup = async () => {
    if (!warmupTarget) return;
    try {
      setIsWarmupSubmitting(true);
      const res = await fetch('/api/powersend/warmup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: warmupTarget.id,
          action: 'start',
          targetLimit: warmupTargetLimit,
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to start warmup');
      }
      // Optimistic update
      setServers(prev => prev.map(s => s.id === warmupTarget.id ? { ...s, warmup_enabled: true, status: 'warming' as const, warmup_day: 1, daily_limit: 10 } : s));
      setIsWarmupModalOpen(false);
      setWarmupTarget(null);
      showToast(`Warmup started for ${warmupTarget.name}`);
      await refreshData();
    } catch (error: any) {
      console.error('Warmup start error:', error);
      showToast(error.message || 'Failed to start warmup', 'error');
    } finally {
      setIsWarmupSubmitting(false);
    }
  };

  const handleStopWarmup = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    setConfirmModal({
      show: true,
      title: 'Stop Warmup?',
      description: `Stop warmup for "${server?.name || 'this node'}" and restore full sending capacity? The node will return to active status.`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setActionLoadingId(serverId);
        try {
          const res = await fetch('/api/powersend/warmup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverId, action: 'stop' })
          });
          if (!res.ok) throw new Error('Failed to stop warmup');
          // Optimistic update
          setServers(prev => prev.map(s => s.id === serverId ? { ...s, warmup_enabled: false, status: 'active' as const } : s));
          showToast('Warmup stopped — node restored to active');
          await refreshData();
        } catch (error: any) {
          console.error('Warmup stop error:', error);
          showToast('Failed to stop warmup', 'error');
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  // --- Mailbox Pool Functions ---
  const fetchMailboxes = async (serverId: string) => {
    try {
      const res = await fetch(`/api/powersend/mailboxes?serverId=${serverId}`);
      const data = await res.json();
      setServerMailboxes(prev => ({ ...prev, [serverId]: data.mailboxes || [] }));
    } catch (error) {
      console.error('Failed to fetch mailboxes:', error);
    }
  };

  const toggleExpandServer = async (serverId: string) => {
    if (expandedServerId === serverId) {
      setExpandedServerId(null);
    } else {
      setExpandedServerId(serverId);
      if (!serverMailboxes[serverId]) {
        await fetchMailboxes(serverId);
      }
    }
  };

  const openAddMailboxModal = (server: SmartServer) => {
    setMailboxServer(server);
    setMailboxFormData({
      email: '',
      display_name: '',
      smtp_host: server.default_smtp_host || '',
      smtp_port: server.default_smtp_port?.toString() || '465',
      smtp_username: '',
      smtp_password: '',
      imap_host: server.default_imap_host || '',
      imap_port: server.default_imap_port?.toString() || '993',
      imap_username: '',
      imap_password: '',
      daily_limit: 30,
    });
    setIsMailboxModalOpen(true);
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailboxServer) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/powersend/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: mailboxServer.id,
          mailbox: mailboxFormData,
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to add mailbox');
      }
      await fetchMailboxes(mailboxServer.id);
      await refreshData();
      setIsMailboxModalOpen(false);
      setMailboxServer(null);
      showToast('Mailbox added successfully');
    } catch (error: any) {
      console.error('Add mailbox error:', error);
      showToast(error.message || 'Failed to add mailbox', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMailbox = (mailboxId: string, serverId: string) => {
    setConfirmModal({
      show: true,
      title: 'Remove Mailbox?',
      description: 'Remove this mailbox from the pool? It will no longer participate in send rotation.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch('/api/powersend/mailboxes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mailboxIds: [mailboxId] })
          });
          if (res.ok) {
            await fetchMailboxes(serverId);
            await refreshData();
            showToast('Mailbox removed');
          } else {
            showToast('Failed to remove mailbox', 'error');
          }
        } catch (error) {
          console.error('Delete mailbox error:', error);
          showToast('Failed to remove mailbox', 'error');
        }
      }
    });
  };

  const openCSVModal = (server: SmartServer) => {
    setMailboxServer(server);
    setCsvText('');
    setCsvPreview([]);
    setIsCSVModalOpen(true);
  };

  const handleCSVPreview = (text: string) => {
    setCsvText(text);
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setCsvPreview([]); return; }
      
      // Parse CSV header properly (handle quoted fields)
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
        result.push(current);
        return result;
      };
      
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const preview = lines.slice(1, 6).map(line => {
        const values = parseCSVLine(line).map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      }).filter(r => r['email'] || r['email_address']);
      setCsvPreview(preview);
    } catch {
      setCsvPreview([]);
    }
  };

  const handleCSVUpload = async () => {
    if (!mailboxServer || !csvText.trim()) return;
    try {
      setIsImporting(true);
      const res = await fetch('/api/powersend/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: mailboxServer.id,
          csv: csvText,
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'CSV import failed');
      }
      const result = await res.json();
      await fetchMailboxes(mailboxServer.id);
      await refreshData();
      setIsCSVModalOpen(false);
      setMailboxServer(null);
      showToast(`Successfully imported ${result.imported} mailbox${result.imported !== 1 ? 'es' : ''}`);
    } catch (error: any) {
      console.error('CSV upload error:', error);
      showToast(error.message || 'CSV import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCSVFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const fname = file?.name?.toLowerCase() || '';
    const isCSVLike = fname.endsWith('.csv') || fname.endsWith('.tsv') || fname.endsWith('.txt')
      || file?.type === 'text/csv' || file?.type === 'text/plain' || file?.type === 'application/csv'
      || file?.type === 'application/vnd.ms-excel' || file?.type === 'application/octet-stream' || file?.type === '';
    if (file && isCSVLike) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        handleCSVPreview(text);
      };
      reader.readAsText(file);
    }
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        handleCSVPreview(text);
      };
      reader.readAsText(file);
    }
  };

  // Warmup schedule reference for the UI
  const warmupSchedule = [
    { day: '1', limit: 10 }, { day: '2', limit: 25 }, { day: '3', limit: 50 },
    { day: '4', limit: 75 }, { day: '5', limit: 100 }, { day: '6-7', limit: 150 },
    { day: '8-10', limit: 200 }, { day: '11-14', limit: 300 }, { day: '15-21', limit: 400 },
    { day: '22-28', limit: 500 },
  ];

  // Map a warmup day number to its schedule step index
  const getWarmupStepIndex = (day: number): number => {
    const endDays = [1, 2, 3, 4, 5, 7, 10, 14, 21, 28];
    for (let i = 0; i < endDays.length; i++) {
      if (day <= endDays[i]) return i;
    }
    return endDays.length - 1;
  };

  const warmingNodes = servers.filter(s => s.warmup_enabled && s.status === 'warming');

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ip_address.includes(searchQuery) ||
    s.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { name: 'Total Nodes', value: stats.totalNodes.toString(), icon: Server },
    { name: 'Active & Protected', value: stats.activeNodes.toString(), icon: ShieldCheck },
    { name: 'Warming Up', value: warmingNodes.length.toString(), icon: Flame },
    { name: 'Avg Reputation', value: `${stats.avgReputation}%`, icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <SubscriptionGuard>
            <div className="max-w-[1400px] mx-auto space-y-10">
            {isRestricted ? (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-12 text-center max-w-2xl mx-auto my-20">
                <div className="w-20 h-20 bg-[#745DF3]/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#745DF3]/10">
                  <Zap className="w-10 h-10 text-[#745DF3]" />
                </div>
                <h2 className="text-2xl font-black text-[#101828] mb-3">PowerSend is Locked</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  Infrastructure-level IP rotation is only available on the <b>Enterprise</b> plan. Upgrade today to scale your deliverability with dedicated Nodes.
                </p>
                <Link 
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#745DF3] text-white rounded-2xl font-bold hover:bg-[#6349df] transition-all shadow-lg shadow-[#745DF3]/20"
                >
                  Upgrade to Unlock
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-[#101828] tracking-tight">PowerSend</h1>
                      <div className="bg-[#745DF3]/10 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-[#745DF3]/10">
                        <Zap className="w-3.5 h-3.5 text-[#745DF3] fill-[#745DF3]" />
                        <span className="text-[10px] font-bold text-[#745DF3] uppercase tracking-wider">Infrastructure</span>
                      </div>
                    </div>
                    <p className="text-gray-500 font-medium mt-1">
                      Monitor distributed server pools and control high-volume outbound rotation.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsHelpModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[#745DF3] bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-xl text-sm font-bold hover:bg-[#745DF3]/10 transition-all"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Guide
                    </button>
                    <button 
                      onClick={runHealthCheck}
                      disabled={isHealthChecking}
                      className="flex items-center gap-2 px-4 py-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all shadow-sm"
                    >
                      <Activity className={`w-4 h-4 ${isHealthChecking ? 'animate-pulse' : ''}`} />
                      {isHealthChecking ? 'Checking...' : 'Health Check'}
                    </button>
                    <button 
                      onClick={fetchData}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Smart Server
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {statCards.map((stat, idx) => (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#745DF3]/20 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] group-hover:bg-[#745DF3] group-hover:text-white transition-all duration-300">
                          <stat.icon className="w-6 h-6" />
                        </div>
                    <div>
                      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] leading-none mb-1.5">{stat.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-black text-[#101828] tracking-tighter">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar lg:w-auto w-full px-2">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">System Active</span>
                </div>
              </div>
              <div className="relative lg:w-96 w-full px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nodes, IPs, or providers..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Nodes Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FBFBFB] border-b border-gray-100">
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Node Name / IP</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Mailboxes</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Reputation</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Load</th>
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="px-8 py-6 h-20 bg-gray-50/20" />
                      </tr>
                    ))
                  ) : filteredServers.length > 0 ? (
                    filteredServers.map((server) => {
                      const dailyUsage = server.status === 'warming' ? (server.warmup_daily_sends || 0) : (server.current_usage || 0);
                      return (
                      <React.Fragment key={server.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => toggleExpandServer(server.id)}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                              <Globe className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-[#101828] text-sm">{server.name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{server.ip_address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm text-gray-600 font-bold">{server.provider}</span>
                        </td>
                        <td className="px-6 py-6">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpandServer(server.id); }}
                            className="flex items-center gap-2 group/mb"
                          >
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#745DF3]/5 rounded-lg border border-[#745DF3]/10 group-hover/mb:bg-[#745DF3]/10 transition-all">
                              <Mail className="w-3.5 h-3.5 text-[#745DF3]" />
                              <span className="text-xs font-black text-[#745DF3]">{server.mailbox_count || 0}</span>
                            </div>
                            {expandedServerId === server.id ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-6">
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit shadow-sm border ${
                            server.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                            server.status === 'warming' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            server.status === 'paused' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {server.status === 'warming' && server.warmup_enabled ? 'Warming Up' : server.status === 'warming' ? 'Auto-Warmup' : server.status}
                          </div>
                          {server.status === 'warming' && server.warmup_enabled && server.warmup_day > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="w-16 h-1 bg-amber-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((server.warmup_day / 28) * 100, 100)}%` }} />
                              </div>
                              <span className="text-[9px] text-amber-600 font-black">Day {server.warmup_day}/28</span>
                            </div>
                          )}
                          {server.status === 'warming' && !server.warmup_enabled && server.auto_warmup_at && (
                            <p className="text-[9px] text-amber-500 font-bold mt-1 uppercase tracking-wider">Since {new Date(server.auto_warmup_at).toLocaleDateString()}</p>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    server.reputation_score > 80 ? 'bg-green-500' :
                                    server.reputation_score > 50 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${server.reputation_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-gray-900">{server.reputation_score}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                              <span>{dailyUsage} sends</span>
                              <span>{server.daily_limit} max</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                              <div 
                                className="h-full bg-[#745DF3] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(116,93,243,0.3)]"
                                style={{ width: `${(dailyUsage / server.daily_limit) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {actionLoadingId === server.id ? (
                              <div className="p-2">
                                <Loader2 className="w-4 h-4 text-[#745DF3] animate-spin" />
                              </div>
                            ) : (
                              <>
                                {server.warmup_enabled && server.status === 'warming' ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleStopWarmup(server.id); }}
                                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-amber-500 hover:text-amber-700 border border-transparent hover:border-amber-100"
                                    title="Stop Warmup"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </button>
                                ) : server.status === 'active' || server.status === 'paused' ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openWarmupModal(server); }}
                                    className="p-2 hover:bg-amber-50 rounded-xl transition-all text-gray-400 hover:text-amber-600 border border-transparent hover:border-amber-100"
                                    title="Start Warmup"
                                  >
                                    <Flame className="w-4 h-4" />
                                  </button>
                                ) : null}
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddMailboxModal(server); }}
                                  className="p-2 hover:bg-[#745DF3]/5 rounded-xl transition-all text-gray-400 hover:text-[#745DF3] border border-transparent hover:border-[#745DF3]/10"
                                  title="Add Mailbox"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCSVModal(server); }}
                                  className="p-2 hover:bg-[#745DF3]/5 rounded-xl transition-all text-gray-400 hover:text-[#745DF3] border border-transparent hover:border-[#745DF3]/10"
                                  title="Import CSV Mailboxes"
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openEditModal(server); }}
                                  className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-[#101828] border border-transparent hover:border-gray-100"
                                >
                                  <Settings2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteServer(server.id); }}
                                  className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Mailbox Pool Row */}
                      {expandedServerId === server.id && (
                        <tr>
                          <td colSpan={7} className="px-0 py-0 bg-gray-50/30">
                            <div className="px-8 py-5 border-t border-gray-100">
                              {/* Mailbox pool header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#745DF3]/5 rounded-xl flex items-center justify-center border border-[#745DF3]/10">
                                    <Mail className="w-4 h-4 text-[#745DF3]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-[#101828]">Mailbox Pool</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{(serverMailboxes[server.id] || []).length} mailbox{(serverMailboxes[server.id] || []).length !== 1 ? 'es' : ''} in rotation</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openCSVModal(server); }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-[#745DF3] bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-xl hover:bg-[#745DF3]/10 transition-all uppercase tracking-widest"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    CSV Import
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openAddMailboxModal(server); }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-white bg-[#101828] rounded-xl hover:bg-[#101828]/90 transition-all uppercase tracking-widest shadow-sm"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Mailbox
                                  </button>
                                </div>
                              </div>

                              {/* Mailbox list */}
                              {(serverMailboxes[server.id] || []).length > 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">SMTP</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Usage</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sent</th>
                                        <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {(serverMailboxes[server.id] || []).map((mb: ServerMailbox) => (
                                        <tr key={mb.id} className="hover:bg-gray-50/30 transition-colors">
                                          <td className="px-5 py-3">
                                            <div>
                                              <p className="text-xs font-bold text-[#101828]">{mb.email}</p>
                                              {mb.display_name && mb.display_name !== mb.email.split('@')[0] && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">{mb.display_name}</p>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest w-fit border ${
                                              mb.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                                              mb.status === 'warming' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                              mb.status === 'paused' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                              mb.status === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                                              'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                              {mb.status}
                                            </div>
                                            {mb.error_message && (
                                              <p className="text-[9px] text-red-400 mt-0.5 truncate max-w-[120px]" title={mb.error_message}>{mb.error_message}</p>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            <p className="text-[10px] text-gray-500 font-mono">
                                              {mb.smtp_host || server.default_smtp_host || '—'}
                                              <span className="text-gray-300">:</span>
                                              {mb.smtp_port || server.default_smtp_port || '—'}
                                            </p>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#745DF3] rounded-full" style={{ width: `${((mb.current_usage || 0) / (mb.daily_limit || 30)) * 100}%` }} />
                                              </div>
                                              <span className="text-[10px] font-bold text-gray-500">{mb.current_usage || 0}/{mb.daily_limit}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className="text-xs font-bold text-gray-600">{(mb.total_sends || 0).toLocaleString()}</span>
                                          </td>
                                          <td className="px-5 py-3 text-right">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleDeleteMailbox(mb.id, server.id); }}
                                              className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-gray-300 hover:text-red-500"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                                    <Mail className="w-6 h-6 text-gray-200" />
                                  </div>
                                  <p className="text-sm font-bold text-gray-500 mb-1">No mailboxes yet</p>
                                  <p className="text-xs text-gray-400 mb-4">Add mailboxes to this server pool to start rotating sends across multiple addresses.</p>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openCSVModal(server); }}
                                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#745DF3] bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-xl hover:bg-[#745DF3]/10 transition-all"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      Import CSV
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openAddMailboxModal(server); }}
                                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#101828] rounded-xl hover:bg-[#101828]/90 transition-all"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add Mailbox
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Default SMTP/IMAP info */}
                              {(server.default_smtp_host || server.default_imap_host) && (
                                <div className="mt-3 flex items-center gap-4 px-1">
                                  <p className="text-[9px] font-bold text-gray-400">
                                    Default SMTP: <span className="text-gray-500 font-mono">{server.default_smtp_host || '—'}:{server.default_smtp_port || '—'}</span>
                                  </p>
                                  <p className="text-[9px] font-bold text-gray-400">
                                    Default IMAP: <span className="text-gray-500 font-mono">{server.default_imap_host || '—'}:{server.default_imap_port || '—'}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 shadow-inner">
                            <Server className="w-8 h-8 text-gray-200" />
                          </div>
                          <div>
                            <p className="font-black text-[#101828] text-lg">No smart servers found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-1">Add your first node to start using PowerSend infrastructure.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warmup Progress Section */}
          {warmingNodes.length > 0 && (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#101828]">IP Warmup Progress</h3>
                    <p className="text-xs text-gray-400 font-medium">{warmingNodes.length} node{warmingNodes.length !== 1 ? 's' : ''} currently warming up</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {warmingNodes.map((node) => {
                  const progress = Math.min((node.warmup_day / 28) * 100, 100);
                  const dailyProgress = node.daily_limit > 0 ? ((node.warmup_daily_sends || 0) / node.daily_limit) * 100 : 0;
                  return (
                    <div key={node.id} className="px-8 py-5 flex items-center gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-[#101828] text-sm truncate">{node.name}</p>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">Day {node.warmup_day}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-gray-500 whitespace-nowrap">{Math.round(progress)}% complete</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today</p>
                        <p className="text-sm font-black text-[#101828]">{node.warmup_daily_sends || 0} <span className="text-gray-400 font-bold">/ {node.daily_limit}</span></p>
                        <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#745DF3] rounded-full" style={{ width: `${dailyProgress}%` }} />
                        </div>
                      </div>
                      <div className="shrink-0">
                        <button
                          onClick={() => handleStopWarmup(node.id)}
                          disabled={actionLoadingId === node.id}
                          className="px-3 py-1.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all uppercase tracking-widest disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {actionLoadingId === node.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Stop
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warmup Schedule Reference */}
              <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">28-Day Warmup Schedule</p>
                <div className="flex items-center gap-1">
                  {warmupSchedule.map((step, idx) => {
                    const currentStepIdx = warmingNodes[0]?.warmup_day ? getWarmupStepIndex(warmingNodes[0].warmup_day) : -1;
                    return (
                    <div key={idx} className="flex-1 text-center">
                      <div className={`h-6 rounded-md flex items-center justify-center text-[8px] font-black uppercase ${
                        idx <= currentStepIdx 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.limit}
                      </div>
                      <p className="text-[7px] font-bold text-gray-400 mt-0.5">D{step.day}</p>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure Health Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
              <Flame className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">IP Warmup</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  New nodes start at 10 emails/day and gradually ramp to full capacity over 28 days. This builds IP reputation with ISPs and prevents blacklisting.
                </p>
              </div>
            </div>

            <div className="bg-[#745DF3]/5 border border-[#745DF3]/10 p-6 rounded-2xl flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#745DF3] shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Reputation Guard</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Active nodes that drop below 70% reputation are automatically demoted to Auto-Warmup with reduced daily limits. They restore to full capacity when reputation recovers above 85%.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-start gap-4">
              <Activity className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Distributed Rotation</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Traffic is balanced across {stats.activeNodes} active node{stats.activeNodes !== 1 ? 's' : ''} using reputation-weighted round robin. Nodes with lower <code className="text-[10px] bg-orange-100 px-1 py-0.5 rounded">last_sent_at</code> and higher reputation are prioritized.
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-start gap-4">
              <Globe className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Health Monitoring</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Reputation is recalculated every 15 minutes from actual delivery metrics (bounce rate, complaint rate, delivery rate). Run a manual check anytime with the Health Check button above.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
            </div>
          </SubscriptionGuard>
        </div>
      </main>

      {/* Add Smart Server Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col max-h-[75vh] overflow-hidden"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-20 bg-white/80 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 border-b border-gray-50 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Add Smart Server</h3>
                    <p className="text-sm text-gray-500 font-medium">Provision a new high-reputation node</p>
                  </div>
                  <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <form id="add-server-form" onSubmit={handleAddServer} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Node Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Node 01"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Sending Domain</label>
                        <input
                          type="text"
                          required
                          placeholder="mail.yourdomain.com"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.domain_name}
                          onChange={e => setFormData({ ...formData, domain_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IP Address <span className="normal-case text-gray-300">(optional)</span></label>
                        <input
                          type="text"
                          placeholder="1.2.3.4"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.ip_address}
                          onChange={e => setFormData({ ...formData, ip_address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Infrastructure Provider</label>
                        <input
                          type="text"
                          placeholder="e.g. Mailreef, AWS SES, Custom SMTP"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.provider}
                          onChange={e => setFormData({ ...formData, provider: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Daily Limit</label>
                        <input
                          type="number"
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.daily_limit}
                          onChange={e => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">API Key / Auth Token</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={formData.api_key}
                        onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                      />
                    </div>

                    {/* Default SMTP/IMAP Settings */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Default SMTP / IMAP</p>
                      <p className="text-[10px] font-bold text-gray-400 mb-4 leading-relaxed">These defaults are inherited by all mailboxes in the pool unless overridden per-mailbox.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Host</label>
                          <input
                            type="text"
                            placeholder="smtp.mailreef.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.default_smtp_host}
                            onChange={e => setFormData({ ...formData, default_smtp_host: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Port</label>
                          <input
                            type="text"
                            placeholder="465"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.default_smtp_port}
                            onChange={e => setFormData({ ...formData, default_smtp_port: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Host</label>
                          <input
                            type="text"
                            placeholder="imap.mailreef.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.default_imap_host}
                            onChange={e => setFormData({ ...formData, default_imap_host: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Port</label>
                          <input
                            type="text"
                            placeholder="993"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.default_imap_port}
                            onChange={e => setFormData({ ...formData, default_imap_port: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Legacy SMTP Config (backward compat) */}
                    <div className="pt-4 border-t border-gray-100 pb-2">
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Legacy SMTP Config</p>
                      <p className="text-[10px] font-bold text-gray-400 mb-4 leading-relaxed">Single-mailbox fallback. Add mailboxes to the pool after creating the server for best results.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Host</label>
                          <input
                            type="text"
                            placeholder="smtp.mailreef.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.smtp_config.host}
                            onChange={e => setFormData({ ...formData, smtp_config: { ...formData.smtp_config, host: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Port</label>
                          <input
                            type="text"
                            placeholder="465"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.smtp_config.port}
                            onChange={e => setFormData({ ...formData, smtp_config: { ...formData.smtp_config, port: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Username</label>
                          <input
                            type="text"
                            placeholder="user@domain.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.smtp_config.username}
                            onChange={e => setFormData({ ...formData, smtp_config: { ...formData.smtp_config, username: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={formData.smtp_config.password}
                            onChange={e => setFormData({ ...formData, smtp_config: { ...formData.smtp_config, password: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">From Email</label>
                        <input
                          type="email"
                          placeholder="outreach@yourdomain.com"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.smtp_config.from_email}
                          onChange={e => setFormData({ ...formData, smtp_config: { ...formData.smtp_config, from_email: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-gray-50 bg-[#FBFBFB]/50 shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-server-form"
                    disabled={isSubmitting}
                    className="flex-[2] px-6 py-4 bg-[#101828] text-white rounded-2xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Provisioning...' : 'Provision Node'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Smart Server Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingServer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsEditModalOpen(false); setEditingServer(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingServer(null); }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-0 flex flex-col max-h-[75vh]">
                <div className="p-8 pb-0">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-[#101828]">Edit Node</h3>
                      <p className="text-sm text-gray-500 font-medium">Update configuration for <span className="font-bold text-[#101828]">{editingServer.name}</span></p>
                    </div>
                    <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                      <Settings2 className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Current Status Banner */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${editingServer.status === 'active' ? 'bg-green-500' : editingServer.status === 'warming' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                        <p className="text-sm font-bold text-[#101828] capitalize">{editingServer.status === 'warming' ? 'Auto-Warmup' : editingServer.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reputation</p>
                      <p className={`text-sm font-black ${editingServer.reputation_score > 80 ? 'text-green-600' : editingServer.reputation_score > 50 ? 'text-amber-600' : 'text-red-600'}`}>{editingServer.reputation_score}%</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleEditServer} className="flex flex-col min-h-0">
                  <div className="px-8 pb-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Node Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IP Address</label>
                        <input
                          type="text"
                          placeholder="1.2.3.4"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={editFormData.ip_address}
                          onChange={e => setEditFormData({ ...editFormData, ip_address: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Daily Limit</label>
                        <input
                          type="number"
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={editFormData.daily_limit}
                          onChange={e => setEditFormData({ ...editFormData, daily_limit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Status Override</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['active', 'paused', 'warming'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, status: s })}
                            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                              editFormData.status === s
                                ? s === 'active' ? 'bg-green-50 text-green-600 border-green-200'
                                : s === 'warming' ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            {s === 'warming' ? 'Warmup' : s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">New API Key <span className="normal-case text-gray-300">(leave blank to keep current)</span></label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={editFormData.api_key}
                        onChange={e => setEditFormData({ ...editFormData, api_key: e.target.value })}
                      />
                    </div>

                    {/* SMTP Override */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">SMTP Configuration</p>
                      <p className="text-[10px] font-bold text-gray-400 mb-4">Leave fields blank to keep current credentials.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Host</label>
                          <input
                            type="text"
                            placeholder="smtp.mailreef.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={editFormData.smtp_config.host}
                            onChange={e => setEditFormData({ ...editFormData, smtp_config: { ...editFormData.smtp_config, host: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Port</label>
                          <input
                            type="text"
                            placeholder="465"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={editFormData.smtp_config.port}
                            onChange={e => setEditFormData({ ...editFormData, smtp_config: { ...editFormData.smtp_config, port: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Username</label>
                          <input
                            type="text"
                            placeholder="user@domain.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={editFormData.smtp_config.username}
                            onChange={e => setEditFormData({ ...editFormData, smtp_config: { ...editFormData.smtp_config, username: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={editFormData.smtp_config.password}
                            onChange={e => setEditFormData({ ...editFormData, smtp_config: { ...editFormData.smtp_config, password: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">From Email</label>
                        <input
                          type="text"
                          placeholder="outreach@yourdomain.com"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={editFormData.smtp_config.from_email}
                          onChange={e => setEditFormData({ ...editFormData, smtp_config: { ...editFormData.smtp_config, from_email: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-8 pt-6 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      onClick={() => { setIsEditModalOpen(false); setEditingServer(null); }}
                      className="flex-1 px-6 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configuration Guide Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-8 right-8 p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all z-10 border border-transparent hover:border-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#101828]">PowerSend Setup Guide</h3>
                    <p className="text-gray-500 font-medium">How to provision your smart infrastructure</p>
                  </div>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
                  <section>
                    <h4 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 bg-[#101828] text-white text-[10px] rounded-full flex items-center justify-center">1</span>
                       Find your Mailreef Details
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 font-medium">
                      Log in to your Mailreef dashboard. Each IP or "Node" you purchase will have specific networking details required for rotation.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-[#745DF3] uppercase mb-1">IP Address / Node Identifier</p>
                        <p className="text-xs text-gray-600 font-medium font-jakarta leading-relaxed">
                          The dedicated IPv4 address or hostname assigned by Mailreef. This acts as the physical 'mailman' for your outbound traffic. No DNS configuration is required at this stage.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 bg-[#101828] text-white text-[10px] rounded-full flex items-center justify-center">2</span>
                       Authentication
                    </h4>
                    <div className="p-5 bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-2xl">
                      <p className="text-sm text-[#101828] font-bold mb-2">Getting your API Key</p>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Navigate to <b>Settings &gt; API Keys</b> in Mailreef. Generate a new key specifically for LeadFlow. This key allows our "PowerSend Engine" to talk to their servers securely.
                      </p>
                    </div>
                  </section>

                  <section className="bg-orange-50/50 p-6 rounded-[24px] border border-orange-100">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-orange-900 mb-1">Use IP Warmup</p>
                        <p className="text-xs text-orange-800/80 font-medium leading-relaxed">
                          For brand new servers, <b>always use the IP Warmup feature</b>. Click the flame icon on any node to start a 28-day warmup schedule that gradually ramps from 10 to 500+ emails/day. This builds ISP trust and prevents blacklisting.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <button
                    onClick={() => setIsHelpModalOpen(false)}
                    className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200"
                  >
                    Got it, let's build
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Start Warmup Modal */}
      <AnimatePresence>
        {isWarmupModalOpen && warmupTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsWarmupModalOpen(false); setWarmupTarget(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => { setIsWarmupModalOpen(false); setWarmupTarget(null); }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Start IP Warmup</h3>
                    <p className="text-sm text-gray-500 font-medium">Gradually build reputation for <span className="font-bold text-[#101828]">{warmupTarget.name}</span></p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                    <Flame className="w-6 h-6 text-amber-500" />
                  </div>
                </div>

                {/* How it works */}
                <div className="mb-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 mb-1">28-Day Warmup Schedule</p>
                      <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                        Starts at <b>10 emails/day</b> and gradually ramps up to your target limit over 28 days. 
                        Warmup emails are sent to our seed network to build ISP trust for your IP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Ramp-Up Preview</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {warmupSchedule.map((step, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Day {step.day}</p>
                        <p className="text-sm font-black text-[#101828]">{step.limit}</p>
                        <p className="text-[8px] text-gray-400 font-bold">emails</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Limit */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Target Daily Limit</label>
                  <p className="text-[10px] text-gray-400 font-medium mb-2 px-1">The daily limit the node will reach after warmup completes.</p>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all font-medium"
                    value={warmupTargetLimit}
                    onChange={(e) => setWarmupTargetLimit(parseInt(e.target.value) || 500)}
                  />
                </div>

                {/* Node info */}
                <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#101828]">{warmupTarget.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{warmupTarget.ip_address || warmupTarget.domain_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current</p>
                    <p className="text-sm font-bold text-gray-600">{warmupTarget.daily_limit}/day</p>
                  </div>
                </div>

                {/* Warning */}
                <div className="mb-6 p-3 bg-orange-50/60 rounded-xl border border-orange-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                    Starting warmup will set this node to <b>"Warming"</b> status and reduce its daily limit to <b>10 emails/day</b>. The node won't be used for campaign sends during warmup.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsWarmupModalOpen(false); setWarmupTarget(null); }}
                    className="flex-1 px-6 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartWarmup}
                    disabled={isWarmupSubmitting}
                    className="flex-[2] px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 flex items-center justify-center gap-2"
                  >
                    {isWarmupSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Flame className="w-4 h-4" />
                    )}
                    {isWarmupSubmitting ? 'Starting...' : 'Start Warmup'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Mailbox Modal */}
      <AnimatePresence>
        {isMailboxModalOpen && mailboxServer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsMailboxModalOpen(false); setMailboxServer(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[75vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setIsMailboxModalOpen(false); setMailboxServer(null); }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Add Mailbox</h3>
                    <p className="text-sm text-gray-500 font-medium">Add to <span className="font-bold text-[#101828]">{mailboxServer.name}</span> pool</p>
                  </div>
                  <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <Mail className="w-6 h-6" />
                  </div>
                </div>

                <form onSubmit={handleAddMailbox} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="sender@yourdomain.com"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={mailboxFormData.email}
                          onChange={e => setMailboxFormData({ ...mailboxFormData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Display Name</label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={mailboxFormData.display_name}
                          onChange={e => setMailboxFormData({ ...mailboxFormData, display_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Daily Limit</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={mailboxFormData.daily_limit}
                          onChange={e => setMailboxFormData({ ...mailboxFormData, daily_limit: parseInt(e.target.value) || 30 })}
                        />
                      </div>
                    </div>

                    {/* SMTP Override */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">SMTP Settings</p>
                      <p className="text-[10px] font-bold text-gray-400 mb-4">Leave blank to use server defaults ({mailboxServer.default_smtp_host || 'not set'}:{mailboxServer.default_smtp_port || '—'})</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Host</label>
                          <input
                            type="text"
                            placeholder={mailboxServer.default_smtp_host || 'smtp.example.com'}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.smtp_host}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, smtp_host: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Port</label>
                          <input
                            type="text"
                            placeholder={mailboxServer.default_smtp_port?.toString() || '465'}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.smtp_port}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, smtp_port: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Username</label>
                          <input
                            type="text"
                            placeholder="user@domain.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.smtp_username}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, smtp_username: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">SMTP Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.smtp_password}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, smtp_password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* IMAP Override */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">IMAP Settings</p>
                      <p className="text-[10px] font-bold text-gray-400 mb-4">For inbox monitoring / reply tracking. Leave blank for server defaults.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Host</label>
                          <input
                            type="text"
                            placeholder={mailboxServer.default_imap_host || 'imap.example.com'}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.imap_host}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, imap_host: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Port</label>
                          <input
                            type="text"
                            placeholder={mailboxServer.default_imap_port?.toString() || '993'}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.imap_port}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, imap_port: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Username</label>
                          <input
                            type="text"
                            placeholder="Same as email"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.imap_username}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, imap_username: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IMAP Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                            value={mailboxFormData.imap_password}
                            onChange={e => setMailboxFormData({ ...mailboxFormData, imap_password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsMailboxModalOpen(false); setMailboxServer(null); }}
                      className="flex-1 px-6 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Adding...' : 'Add to Pool'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {isCSVModalOpen && mailboxServer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCSVModalOpen(false); setMailboxServer(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 max-h-[75vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setIsCSVModalOpen(false); setMailboxServer(null); }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Bulk CSV Import</h3>
                    <p className="text-sm text-gray-500 font-medium">Import mailboxes to <span className="font-bold text-[#101828]">{mailboxServer.name}</span></p>
                  </div>
                  <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <Upload className="w-6 h-6" />
                  </div>
                </div>

                {/* CSV Format Guide */}
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Required CSV Format</p>
                  <div className="bg-white rounded-xl p-3 border border-gray-100 font-mono text-[11px] text-gray-600 overflow-x-auto">
                    <p className="text-[#745DF3] font-bold">email,smtp_username,smtp_password,display_name,daily_limit</p>
                    <p>john@acme.com,john@acme.com,appPass123,John Smith,30</p>
                    <p>sarah@acme.com,sarah@acme.com,appPass456,Sarah Lee,30</p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-2">
                    Optional columns: smtp_host, smtp_port, imap_host, imap_port, imap_username, imap_password. 
                    Blank SMTP/IMAP fields inherit server defaults.
                  </p>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCSVFileDrop}
                  className="mb-6 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#745DF3]/30 hover:bg-[#745DF3]/[0.02] transition-all cursor-pointer"
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv,.tsv,.txt,text/csv,text/plain,application/csv,application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleCSVFileSelect}
                  />
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                    <FileText className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-600 mb-1">Drop CSV file here or click to browse</p>
                  <p className="text-xs text-gray-400">Supports .csv files with comma-separated values</p>
                </div>

                {/* Or paste CSV text */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Or Paste CSV Content</label>
                  <textarea
                    placeholder="email,smtp_username,smtp_password&#10;john@acme.com,john@acme.com,pass123"
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-mono"
                    value={csvText}
                    onChange={(e) => handleCSVPreview(e.target.value)}
                  />
                </div>

                {/* Preview */}
                {csvPreview.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Preview ({csvPreview.length} row{csvPreview.length !== 1 ? 's' : ''} shown)</p>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase">Email</th>
                            <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase">Username</th>
                            <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase">Name</th>
                            <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase">Limit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {csvPreview.map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-1.5 text-[10px] font-medium text-gray-700">{row.email || row.email_address || '—'}</td>
                              <td className="px-3 py-1.5 text-[10px] font-mono text-gray-500">{row.smtp_username || row.username || '—'}</td>
                              <td className="px-3 py-1.5 text-[10px] text-gray-500">{row.display_name || row.name || '—'}</td>
                              <td className="px-3 py-1.5 text-[10px] text-gray-500">{row.daily_limit || '30'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {csvText.trim().split('\n').length - 1} total mailboxes will be imported
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsCSVModalOpen(false); setMailboxServer(null); }}
                    className="flex-1 px-6 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCSVUpload}
                    disabled={isImporting || !csvText.trim()}
                    className="flex-[2] px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isImporting ? 'Importing...' : 'Import Mailboxes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type as any}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[70] flex items-center gap-3 px-5 py-3.5 bg-white rounded-2xl shadow-2xl border border-gray-100"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-sm font-bold text-[#101828]">{toast.message}</p>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 p-1 text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
