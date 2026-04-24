/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppStore } from './context/AppContext';
import { House, Handshake, Target, BarChart2, Settings, FileSpreadsheet } from 'lucide-react';
import HomeTab from './components/tabs/HomeTab';
import LeadsTab from './components/tabs/LeadsTab';
import DemosTab from './components/tabs/DemosTab';
import InsightsTab from './components/tabs/InsightsTab';
import SettingsTab from './components/tabs/SettingsTab';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: House, comp: HomeTab },
    { id: 'leads', label: 'Leads', icon: Target, comp: LeadsTab },
    { id: 'demos', label: 'Demos', icon: Handshake, comp: DemosTab },
    { id: 'insights', label: 'Insights', icon: BarChart2, comp: InsightsTab },
    { id: 'settings', label: 'Settings', icon: Settings, comp: SettingsTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.comp || HomeTab;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto pb-6 relative">
        <ActiveComponent />
      </div>

      {/* Bottom Nav */}
      <nav className="flex-shrink-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#262626] pb-safe pb-4 w-full max-w-lg mx-auto">
        <div className="flex px-1 pt-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-1 text-[10px] uppercase font-bold tracking-widest transition-colors relative ${isActive ? 'text-white' : 'text-[#666]'}`}
              >
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37]"></div>
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
