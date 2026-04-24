import React, { useState } from 'react';
import { useAppStore } from '../../context/AppContext';
import { DEMO_TEMPLATES } from '../../data/demo_templates';
import { Wand2, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function DemosTab() {
  const { data, generateDemoLink, deleteDemo } = useAppStore();
  const [bName, setBName] = useState('');
  const [category, setCategory] = useState('');
  
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !category) return;
    generateDemoLink(bName, category);
    setBName('');
    alert('Demo Magic Link created! Copied to clipboard? (Use the copy button below!)');
  }

  const copyRef = (txt: string) => {
    navigator.clipboard.writeText(txt);
    alert("Copied to clipboard!");
  }

  return (
    <div className="p-4 space-y-6 slide-in">
       <header className="pt-2">
         <h1 className="font-serif italic text-2xl tracking-tight text-white flex items-center gap-2"><Wand2 size={24} className="text-[#D4AF37]"/> Demo<span className="text-[#D4AF37]">Vault</span></h1>
       </header>

       {/* Form */}
       <div className="bg-[#111] border border-[#262626] rounded-2xl p-6">
         <h2 className="text-sm font-medium tracking-tight mb-4 text-[#E5E5E5]">Demo Generator</h2>
         <form onSubmit={onSubmit} className="space-y-4">
           <div>
             <label className="block text-[10px] uppercase text-[#666] mb-1.5">Personalized Value</label>
             <input type="text" required value={bName} onChange={e=>setBName(e.target.value)} placeholder="Enter Lead Name..." 
               className="w-full bg-[#1A1A1A] border border-[#262626] p-3 rounded-lg text-sm text-[#E5E5E5] outline-none placeholder-[#666]" />
           </div>
           <div>
             <label className="block text-[10px] uppercase text-[#666] mb-1.5">Select Template</label>
             <select required value={category} onChange={e=>setCategory(e.target.value)} 
               className="w-full bg-[#1A1A1A] border border-[#262626] p-3 rounded-lg text-sm text-[#E5E5E5] outline-none appearance-none" style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e')", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", backgroundSize: "16px" }}>
               <option value="" disabled>Select template...</option>
               {DEMO_TEMPLATES.map(t => <option key={t.id} value={t.path}>{t.name}</option>)}
             </select>
           </div>
           <button type="submit" className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-transform active:scale-95 flex justify-center items-center gap-2 mt-2">
             <Wand2 size={16} /> Generate & Record Demo
           </button>
         </form>
       </div>

       {/* List generated */}
       <div>
         <h3 className="text-[10px] uppercase text-[#666] mb-4">Developer: How to add more / Recent Links</h3>
         {data.demos.length === 0 ? (
           <div className="bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#999] p-4 text-[11px] leading-relaxed flex flex-col items-center justify-center py-10 opacity-70">
             <Wand2 size={32} className="mb-3 opacity-50" />
             <p className="text-center font-medium">No demos generated yet.<br/>Create one above!</p>
           </div>
         ) : (
           <div className="space-y-4">
             {data.demos.map(d => (
               <div key={d.id} className="bg-[#111] border border-[#262626] rounded-2xl p-5">
                 <div className="flex justify-between items-start mb-3">
                   <div>
                     <div className="font-medium tracking-tight text-[15px] mb-1">{d.businessName}</div>
                     <div className="text-[10px] uppercase tracking-widest text-[#666]">{formatDate(d.createdAt)}</div>
                   </div>
                   <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#1A1A1A] text-[#D4AF37]">
                     {DEMO_TEMPLATES.find(t=>t.path===d.category)?.name || d.category}
                   </span>
                 </div>
                 
                 <div className="p-3 bg-[#0A0A0A] rounded-lg text-xs font-mono text-[#999] break-all border border-[#262626] mb-3 leading-relaxed">
                   {d.url}
                 </div>
                 
                 <div className="flex gap-2">
                   <button onClick={() => copyRef(d.url)} className="flex-1 bg-white text-black rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 active:scale-95 transition-transform"><Copy size={14}/> Copy Link</button>
                   <button onClick={() => window.open(d.url, '_blank')} className="bg-[#1A1A1A] text-[#E5E5E5] rounded-lg px-4 py-2.5 active:scale-95 transition-transform"><ExternalLink size={14}/></button>
                   <button onClick={() => { if(window.confirm('Delete?')) deleteDemo(d.id); }} className="bg-[#1A1A1A] text-red-500 rounded-lg px-4 py-2.5 active:scale-95 transition-transform"><Trash2 size={14}/></button>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
    </div>
  )
}
