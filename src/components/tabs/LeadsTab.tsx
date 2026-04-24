import React, { useState } from 'react';
import { useAppStore } from '../../context/AppContext';
import papa from 'papaparse';
import { formatPhone } from '../../lib/utils';
import { FileUp, MessageSquareShare, Ban, MessageSquareOff, Trash2, ArrowLeftRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LeadsTab() {
  const { data, markLeadSent, markLeadSkipped, markLeadInvalid, importLeads, clearLeads, resetLeadProgress } = useAppStore();
  const [activeSub, setActiveSub] = useState<'pending'|'sent'|'invalid'>('pending');
  const [search, setSearch] = useState('');
  
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string,string>[];
        // Validate columns
        if (rows.length === 0) return alert('Empty CSV');
        const keys = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
        if (!keys.includes('name') || !keys.includes('phone')) return alert('CSV must have "name" and "phone" columns');
        
        const mapped = rows.map((r, i) => {
          const rn: Record<string,string> = {};
          Object.keys(r).forEach(k => rn[k.toLowerCase().trim()] = r[k]);
          return {
            id: `lead_${Date.now()}_${i}`,
            name: (rn.name || '').trim(),
            phone: formatPhone(rn.phone || ''),
            status: 'pending' as const
          };
        }).filter(r => r.name && r.phone);
        
        if (data.leads.length > 0) {
          if (window.confirm(`Replace ${data.leads.length} existing leads with ${mapped.length} new leads?`)) {
            importLeads(mapped);
          }
        } else {
          importLeads(mapped);
        }
      }
    });
  };

  const getFiltered = (statusArray: string[]) => data.leads.filter(l => statusArray.includes(l.status) && l.name.toLowerCase().includes(search.toLowerCase()));

  const pending = getFiltered(['pending']);
  const sent = getFiltered(['sent']);
  const invalid = getFiltered(['invalid', 'skipped']);

  const pendingC = data.leads.filter(l => l.status === 'pending').length;
  const sentC = data.leads.filter(l => l.status === 'sent').length;
  const skippedC = data.leads.filter(l => l.status === 'skipped').length;
  const invalidC = data.leads.filter(l => l.status === 'invalid').length;

  const openWA = (leadId: string, phone: string, name: string) => {
    // Determine greeting
    const h = new Date().getHours();
    const gr = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const msg = `${gr} ${name},\n\nQuick one — and feel free to ignore if this isn't relevant.\n\nI recently came across your Google Business profile. Strong presence you have there.\n\nOne thing though: I did not see a website linked. For many customers, that's the moment they hesitate.\n\nI built a demo website to show how a professional website for your business could look like.\n\nWant me to send it through?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    markLeadSent(leadId);
  }

  const SubBtn = ({ id, label }: { id: string, label: string }) => (
    <button onClick={() => setActiveSub(id as any)} className={cn(
      "flex-1 text-center py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors",
      activeSub === id ? "border-white text-white" : "border-transparent text-[#666] hover:text-[#999]"
    )}>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] slide-in">
       {/* Subtabs fixed */}
       <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-20 px-4">
         <div className="flex gap-2 border-b border-[#262626]">
           <SubBtn id="pending" label="Pending" />
           <SubBtn id="sent" label="Sent" />
           <SubBtn id="invalid" label="Invalid" />
         </div>
         {/* Progress row */}
         <div className="flex justify-between items-center py-3 text-[10px] text-[#666] uppercase tracking-[0.2em] font-medium">
           <span><b className="text-white">{pendingC}</b> pending</span>•
           <span><b className="text-white">{sentC}</b> sent</span>•
           <span><b className="text-white">{skippedC}</b> skipped</span>•
           <span><b className="text-white">{invalidC}</b> invalid</span>
         </div>
       </div>

       <div className="p-4 space-y-4">
         {/* Upload Card */}
         {data.leads.length === 0 && (
           <label className="border-2 border-dashed border-[#262626] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#111] hover:border-[#666] transition-colors">
             <FileUp size={40} className="text-white mb-3" />
             <div className="font-medium tracking-tight text-sm mb-1 text-white">Tap to upload CSV</div>
             <div className="text-[10px] uppercase tracking-widest text-[#666]">Must contain "name" and "phone"</div>
             <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
           </label>
         )}
         
         {(data.leads.length > 0 && activeSub === 'pending') && (
           <div className="flex justify-end gap-3 mb-2">
             <button onClick={resetLeadProgress} className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border border-[#262626] text-[#999] hover:text-white flex items-center gap-1.5"><ArrowLeftRight size={12}/> Reset</button>
             <button onClick={() => { if(window.confirm('Clear all leads?')) clearLeads(); }} className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border border-[#262626] text-red-500 hover:text-red-400 flex items-center gap-1.5"><Trash2 size={12}/> Clear</button>
           </div>
         )}
         
         {data.leads.length > 0 && (
           <input type="text" placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)} 
             className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-4 py-3 text-sm focus:border-[#666] focus:outline-none text-[#E5E5E5] placeholder:text-[#666] mb-2" />
         )}

         {/* Lists */}
         <div className="space-y-3">
           {activeSub === 'pending' && pending.map(l => (
             <div key={l.id} className="bg-[#111] border border-[#262626] rounded-2xl p-5">
               <div className="font-medium tracking-tight text-[15px] mb-4 text-[#E5E5E5]">{l.name}</div>
               <div className="flex gap-2">
                 <button onClick={() => openWA(l.id, l.phone, l.name)} className="flex-1 bg-white text-black rounded-lg py-3 text-[10px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 active:scale-95 transition-transform"><MessageSquareShare size={14}/> Launch WhatsApp</button>
                 <button onClick={() => markLeadSkipped(l.id)} className="bg-[#1A1A1A] text-[#999] rounded-lg px-5 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform">Skip</button>
               </div>
             </div>
           ))}
           {activeSub === 'sent' && sent.map(l => (
             <div key={l.id} className="bg-[#111] border border-[#262626] rounded-2xl p-5 flex justify-between items-center">
               <div className="font-medium tracking-tight text-[14px] text-[#E5E5E5]">{l.name}</div>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#1A1A1A] text-green-500">Sent</span>
                 <button onClick={() => markLeadInvalid(l.id)} className="text-[#666] hover:text-red-500 p-2 rounded-lg transition-colors" title="Mark Invalid"><Ban size={16}/></button>
               </div>
             </div>
           ))}
           {activeSub === 'invalid' && invalid.map(l => (
             <div key={l.id} className="bg-[#111] border border-[#262626] rounded-2xl p-5 flex justify-between items-center opacity-70">
               <div className="font-medium tracking-tight text-[14px] text-[#999]">{l.name}</div>
               <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#1A1A1A] text-[#666]">{l.status}</span>
             </div>
           ))}
           
           {(search && [pending,sent,invalid][activeSub==='pending'?0:activeSub==='sent'?1:2].length === 0) && (
             <div className="text-center text-[#666] py-8 text-sm">No leads match your search.</div>
           )}
         </div>

       </div>
    </div>
  )
}
