'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TabWindow from './TabWindow';
import SignInPage from './SignInPage';

export default function ChatLayout() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('chat-1');
  const [tabs, setTabs] = useState([
    { id: 'chat-1', title: 'Chat 1', active: true },
  ]);

  const createNewTab = () => {
    const newId = `chat-${tabs.length + 1}`;
    setTabs([
      ...tabs.map(tab => ({ ...tab, active: false })),
      { id: newId, title: `Chat ${tabs.length + 1}`, active: true }
    ]);
    setActiveTab(newId);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    
    const tabIndex = tabs.findIndex(tab => tab.id === id);
    const newTabs = tabs.filter(tab => tab.id !== id);
    
    if (id === activeTab && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTab(newTabs[newActiveIndex].id);
    }
    
    setTabs(newTabs);
  };

  const switchTab = (id: string) => {
    setActiveTab(id);
    setTabs(tabs.map(tab => ({ ...tab, active: tab.id === id })));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-900 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!user) {
    return <SignInPage />;
  }

  // Show main chat interface if authenticated
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-900">
      <Sidebar onNewChat={createNewTab} />
      <TabWindow 
        tabs={tabs}
        activeTab={activeTab}
        onTabSwitch={switchTab}
        onTabClose={closeTab}
        onNewTab={createNewTab}
      />
    </div>
  );
}

