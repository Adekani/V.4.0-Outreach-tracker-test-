import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../context/AppContext';
import { todayStr, secondsUntil9PM, toHHMMSS, formatDuration } from '../../lib/utils';
import { Flame, Play, StopCircle, TriangleAlert, Save, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function HomeTab() {
  const { data, activeSession, startSession, stopSession, saveLogData } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const int = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(int);
  }, []);

  const todaySessions = data.sessions.filter(s => s.date === todayStr() && s.dataLogged);
  const tOut = todaySessions.reduce((a, c) => a + c.outreaches, 0);
  const tDemos = todaySessions.reduce((a, c) => a + c.demoRequests, 0);
  const tCloses = todaySessions.reduce((a, c) => a + c.closes, 0);
  const tDuration = todaySessions.reduce((a, c) => a + (c.isMisc ? 0 : (c.duration || 0)), 0);

  const pct = Math.min((tOut / data.settings.dailyTarget) * 100, 100) || 0;
  
  const secsLeft = secondsUntil9PM();
  const inWindow = secsLeft > 0;
  
  const allTimeOuts = data.sessions.filter(s => s.dataLogged).reduce((a, c) => a + c.outreaches, 0);
  
  // Calculate 7-day Avg
  let avg7 = 0;
  let bestDay = { date: '', count: 0 };
  const byDate: Record<string, number> = {};
  data.sessions.filter(s => s.dataLogged).forEach(s => {
    byDate[s.date] = (byDate[s.date] || 0) + s.outreaches;
  });
  
  Object.entries(byDate).forEach(([date, count]) => {
    if (count > bestDay.count) bestDay = { date, count };
  });

  const last7Days = [];
  for (let i=0; i<7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0,10));
  }
  avg7 = Math.round(last7Days.reduce((a, d) => a + (byDate[d] || 0), 0) / 7) || 0;

  // At risk logic
  const dObj = new Date();
  dObj.setDate(dObj.getDate() - 1);
  const yesterday = dObj.toISOString().slice(0, 10);
  const isAtRisk = data.streak.lastActiveDate === yesterday && tOut === 0 && now.getHours() >= 20;

  const pendingSessions = data.sessions.filter(s => s.status === 'pending' || s.status === 'auto-closed');

  return (
    <div className="p-4 space-y-6 slide-in">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#0A0A0A]/90 backdrop-blur top-0 sticky z-10 -mx-4 px-4 py-3 border-b border-[#262626]">
        <div>
          <h1 className="font-serif italic text-2xl tracking-tight text-white">Outreach<span className="text-[#D4AF37]">Hub</span></h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#666] mt-1">Unified Control System</p>
        </div>
        <div className="bg-[#111] px-3 py-1.5 rounded-lg border border-[#262626] flex items-center justify-between cursor-pointer space-x-2">
           <span className="text-[10px] text-white tracking-widest">{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* Main Interface */}
      {/* Streak Hero Card */}
      <div className={cn(
        "relative rounded-2xl p-6 border transition-colors bg-[#111]",
        isAtRisk ? "border-[#C0392B]/50" : "border-[#262626]"
      )}>
        <div className="flex items-center gap-5 relative z-10">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Current Day Streak</div>
            <div className="font-serif text-5xl leading-none text-white">{data.streak.current}</div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {data.streak.current > 0 && !isAtRisk && (
              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded border border-[#262626] text-white">Active</span>
            )}
            {isAtRisk && (
              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded border border-[#E74C3C]/50 text-[#E74C3C] flex items-center gap-1.5"><TriangleAlert size={12}/> At Risk</span>
            )}
          </div>
        </div>
      </div>

      {/* Countdown Card */}
      <div className="bg-[#111] border border-[#262626] rounded-2xl p-5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#666]">Outreach window closes</span>
        <span className={cn("font-serif text-xl tracking-tight", inWindow ? "text-white" : "text-[#666]")}>
          {inWindow ? toHHMMSS(secsLeft) : "Closed"}
        </span>
      </div>

      {activeSession && (
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10 flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></div>
             <div>
               <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Session Running</div>
               <div className="font-serif text-2xl text-white">{toHHMMSS(Math.floor((now.getTime() - new Date(activeSession.startTime!).getTime()) / 1000))}</div>
             </div>
           </div>
           <button onClick={() => stopSession(activeSession.id)} className="relative z-10 bg-[#111] border border-[#262626] text-[#E5E5E5] px-4 py-2 rounded-lg text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform"><StopCircle size={14} /> Stop</button>
        </div>
      )}

      {/* Pending Sessions Queue */}
      {pendingSessions.length > 0 && (
         <div className="bg-[#111] border border-[#262626] rounded-2xl p-5">
           <h2 className="text-[10px] uppercase tracking-widest text-[#666] mb-4 flex items-center gap-2"><Clock size={12} /> Pending Sessions ({pendingSessions.length})</h2>
           <div className="space-y-2">
             {pendingSessions.map(s => (
               <div key={s.id} className="bg-[#1A1A1A] border border-[#262626] rounded-lg p-3 flex justify-between items-center">
                 <div>
                   <div className="text-sm text-white">{formatDuration(s.duration)} <span className="text-[#666] text-xs">({s.outreaches} logged automatically)</span></div>
                   <div className="text-[10px] text-[#999] uppercase tracking-widest mt-1">{new Date(s.startTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                 </div>
                 <button onClick={() => saveLogData(s.id, {})} className="bg-white text-black px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold flex gap-1.5 items-center"><Save size={14}/> Complete</button>
               </div>
             ))}
           </div>
         </div>
      )}

      {/* Today */}
      <div className="bg-[#111] border border-[#262626] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#262626] flex justify-between items-center bg-[#151515]">
          <h2 className="text-sm font-medium tracking-tight text-white">Today's Pipeline</h2>
          <span className="text-[10px] tracking-widest uppercase bg-[#222] px-2 py-1 rounded text-[#999]">{tOut} / {data.settings.dailyTarget}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-0.5 bg-[#262626] w-full">
          <div className="h-full bg-[#D4AF37] transition-all duration-700 ease-out" style={{ width: `${pct}%` }}></div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-[#262626]">
          {[{v:tOut, l:'Outreaches'}, {v:tDuration ? formatDuration(tDuration) : '—', l:'Time'}, {v:tDemos, l:'Demos'}, {v:tCloses, l:'Closes'}].map((m, i) => (
             <div key={i} className="p-4 text-center">
               <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">{m.l}</div>
               <div className="font-serif text-2xl text-white">{m.v}</div>
             </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-[#666] mb-3">Quick Metrics</h2>
        <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar">
          <div className="shrink-0 w-36 bg-[#111] border border-[#262626] rounded-2xl p-5 border-l-4 border-l-[#D4AF37]">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">7-Day Avg</div>
            <div className="font-serif text-3xl text-white">{avg7}</div>
          </div>
          <div className="shrink-0 w-40 bg-[#111] border border-[#262626] rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Best Day</div>
            <div className="font-serif text-3xl text-white">{bestDay.count}</div>
            <div className="text-[10px] text-[#999] mt-1">{bestDay.date ? bestDay.date : '—'}</div>
          </div>
          <div className="shrink-0 w-36 bg-[#111] border border-[#262626] rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">All-Time</div>
            <div className="font-serif text-3xl text-[#D4AF37]">{allTimeOuts}</div>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="pt-2">
        <button 
          onClick={startSession}
          disabled={!inWindow || !!activeSession}
          className="w-full h-14 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {!!activeSession ? "Session Running" : <><Play fill="currentColor" size={14}/> {inWindow ? "Launch Outreach" : "Window Closed"}</>}
        </button>
      </div>
      
    </div>
  );
}
