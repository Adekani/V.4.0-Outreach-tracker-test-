import React, { useRef, useState } from 'react';
import { useAppStore } from '../../context/AppContext';
import { Download, Upload, RotateCcw, Target, ShieldAlert, FileClock } from 'lucide-react';
import { cn } from '../../lib/utils';
import papa from 'papaparse';

export default function SettingsTab() {
  const { data, updateDailyTarget, resetAllData, importAppData, exportAppData, importLeads } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const leadsFileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
         importAppData(ev.target?.result as string);
         alert("Data imported successfully!");
      } catch(e) {
         alert("Failed to import. Corrupted JSON.");
      }
    }
    reader.readAsText(file);
    e.target.value = '';
  }

  const handleLegacyLeadsImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const legacy = JSON.parse(ev.target?.result as string);
        // Ensure it's legacy leads: Array of objects with mostly name, phone, status
        if (Array.isArray(legacy) && legacy.length > 0 && legacy[0].hasOwnProperty('name') && legacy[0].hasOwnProperty('phone')) {
           importLeads(legacy);
           alert("Legacy leads imported!");
        } else {
           alert("Invalid legacy leads format.");
        }
      } catch(e) {
        alert("Failed to import.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="p-4 space-y-6 slide-in">
       <header className="pt-2">
         <h1 className="font-serif italic text-2xl tracking-tight text-white mb-4">System<span className="text-[#D4AF37]">Settings</span></h1>
       </header>

       <div className="bg-[#111] border border-[#262626] rounded-2xl p-6">
         <div className="flex items-center gap-2 text-[#666] text-[10px] uppercase tracking-widest mb-4">
           <Target size={14} className="text-[#D4AF37]"/> Outreach Goal
         </div>
         <div>
           <label className="text-sm font-medium text-[#E5E5E5] block mb-3">Daily Outreach Target</label>
           <div className="flex">
             <button onClick={()=>updateDailyTarget(Math.max(1, data.settings.dailyTarget - 1))} className="w-14 h-14 bg-[#1A1A1A] border border-[#262626] rounded-l-xl text-2xl text-[#999] active:bg-[#222] transition-colors">-</button>
             <div className="flex-1 bg-[#1A1A1A] border-y border-[#262626] flex items-center justify-center font-serif text-3xl text-white">{data.settings.dailyTarget}</div>
             <button onClick={()=>updateDailyTarget(Math.max(500, data.settings.dailyTarget + 1))} className="w-14 h-14 bg-[#1A1A1A] border border-[#262626] rounded-r-xl text-2xl text-[#999] active:bg-[#222] transition-colors">+</button>
           </div>
         </div>
       </div>

       <div className="bg-[#111] border border-[#262626] rounded-2xl p-6">
         <div className="flex items-center gap-2 text-[#666] text-[10px] uppercase tracking-widest mb-4">
           <FileClock size={14} className="text-[#D4AF37]"/> Data Management
         </div>
         <p className="text-[11px] text-[#999] mb-4 leading-relaxed">Export your entire unified toolkit data (Tracker + Leads + Demos history) as JSON for safe keeping.</p>
         <div className="flex gap-3">
           <button onClick={exportAppData} className="flex-1 flex justify-center items-center gap-2 bg-[#1A1A1A] border border-[#262626] text-[#E5E5E5] py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform"><Download size={14}/> Export</button>
           <button onClick={()=>fileRef.current?.click()} className="flex-1 flex justify-center items-center gap-2 bg-white text-black py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform"><Upload size={14}/> Import</button>
           <input type="file" ref={fileRef} accept=".json" className="hidden" onChange={handleImport} />
         </div>
         
         <div className="pt-6 mt-6 border-t border-[#262626]">
           <p className="text-[11px] text-[#999] mb-4 leading-relaxed">Migrating from the standalone Lead Launcher? Upload your legacy array of leads JSON here.</p>
           <button onClick={()=>leadsFileRef.current?.click()} className="w-full flex justify-center items-center gap-2 bg-[#1A1A1A] border border-[#262626] py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#999] hover:text-white active:scale-95 transition-transform"><Upload size={14}/> Import Legacy Leads</button>
           <input type="file" ref={leadsFileRef} accept=".json" className="hidden" onChange={handleLegacyLeadsImport} />
         </div>
       </div>

       <div className="bg-[#111] border border-[#262626] rounded-2xl p-6">
         <div className="flex items-center gap-2 text-red-500 text-[10px] uppercase tracking-widest mb-4">
           <ShieldAlert size={14}/> Danger Zone
         </div>
         <p className="text-[11px] text-red-400 opacity-80 mb-4 leading-relaxed">This will permanently delete all your sessions, leads, settings, and streak. It cannot be undone.</p>
         <button onClick={()=>{
           if(window.confirm('WARNING: Erase all data permanently? Are you absolutely sure?')) {
             if(window.prompt('Type DELETE to confirm') === 'DELETE') resetAllData();
           }
         }} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform hover:bg-red-500/20 hover:border-red-500/30">
           Erase Everything
         </button>
       </div>

    </div>
  )
}
