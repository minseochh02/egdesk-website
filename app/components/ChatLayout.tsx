'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TabWindow, { Tab } from './TabWindow';
import SignInPage from './SignInPage';

export default function ChatLayout() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('chat-1');
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'chat-1', title: 'Chat 1', active: true, type: 'chat' },
  ]);

  const createNewTab = () => {
    const newId = `chat-${Date.now()}`; // Use timestamp to avoid conflicts
    setTabs([
      ...tabs.map(tab => ({ ...tab, active: false })),
      { id: newId, title: `Chat ${tabs.length + 1}`, active: true, type: 'chat' }
    ]);
    setActiveTab(newId);
  };

  const handleOpenProject = (projectId: string, projectName: string, serverKey: string, serviceName: string) => {
    const newId = `project-${projectId}`;
    
    // Check if tab already exists
    const existingTab = tabs.find(t => t.id === newId);
    if (existingTab) {
      setActiveTab(newId);
      setTabs(tabs.map(tab => ({ ...tab, active: tab.id === newId })));
      return;
    }

    setTabs([
      ...tabs.map(tab => ({ ...tab, active: false })),
      { 
        id: newId, 
        title: projectName || 'Project', 
        active: true, 
        type: 'apps-script-editor',
        data: {
          projectId,
          projectName,
          serverKey,
          serviceName
        }
      }
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
      // Ensure the new active tab is marked as active in the state
      newTabs[newActiveIndex].active = true;
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
        onOpenProject={handleOpenProject}
      />
    </div>
  );
}
