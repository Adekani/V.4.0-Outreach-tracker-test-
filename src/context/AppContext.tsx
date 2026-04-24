import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppData, Session, Lead, DemoLink } from "../types";
import { todayStr, uuid } from "../lib/utils";

const STORAGE_KEY = "outreach_tracker_data";
const APP_VERSION = "2.0";

export const DEFAULT_DATA = (): AppData => ({
  meta: { version: APP_VERSION, created: new Date().toISOString(), dailyTarget: 25 },
  sessions: [],
  leads: [],
  demos: [],
  streak: {
    current: 0, longest: 0, lastActiveDate: null,
    freezeTokens: 0, freezeUsedThisWeek: false,
  },
  rewards: { animationsTriggered: [], milestoneStreaksHit: [], milestoneVolumeHit: [] },
  settings: { dailyTarget: 25, notificationsEnabled: false, reminderTime: "20:00" },
  backup: { lastBackupDate: null, promptShown: false }
});

interface AppContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  
  // Helpers
  activeSession: Session | undefined;
  startSession: () => void;
  stopSession: (id: string) => void;
  autoCloseSession: (id: string) => void;
  saveLogData: (sessionId: string, data: Partial<Session>) => void;
  quickAddMiscSession: (outreaches: number, demos: number, closes: number, nos: number) => void;
  
  // Lead Launcher helpers
  markLeadSent: (leadId: string) => void;
  markLeadSkipped: (leadId: string) => void;
  markLeadInvalid: (leadId: string) => void;
  importLeads: (leadsData: Lead[]) => void;
  clearLeads: () => void;
  resetLeadProgress: () => void;
  
  // Demo Generator helpers
  generateDemoLink: (businessName: string, category: string) => void;
  deleteDemo: (demoId: string) => void;
  
  // Main Settings
  updateDailyTarget: (target: number) => void;
  resetAllData: () => void;
  importAppData: (jsonString: string) => void;
  exportAppData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_DATA();
      const parsed = JSON.parse(raw);
      const def = DEFAULT_DATA();
      // Migration logic from old vanilla to React unify
      return {
        meta: { ...def.meta, ...parsed.meta },
        sessions: parsed.sessions || [],
        leads: parsed.leads || [], // Pull leads if they existed, else empty
        demos: parsed.demos || [],
        streak: { ...def.streak, ...parsed.streak },
        rewards: { ...def.rewards, ...parsed.rewards },
        settings: { ...def.settings, ...parsed.settings },
        backup: { ...def.backup, ...(parsed.backup || {}) }
      };
    } catch {
      return DEFAULT_DATA();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Derive active session
  const activeSession = data.sessions.find(s => s.status === "running");

  // Provide unified helper to refresh streak, mimicking legacy logical refresh
  const recalcStreak = (newData: AppData) => {
    const byDate: Record<string, boolean> = {};
    newData.sessions.filter(s => s.dataLogged && s.outreaches > 0).forEach(s => {
      byDate[s.date] = true;
    });
    const activeDates = Object.keys(byDate).sort().reverse();
    
    if (!activeDates.length) {
      newData.streak.current = 0;
      newData.streak.lastActiveDate = null;
      return newData;
    }
    
    const today = todayStr();
    const dObj = new Date();
    dObj.setDate(dObj.getDate() - 1);
    const yesterday = dObj.toISOString().slice(0, 10);
    
    const lastActive = activeDates[0];
    let streakCurrent = 0;
    
    if (lastActive === today || lastActive === yesterday) {
      let d = new Date(lastActive + 'T12:00:00');
      while (byDate[d.toISOString().slice(0, 10)]) {
        streakCurrent++;
        d.setDate(d.getDate() - 1);
      }
      newData.streak.current = streakCurrent;
      newData.streak.lastActiveDate = lastActive;
      if (streakCurrent > newData.streak.longest) newData.streak.longest = streakCurrent;
    } else {
      newData.streak.current = 0;
      newData.streak.lastActiveDate = lastActive;
      newData.streak.freezeUsedThisWeek = false;
    }
    return newData;
  };

  const syncUpdate = (recipe: (draft: AppData) => void) => {
    setData((prev) => {
      // Use simple deep clone
      let copy = JSON.parse(JSON.stringify(prev));
      recipe(copy);
      copy = recalcStreak(copy);
      return copy;
    });
  };

  // --- Session Helpers ---
  const startSession = () => {
    if (activeSession) return;
    syncUpdate(d => {
      d.sessions.push({
        id: uuid(),
        date: todayStr(),
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
        status: "running",
        isSessionless: false,
        isMisc: false,
        outreaches: 0, nos: 0, demoRequests: 0, followUpsSent: 0, followUpResponses: 0, continuedConversations: 0, closes: 0, notes: "", dataLogged: false
      });
    });
  };

  const stopSession = (id: string) => {
    syncUpdate(d => {
      const s = d.sessions.find(x => x.id === id);
      if (s) {
        s.endTime = new Date().toISOString();
        s.duration = Math.floor((new Date().getTime() - new Date(s.startTime!).getTime()) / 1000);
        s.status = "pending";
      }
    });
  };

  const autoCloseSession = (id: string) => {
    syncUpdate(d => {
      const s = d.sessions.find(x => x.id === id);
      if (s) {
        const ninepm = new Date();
        ninepm.setHours(21, 0, 0, 0);
        s.endTime = ninepm.toISOString();
        s.duration = Math.floor((ninepm.getTime() - new Date(s.startTime!).getTime()) / 1000);
        s.status = "auto-closed";
      }
    });
  };

  const saveLogData = (sessionId: string, updates: Partial<Session>) => {
    syncUpdate(d => {
      const s = d.sessions.find(x => x.id === sessionId);
      if (s) {
        Object.assign(s, updates);
        s.status = "complete";
        s.dataLogged = true;
      }
    });
  };

  const quickAddMiscSession = (outreaches: number, demoRequests: number, closes: number, nos: number) => {
    syncUpdate(d => {
      d.sessions.push({
        id: uuid(), date: todayStr(), startTime: null, endTime: null, duration: null, status: "complete", isSessionless: true, isMisc: true, dataLogged: true,
        outreaches, demoRequests, closes, nos, followUpsSent: 0, followUpResponses: 0, continuedConversations: 0, notes: ""
      });
    });
  };

  // --- Lead Launcher Helpers ---
  const autoLogOutreach = (draft: AppData, leadsSentCount: number = 1) => {
    const running = draft.sessions.find(s => s.status === "running");
    if (running) {
      running.outreaches += leadsSentCount;
    } else {
      // Create a daily rolling misc session or update existing today misc session
      let todayMisc = draft.sessions.find(s => s.date === todayStr() && s.isMisc);
      if (todayMisc) {
        todayMisc.outreaches += leadsSentCount;
      } else {
        draft.sessions.push({
          id: uuid(), date: todayStr(), startTime: null, endTime: null, duration: null, status: "complete", isSessionless: true, isMisc: true, dataLogged: true,
          outreaches: leadsSentCount, demoRequests: 0, closes: 0, nos: 0, followUpsSent: 0, followUpResponses: 0, continuedConversations: 0, notes: ""
        });
      }
    }
  };

  const markLeadSent = (leadId: string) => {
    syncUpdate(d => {
      const lead = d.leads.find(l => l.id === leadId);
      if (lead && lead.status !== 'sent') {
        lead.status = "sent";
        lead.sentAt = Date.now();
        autoLogOutreach(d); // Auto-log the sent count to the tracker!
      }
    });
  };

  const markLeadSkipped = (leadId: string) => {
    syncUpdate(d => {
      const lead = d.leads.find(l => l.id === leadId);
      if (lead) lead.status = "skipped";
    });
  };

  const markLeadInvalid = (leadId: string) => {
    syncUpdate(d => {
      const lead = d.leads.find(l => l.id === leadId);
      if (lead && lead.status === 'sent') {
        lead.status = "invalid";
        // Do we decrement from session? Hard to trace which session it came from. Let's just leave it, or do best-effort update:
        const todayMisc = d.sessions.find(s => s.date === todayStr() && s.isMisc);
        if (todayMisc && todayMisc.outreaches > 0) todayMisc.outreaches -= 1;
      }
    });
  };

  const importLeads = (leads: Lead[]) => {
    syncUpdate(d => {
      // Append only new ones or clear entirely? The spec says "Replace existing list?" logic is normally used. Let's replace completely here for simplicity.
      d.leads = leads;
    });
  }
  const clearLeads = () => syncUpdate(d => { d.leads = []; });
  const resetLeadProgress = () => syncUpdate(d => { d.leads.forEach(l => l.status = 'pending'); });

  // --- Demo Generator Helpers ---
  const generateDemoLink = (businessName: string, category: string) => {
    const url = `${window.location.origin}${category}?name=${encodeURIComponent(businessName)}`;
    syncUpdate(d => {
      d.demos.unshift({ id: uuid(), businessName, category, url, createdAt: new Date().toISOString() });
      
      // Auto-log demo creation as a demo request in active tracker
      const running = d.sessions.find(s => s.status === "running");
      if (running) {
        running.demoRequests += 1;
      } else {
        let todayMisc = d.sessions.find(s => s.date === todayStr() && s.isMisc);
        if (todayMisc) {
          todayMisc.demoRequests += 1;
        } else {
          d.sessions.push({
            id: uuid(), date: todayStr(), startTime: null, endTime: null, duration: null, status: "complete", isSessionless: true, isMisc: true, dataLogged: true,
            outreaches: 0, demoRequests: 1, closes: 0, nos: 0, followUpsSent: 0, followUpResponses: 0, continuedConversations: 0, notes: ""
          });
        }
      }
    });
  };

  const deleteDemo = (demoId: string) => {
    syncUpdate(d => {
      d.demos = d.demos.filter(x => x.id !== demoId);
    });
  }

  // --- Settings ---
  const updateDailyTarget = (t: number) => {
    syncUpdate(d => { d.settings.dailyTarget = t; d.meta.dailyTarget = t; });
  };

  const resetAllData = () => {
    setData(DEFAULT_DATA());
  };

  const importAppData = (jString: string) => {
    try {
      const parsed = JSON.parse(jString);
      setData(parsed);
    } catch {
      alert("Invalid JSON data");
    }
  };

  const exportAppData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `ot-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <AppContext.Provider value={{ data, setData, activeSession, startSession, stopSession, autoCloseSession, saveLogData, quickAddMiscSession, markLeadSent, markLeadSkipped, markLeadInvalid, importLeads, clearLeads, resetLeadProgress, generateDemoLink, deleteDemo, updateDailyTarget, resetAllData, importAppData, exportAppData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Missing AppProvider");
  return ctx;
}
