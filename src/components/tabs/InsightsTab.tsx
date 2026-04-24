import React, { useState } from 'react';
import { useAppStore } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Paperclip, Handshake, Eye, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDuration } from '../../lib/utils';

export default function InsightsTab() {
  const { data } = useAppStore();
  const [period, setPeriod] = useState<7|30|90|'all'>(7);

  const getFilteredSessions = () => {
    const all = data.sessions.filter(s => s.dataLogged);
    if (period === 'all') return all;
    const days = typeof period === 'number' ? period : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0,0,0,0);
    return all.filter(s => new Date(s.date + 'T12:00:00') >= cutoff);
  }

  const sessions = getFilteredSessions();

  const tOut = sessions.reduce((a, s) => a + s.outreaches, 0);
  const tCloses = sessions.reduce((a, s) => a + s.closes, 0);
  const tDemos = sessions.reduce((a, s) => a + s.demoRequests, 0);

  const demoRate = tOut > 0 ? ((tDemos / tOut) * 100).toFixed(1) : '0.0';
  const closeRate = tOut > 0 ? ((tCloses / tOut) * 100).toFixed(2) : '0.00';

  // Format array for Chart
  let chartData: any[] = [];
  if (period !== 'all') {
    let days = typeof period === 'number' ? period : 7;
    const map = new Map<string, any>();
    sessions.forEach(s => {
      if(!map.has(s.date)) map.set(s.date, { date: s.date, outreaches: 0, closes: 0, demos: 0 });
      const m = map.get(s.date);
      m.outreaches += s.outreaches;
      m.closes += s.closes;
      m.demos += s.demoRequests;
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    for(let i=0; i<days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = map.get(dateStr);
        chartData.push({
            date: dateStr,
            label,
            Outreaches: existing?.outreaches || 0,
            Demos: existing?.demos || 0,
            Closes: existing?.closes || 0
        });
    }
  } else {
      // Just map sessions by date
  }

  const customTooltip = {
    backgroundColor: '#111', border: '1px solid #262626', borderRadius: '8px', color: '#E5E5E5', padding: '12px'
  };

  return (
    <div className="p-4 space-y-6 slide-in">
      <header className="pt-2 mb-2">
         <h1 className="font-serif italic text-2xl tracking-tight text-white mb-4">Insights<span className="text-[#D4AF37]">Panel</span></h1>
      </header>

      {/* Period toggle */}
      <div className="flex bg-[#1A1A1A] border border-[#262626] rounded-lg p-1">
        {[7,30,90,'all'].map(p => (
           <button key={p} onClick={()=>setPeriod(p as any)} className={cn("flex-1 py-2 text-xs font-semibold rounded-lg transition-colors border", period === p ? "bg-[#222] text-[#D4AF37] border-[#262626]" : "border-transparent text-[#666] hover:text-white")}>
             {p === 'all' ? 'All' : `${p}D`}
           </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 text-center shadow-sm">
          <Paperclip size={18} className="text-[#D4AF37] opacity-60 mx-auto mb-2"/>
          <div className="text-[10px] uppercase tracking-widest text-[#666]">Total Outreaches</div>
          <div className="font-serif text-3xl text-white mt-1 leading-none">{tOut}</div>
        </div>
        <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 text-center shadow-sm">
          <Handshake size={18} className="text-[#D4AF37] opacity-60 mx-auto mb-2"/>
          <div className="text-[10px] uppercase tracking-widest text-[#666]">Total Closes</div>
          <div className="font-serif text-3xl text-white mt-1 leading-none">{tCloses}</div>
        </div>
        <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 text-center shadow-sm">
          <Eye size={18} className="text-[#D4AF37] opacity-60 mx-auto mb-2"/>
          <div className="text-[10px] uppercase tracking-widest text-[#666]">Demo Req Rate</div>
          <div className="font-serif text-3xl text-white mt-1 leading-none">{demoRate}%</div>
        </div>
        <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 text-center shadow-sm">
          <TrendingUp size={18} className="text-[#D4AF37] opacity-60 mx-auto mb-2"/>
          <div className="text-[10px] uppercase tracking-widest text-[#666]">Close Rate</div>
          <div className="font-serif text-3xl text-white mt-1 leading-none">{closeRate}%</div>
        </div>
      </div>
      
      {/* Chart: Volume */}
      {period !== 'all' && chartData.length > 0 && (
          <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 pt-6 pb-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-4">Volume Trend</h3>
            <div className="h-[180px] w-[100%] ml-[-12px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltip} itemStyle={{color:'#D4AF37'}} />
                    <Line type="monotone" dataKey="Outreaches" stroke="#D4AF37" strokeWidth={3} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      )}

      {/* Chart: Outcomes */}
      {period !== 'all' && chartData.length > 0 && (
          <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 pt-6 pb-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-4">Outcomes</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false}/>
                    <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#1A1A1A'}} contentStyle={customTooltip} />
                    <Bar dataKey="Demos" fill="#D4AF37" radius={[4,4,0,0]} />
                    <Bar dataKey="Closes" fill="#22C55E" radius={[4,4,0,0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      )}

    </div>
  );
}
