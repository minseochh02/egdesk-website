'use client';

import ChatArea from './ChatArea';

interface Tab {
  id: string;
  title: string;
  active: boolean;
}

interface TabWindowProps {
  tabs: Tab[];
  activeTab: string;
  onTabSwitch: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

export default function TabWindow({ 
  tabs, 
  activeTab, 
  onTabSwitch, 
  onTabClose,
  onNewTab 
}: TabWindowProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chrome-style Tab Bar */}
      <div className="flex items-end gap-0.5 bg-zinc-900 px-2 pt-2">
        <div className="flex items-end flex-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group relative flex items-center gap-2 px-4 py-2 rounded-t-lg min-w-[120px] max-w-[200px] cursor-pointer transition-all ${
                tab.id === activeTab
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-300'
              }`}
              onClick={() => onTabSwitch(tab.id)}
            >
              {/* Tab Shape Background */}
              <div
                className={`absolute inset-0 rounded-t-lg ${
                  tab.id === activeTab ? 'bg-zinc-800' : ''
                }`}
                style={{
                  clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 100%, 0 100%)',
                }}
              />
              
              {/* Tab Content */}
              <div className="relative flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="truncate text-sm font-medium">{tab.title}</span>
                
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={`rounded p-0.5 transition-opacity ${
                    tabs.length === 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                  } hover:bg-zinc-700`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-8 h-8 mb-1 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="New Tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-zinc-800 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full ${tab.id === activeTab ? 'block' : 'hidden'}`}
          >
            <ChatArea tabId={tab.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

