'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  MousePointer2, 
  Mail, 
  MessageSquare, 
  Search,
  ChevronDown,
  RefreshCw,
  Loader2,
  Users
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const days = timeRange === 'Last 7 Days' ? '7' : timeRange === 'Last 30 Days' ? '30' : '90';
        const res = await fetch(`/api/analytics?timeRange=${days}`);
        const data = await res.json();
        
        if (data.stats) setStats(data.stats);
        if (data.topCampaigns) setCampaignData(data.topCampaigns);
        if (data.dailyActivity) setDailyActivity(data.dailyActivity);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Metric,Value,Change\n";
      stats.forEach(s => {
        csvContent += `${s.name},${s.value.replace(/,/g, '')},${s.change}\n`;
      });
      
      csvContent += "\nTop Campaigns,Open Rate,Volume,Replies\n";
      campaignData.forEach(c => {
        csvContent += `${c.name},${c.rate},${c.volume.replace(/,/g, '')},${c.replies.replace(/,/g, '')}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const filteredCampaigns = campaignData?.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatIcon = (name: string) => {
    if (name.includes('Sent')) return Mail;
    if (name.includes('Open')) return MousePointer2;
    if (name.includes('Replies')) return MessageSquare;
    return TrendingUp;
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <SubscriptionGuard>
            <div className="max-w-[1400px] mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-black text-[#101828] tracking-tight"
                >
                  Analytics
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-500 font-medium mt-1"
                >
                  Deep dive into your outbound performance and campaign ROI.
                </motion.p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="appearance-none flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm cursor-pointer outline-none pr-10"
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#101828]/10 hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Exporting...' : 'Export Results'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                <Loader2 className="w-12 h-12 text-[#745DF3] animate-spin mb-4" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Crunching your data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => {
                    const Icon = getStatIcon(stat.name);
                    return (
                      <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#101828]/5 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-[#745DF3] group-hover:text-white transition-all text-[#101828]">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${stat.trend === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                            {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {stat.change}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.name}</p>
                          <h3 className="text-2xl font-black text-[#101828] mt-1">{stat.value}</h3>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-[#101828]">Activity Overview</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Growth & Engagement Trends</p>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
                      {dailyActivity.length === 0 ? (
                        <div className="text-center relative z-10 px-8">
                          <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-4 group-hover:text-[#745DF3] group-hover:scale-110 transition-all duration-500" />
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Growth Engine Active</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-2">Historical chart data is aggregating for the {timeRange} period.</p>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-end justify-center gap-2 px-6 pb-2">
                          {dailyActivity.map((day, i) => {
                            const maxSent = Math.max(...dailyActivity.map(d => d.sent), 1);
                            const height = (day.sent / maxSent) * 100;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center group/bar relative">
                                <div 
                                  className="absolute bottom-full mb-2 bg-[#101828] text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20"
                                >
                                  {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: {day.sent} sent
                                </div>
                                <div 
                                  style={{ height: `${Math.max(height, 5)}%` }} 
                                  className="w-full bg-[#745DF3]/20 hover:bg-[#745DF3] transition-all duration-500 rounded-t-lg relative"
                                >
                                  {day.open > 0 && (
                                    <div 
                                      style={{ height: `${(day.open / day.sent) * 100}%` }} 
                                      className="absolute bottom-0 left-0 w-full bg-[#745DF3] rounded-t-lg"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-[#101828]">Top Performers</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                           type="text"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Filter..."
                           className="pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none w-32 focus:ring-1 focus:ring-[#745DF3]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {filteredCampaigns.length === 0 ? (
                        <div className="text-center py-10">
                          <Users className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                          <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No active data</p>
                        </div>
                      ) : (
                        filteredCampaigns.map((campaign, i) => (
                          <div key={campaign.id} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-[#101828] group-hover:text-[#745DF3] transition-all truncate max-w-[150px]">
                                {campaign.name}
                              </span>
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                                {campaign.rate}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: campaign.rate }}
                                transition={{ delay: 0.6 + (i * 0.1), duration: 1 }}
                                className="h-full bg-[#745DF3] group-hover:bg-[#101828] transition-all"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{campaign.volume} sent</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{campaign.replies} replies</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              </>
            )}
            </div>
          </SubscriptionGuard>
        </div>
      </main>
    </div>
  );
}
