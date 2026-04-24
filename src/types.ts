export interface Session {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  status: 'running' | 'pending' | 'auto-closed' | 'complete';
  isSessionless: boolean;
  isMisc: boolean;
  outreaches: number;
  nos: number;
  demoRequests: number;
  followUpsSent: number;
  followUpResponses: number;
  continuedConversations: number;
  closes: number;
  notes: string;
  dataLogged: boolean;
}

export interface AppData {
  meta: { version: string; created: string; dailyTarget: number };
  sessions: Session[];
  leads: Lead[];
  demos: DemoLink[];
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
    freezeTokens: number;
    freezeUsedThisWeek: boolean;
  };
  rewards: {
    animationsTriggered: string[];
    milestoneStreaksHit: number[];
    milestoneVolumeHit: number[];
  };
  settings: {
    dailyTarget: number;
    notificationsEnabled: boolean;
    reminderTime: string;
  };
  backup: { lastBackupDate: string | null; promptShown: boolean };
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'skipped' | 'invalid';
  sentAt?: number;
}

export interface DemoLink {
  id: string;
  businessName: string;
  category: string;
  url: string;
  createdAt: string;
}
