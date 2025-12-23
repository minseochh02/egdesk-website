import { ConversationMessage } from '@/hooks/useConversations';

export interface ScriptFile {
  name: string;
  type: string;
  source?: string;
  id?: string;
}

export interface SpreadsheetContext {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetName?: string;
  sheets: Array<{
    sheetTitle: string;
    headers: string[];
    sampleData: string[][];
    rowCount: number;
    columnCount: number;
  }>;
  isLoading: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

export interface VersionInfo {
  versionNumber: number;
  description?: string;
  createTime: string;
}

export type SyncStatus = 'idle' | 'pushed' | 'pulled' | 'error' | 'dev-pushed' | 'dev-pulled' | 'prod-pushed' | 'prod-pulled';

