import { useState, useRef, useCallback } from 'react';
import { ScriptFile, SpreadsheetContext, ChatMessage } from './types';

interface UseAppsScriptAIProps {
  projectId: string;
  projectName?: string;
  selectedFile: string | null;
  fileContent: string;
  devScriptId?: string;
  devSpreadsheetId?: string;
  devSpreadsheetUrl?: string;
  prodSpreadsheetId?: string;
  prodSpreadsheetUrl?: string;
  spreadsheetContext: SpreadsheetContext;
  files: ScriptFile[];
  selectedModel: string;
  callTool: (name: string, args: any) => Promise<any>;
  setFileContent: (content: string) => void;
  loadFiles: () => Promise<void>;
  loadVersions: () => Promise<void>;
  user: any;
  currentConversation: any;
  saveMessage: (msg: any) => Promise<any>;
}

export function useAppsScriptAI({
  projectId,
  projectName,
  selectedFile,
  fileContent,
  devScriptId,
  devSpreadsheetId,
  devSpreadsheetUrl,
  prodSpreadsheetId,
  prodSpreadsheetUrl,
  spreadsheetContext,
  files,
  selectedModel,
  callTool,
  setFileContent,
  loadFiles,
  loadVersions,
  user,
  currentConversation,
  saveMessage
}: UseAppsScriptAIProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  const clearConversationContext = useCallback(() => {
    conversationHistoryRef.current = [];
    setChatMessages([]);
  }, []);

  const processUserMessage = async (message: string): Promise<{ content: string; toolCalls?: any[] }> => {
    const availableTools = [
      {
        name: 'apps_script_list_files',
        description: 'List all files in the current Apps Script project. Use this to see what files exist.',
        parameters: { projectId: 'string (The project ID)' }
      },
      {
        name: 'apps_script_read_file',
        description: 'Read the contents of a file in the Apps Script project. Use this to examine code before modifying.',
        parameters: { 
          projectId: 'string (The project ID)',
          fileName: 'string (The file name, e.g., "Code.gs", "index.html")'
        }
      },
      {
        name: 'apps_script_write_file',
        description: 'Create a NEW file or update an EXISTING file in the Apps Script project. Use this to create HTML files, modify code, add new functions, etc.',
        parameters: {
          projectId: 'string (The project ID)',
          fileName: 'string (The file name - can be new or existing, e.g., "NewPage.html", "Utils.gs")',
          content: 'string (The complete file content to write)'
        }
      },
      {
        name: 'apps_script_run_function',
        description: 'Execute a function in the Apps Script project remotely. Runs against the most recent saved version. Use this to test functions, retrieve data, or trigger operations like listing triggers, getting spreadsheet data, etc.',
        parameters: {
          projectId: 'string (The project ID)',
          functionName: 'string (Name of the function to execute, e.g., "listAllTriggers", "myFunction")',
          parameters: 'array (Optional - array of parameters to pass to the function)'
        }
      },
      {
        name: 'apps_script_list_deployments',
        description: 'List all deployments of the Apps Script project. Shows web app URLs, deployment IDs, and configuration.',
        parameters: { projectId: 'string (The project ID)' }
      },
      {
        name: 'apps_script_create_version',
        description: 'Create a new version (snapshot) of the Apps Script project. Versions are required before creating deployments.',
        parameters: {
          projectId: 'string (The project ID)',
          description: 'string (Optional description for the version)'
        }
      },
      {
        name: 'apps_script_create_deployment',
        description: 'Deploy the Apps Script project as a web app. Creates a new version if none specified. Returns the web app URL that users can access.',
        parameters: {
          projectId: 'string (The project ID)',
          versionNumber: 'number (Optional - version number to deploy, creates new version if not provided)',
          description: 'string (Optional description for the deployment)',
          access: 'string (Who can access: "MYSELF", "DOMAIN", "ANYONE", "ANYONE_ANONYMOUS")',
          executeAs: 'string (Who runs the script: "USER_ACCESSING" or "USER_DEPLOYING")'
        }
      },
      {
        name: 'apps_script_update_deployment',
        description: 'Update an existing deployment to use a new version. Useful for publishing code changes to an existing web app URL.',
        parameters: {
          projectId: 'string (The project ID)',
          deploymentId: 'string (The deployment ID to update)',
          versionNumber: 'number (Optional - new version number, creates new version if not provided)',
          description: 'string (Optional new description)'
        }
      },
      {
        name: 'apps_script_list_versions',
        description: 'List all saved versions (snapshots) of the Apps Script project. Returns version numbers, descriptions, and creation dates.',
        parameters: { 
          projectId: 'string (The project ID)' 
        }
      },
      {
        name: 'apps_script_get_version_content',
        description: 'Get the file contents of a specific version. Use this to view or compare code from a previous snapshot.',
        parameters: {
          projectId: 'string (The project ID)',
          versionNumber: 'number (The version number to retrieve)'
        }
      },
      ...(devScriptId ? [
        {
          name: 'apps_script_push_to_dev',
          description: 'Push local changes to DEV environment. This makes your local code changes LIVE in the development script. Use this after making and testing changes locally.',
          parameters: {
            devProjectId: `string (The DEV project ID - use "${devScriptId}")`,
            files: 'array (Files to push - current local files will be used)'
          }
        },
        {
          name: 'apps_script_pull_from_dev',
          description: 'Pull DEV code to local workspace. This downloads the current DEV script files to your local workspace.',
          parameters: {
            devProjectId: `string (The DEV project ID - use "${devScriptId}")`
          }
        },
        {
          name: 'apps_script_push_dev_to_prod',
          description: '⚠️ PRODUCTION DEPLOYMENT: Push DEV code to PRODUCTION. This copies all code from DEV to PROD script. Only use when user explicitly requests deployment to production.',
          parameters: {
            devProjectId: `string (The DEV project ID - use "${devScriptId}")`,
            prodProjectId: `string (The PROD project ID - use "${projectId}")`,
            createVersion: 'boolean (Whether to create a version snapshot before pushing)'
          }
        },
        {
          name: 'apps_script_pull_prod_to_dev',
          description: 'Sync DEV with PRODUCTION code. This copies all code from PROD to DEV script, useful for resetting DEV to match current production.',
          parameters: {
            prodProjectId: `string (The PROD project ID - use "${projectId}")`,
            devProjectId: `string (The DEV project ID - use "${devScriptId}")`
          }
        }
      ] : []),
      ...(spreadsheetContext.spreadsheetId ? [
        {
          name: 'sheets_get_range',
          description: 'Read a range of cells from the bound Google Spreadsheet. Use this to get actual data.',
          parameters: {
            spreadsheetId: 'string (The spreadsheet ID)',
            range: 'string (A1 notation range, e.g., "Sheet1!A1:D10")'
          }
        },
        {
          name: 'sheets_get_headers',
          description: 'Get the header row (first row) of a sheet in the bound spreadsheet.',
          parameters: {
            spreadsheetId: 'string (The spreadsheet ID)',
            sheetName: 'string (Optional, defaults to "Sheet1")'
          }
        }
      ] : [])
    ];

    let spreadsheetSection = '';
    if (spreadsheetContext.spreadsheetId && !spreadsheetContext.isLoading) {
      spreadsheetSection = `
🔴 CRITICAL - BOUND SPREADSHEET (YOU ALREADY HAVE ACCESS TO THIS DATA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Spreadsheet Name: "${spreadsheetContext.spreadsheetName || 'Untitled Spreadsheet'}"
- Spreadsheet ID: ${spreadsheetContext.spreadsheetId}
- URL: ${spreadsheetContext.spreadsheetUrl}

📊 ACTUAL DATA STRUCTURE (THIS IS REAL DATA FROM THE SPREADSHEET):
${spreadsheetContext.sheets.map(sheet => `
Sheet: "${sheet.sheetTitle}" (${sheet.rowCount} rows × ${sheet.columnCount} cols)
  Column Headers: [${sheet.headers.map(h => `"${h}"`).join(', ') || 'No headers'}]
  Sample Data Row 1: [${sheet.sampleData[0]?.map(d => `"${d}"`).join(', ') || 'No data'}]
  ${sheet.sampleData[1] ? `Sample Data Row 2: [${sheet.sampleData[1]?.map(d => `"${d}"`).join(', ')}]` : ''}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT: DO NOT tell the user to "upload a file" or "convert to CSV" or "provide data".
The spreadsheet is ALREADY CONNECTED. You can read it directly using Apps Script.

When user asks to "view the data", "show Excel content", "create HTML for the spreadsheet", "엑셀 내용을 볼 수 있는":
1. DO NOT ask for files - the data is already available above!
2. IMMEDIATELY create the files using the ACTUAL column names shown above
3. Create Code.gs with a getData() function using SpreadsheetApp.getActiveSpreadsheet()
4. Create an HTML file that displays the data in a table

APPS SCRIPT CODE TO ACCESS THIS DATA:
\`\`\`javascript
// This spreadsheet is already bound - use getActiveSpreadsheet()
function getData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return data;
}
\`\`\`
`;
    } else if (!spreadsheetContext.spreadsheetId && !spreadsheetContext.isLoading) {
      spreadsheetSection = `
NO BOUND SPREADSHEET:
This script is not bound to a spreadsheet. If the user wants to work with spreadsheet data:
1. They need to provide a spreadsheet ID, or
2. Create functions that accept spreadsheet ID as parameter
`;
    }

    let envInfo = '';
    if (devScriptId && projectId) {
      envInfo = `
🌍 ENVIRONMENT SETUP (Local → Dev → Prod workflow):
┌─────────────────────────────────────────────────────────────────┐
│ 🔧 DEV ENVIRONMENT (for testing/development):                  │
│    Script ID: "${devScriptId}"                                  │
│    Spreadsheet: ${devSpreadsheetId || 'Not set'}               │
│    ${devSpreadsheetUrl ? `URL: ${devSpreadsheetUrl}` : ''}     │
├─────────────────────────────────────────────────────────────────┤
│ 📋 PROD ENVIRONMENT (live/production):                          │
│    Script ID: "${projectId}"                                    │
│    Spreadsheet: ${prodSpreadsheetId || spreadsheetContext.spreadsheetId || 'Not set'}
│    ${prodSpreadsheetUrl || spreadsheetContext.spreadsheetUrl ? `URL: ${prodSpreadsheetUrl || spreadsheetContext.spreadsheetUrl}` : ''}
└─────────────────────────────────────────────────────────────────┘

📝 WORKFLOW GUIDELINES:
1. Edit files locally using apps_script_write_file (changes are LOCAL only)
2. Push to DEV using apps_script_push_to_dev to test changes
3. User tests in DEV spreadsheet
4. Only push to PROD using apps_script_push_dev_to_prod when user explicitly requests

⚠️ IMPORTANT: Always work in DEV first. Only deploy to PROD when user confirms!
`;
    } else {
      envInfo = `
🔑 PROJECT ID: "${projectId}"
${!devScriptId ? '⚠️ DEV environment not set up - changes go directly to PROD' : ''}
`;
    }

    const systemInstruction = `You are an expert Google Apps Script developer assistant. You help users write, debug, and improve their Apps Script code.

PROJECT CONTEXT:
- Project: "${projectName || projectId}"
- Currently open file: ${selectedFile || 'None selected'}
${fileContent ? `- Current file content preview (first 1500 chars):\n\`\`\`\n${fileContent.substring(0, 1500)}\n\`\`\`` : ''}
${envInfo}
${spreadsheetSection}
SCRIPT FILES:
${files.map(f => `- ${f.name} (${f.type})`).join('\n') || 'No files loaded yet'}

AVAILABLE TOOLS:
${availableTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

CAPABILITIES:
1. **Create new files**: Use apps_script_write_file with a new fileName to create .gs (server-side) or .html (client-side) files
2. **Modify existing files**: Use apps_script_write_file to update code
3. **Read files**: Use apps_script_read_file to examine code before suggesting changes
4. **List project files**: Use apps_script_list_files to see all files in the project
5. **Deploy as Web App**: Use apps_script_create_deployment to deploy the script and get a public URL
6. **List deployments**: Use apps_script_list_deployments to see existing deployments and their URLs
7. **Update deployment**: Use apps_script_update_deployment to update an existing deployment with new code
8. **Create versions**: Use apps_script_create_version to create a snapshot before deployment
9. **Run functions remotely**: Use apps_script_run_function to execute any function in the script
   - Use this for operations like: listing triggers, testing functions, getting data
   - Example: To list triggers, call a function like "listAllTriggers" if it exists in the code
   - The function must exist in the script files - check with apps_script_read_file first if unsure
${spreadsheetContext.spreadsheetId ? `10. **Read spreadsheet data**: Use sheets_get_range or sheets_get_headers to get live data` : ''}
${devScriptId ? `
🔧 DEV/PROD WORKFLOW TOOLS:
11. **Push to DEV**: Use apps_script_push_to_dev to push local changes to DEV (makes changes LIVE in dev)
12. **Pull from DEV**: Use apps_script_pull_from_dev to pull DEV code to local
13. **Deploy to PROD**: Use apps_script_push_dev_to_prod to deploy DEV code to PRODUCTION (⚠️ use with caution!)
14. **Sync from PROD**: Use apps_script_pull_prod_to_dev to sync DEV with current PRODUCTION code` : ''}

🔄 AFTER EXECUTING TOOLS:
Always explain what the tool results mean in plain language:
- For list_files: "I found X files in your project: ..."
- For run_function: Explain what the function returned and what it means
- For deployments: Highlight the web URL and access instructions
- Don't just show raw data - provide helpful context!

DEPLOYMENT INSTRUCTIONS:
When user asks to "deploy", "get a URL", "make it accessible", "배포해줘":
1. First ensure the code has a doGet() or doPost() function for web apps
2. ALWAYS use apps_script_create_deployment (NOT update_deployment) - this creates a NEW web app URL
3. Use access: "ANYONE" for public access, or "MYSELF" for private access
4. The tool will automatically create a new version and deploy it
5. Return the webAppUrl to the user - this is the URL they can access

⚠️ NEVER use apps_script_update_deployment unless updating a SPECIFIC non-HEAD deployment ID
   The HEAD deployment is READ-ONLY and cannot be modified!

IMPORTANT BEHAVIORS:
1. When user asks to "create HTML" or "make a page", IMMEDIATELY create the file using apps_script_write_file
2. When user asks to modify code, first read the current file if not already shown, then write the updated version
3. For HTML files in Apps Script, use proper Apps Script HTML service patterns (<?= ?> scriptlets, google.script.run, etc.)
4. Always generate COMPLETE, working code - don't use placeholders like "// your code here"
5. If user's request is unclear, ask ONE clarifying question, then proceed
${spreadsheetContext.spreadsheetId ? `
🔴 SPREADSHEET-SPECIFIC RULES (VERY IMPORTANT):
6. NEVER say "upload a file", "provide the data", "convert to CSV", or ask for Excel files
7. The spreadsheet data is ALREADY AVAILABLE - see the headers and sample data above
8. When user asks to "view data", "show spreadsheet", "엑셀 볼 수 있게", IMMEDIATELY create HTML using the actual column names
9. Use SpreadsheetApp.getActiveSpreadsheet() - the spreadsheet is already bound to this script
10. Create BOTH: Code.gs (with getData function) AND an HTML file (with table displaying the data)` : ''}

APPS SCRIPT SPECIFIC KNOWLEDGE:
- .gs files are server-side JavaScript (Google's V8 runtime)
- .html files can include CSS/JS and use scriptlets: <?= ?>, <? ?>, <?!= ?>
- Use google.script.run.functionName() to call server functions from HTML
- SpreadsheetApp, DriveApp, GmailApp, etc. are available server-side
- HtmlService.createHtmlOutputFromFile('filename') serves HTML pages

📋 PROJECT DOCUMENTATION APPROACH:
When user shares a script project or asks you to build one, FIRST create a checklist:
1. Document what the project requires (inputs, outputs, data sources)
2. Outline the logic needed to address each requirement
3. Then implement with the best practices below

🏆 APPS SCRIPT BEST PRACTICES (ALWAYS FOLLOW):

1. **PropertiesService for Dynamic Variables**
   - NEVER hardcode file IDs, folder IDs, or API keys in code
   - Use PropertiesService.getScriptProperties() or .getUserProperties()
   - Example: \`PropertiesService.getScriptProperties().setProperty('FOLDER_ID', folderId)\`

2. **Self-Initializing Setup (One-Click Ready)**
   - Create a setupEnvironment() function that initializes everything
   - If folder/file doesn't exist, CREATE it automatically - don't ask user for IDs
   - Store created resource IDs in PropertiesService for future use
   - User should be able to copy the project and run with ONE button click

3. **Proper appsscript.json Manifest**
   - Always generate/update appsscript.json with correct oauthScopes
   - Include timeZone, exceptionLogging, runtimeVersion: "V8"
   - Add webapp config if deploying as web app

4. **Official Google APIs**
   - Use web search to find official Google API documentation
   - Prefer built-in services (SpreadsheetApp, DriveApp) over REST APIs when possible
   - For advanced features, use UrlFetchApp with official Google APIs

5. **Logging with Logger**
   - Use Logger.log() for debugging and audit trails
   - Use console.log() for V8 runtime debugging
   - Add meaningful log messages at key steps

6. **Triggers for Automation**
   - Use ScriptApp.newTrigger() for scheduled/continuous tasks
   - Add 'https://www.googleapis.com/auth/script.scriptapp' scope for trigger management
   - Provide install/remove trigger functions for user control

7. **Immediate File Generation**
   - When starting a project, IMMEDIATELY create appsscript.json and Code.gs
   - Don't just explain - actually write the files using apps_script_write_file

📐 STANDARD UI MENU PATTERN (Use for Spreadsheet-bound scripts):
\`\`\`javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧩 Project Name');
  
  // ZONE 1: Primary Actions (Daily Use)
  menu.addItem('▶️ Run Main Task', 'mainFunction')
      .addItem('📊 Generate Report', 'reportFunction');
  
  // ZONE 2: Automation (Triggers)
  menu.addSeparator()
      .addItem('⏰ Enable Auto-Run', 'installTrigger')
      .addItem('🛑 Disable Auto-Run', 'removeTrigger');
  
  // ZONE 3: Settings (Sub-menu for cleaner UI)
  const settingsMenu = ui.createMenu('⚙️ Settings');
  settingsMenu.addItem('🚀 Initial Setup', 'setupEnvironment')
              .addSeparator()
              .addItem('🔑 Set API Key', 'setApiKey')
              .addItem('👀 View Status', 'checkStatus')
              .addItem('🗑️ Clear Data', 'clearData');
  
  menu.addSeparator().addSubMenu(settingsMenu);
  menu.addToUi();
}
\`\`\`

EXAMPLE - Creating an HTML page to display spreadsheet data:
User: "이 엑셀 내용을 볼 수 있는 HTML 코드 만들어주세요" or "Create an HTML page to display data"
You: 
✅ CORRECT: "I can see your spreadsheet '${spreadsheetContext.spreadsheetName || 'Spreadsheet'}' has columns: ${spreadsheetContext.sheets[0]?.headers?.join(', ') || 'various columns'}. I'll create the files now."
   Then IMMEDIATELY call apps_script_write_file twice:
   1. Create Code.gs with getData() function
   2. Create DataView.html with table

❌ WRONG: "Please upload your Excel file" or "I need you to provide the data first"
   (The data is already available! Never ask for uploads!)

Be proactive, write clean code, and always use the tools to actually create/modify files - don't just show code in chat.

🚨 OUTPUT FORMAT (CRITICAL):
You MUST respond with valid JSON only. No markdown code fences.
{
  "content": "Your response (escape quotes with \\", newlines with \\n)",
  "toolCalls": [{"name": "tool_name", "args": {"key": "value"}}]
}
- Use toolCalls: [] when no tools needed
- Keep content SHORT when calling tools
- NEVER include unescaped newlines or quotes in JSON strings`;

    const context = {
      availableTools,
      systemInstruction,
      currentProject: projectId,
      currentProjectName: projectName,
      currentFile: selectedFile,
      currentFileContent: fileContent ? fileContent.substring(0, 2000) : null
    };

    if (conversationHistoryRef.current.length === 0) {
      conversationHistoryRef.current.push({ role: 'system', content: systemInstruction });
    } else {
      conversationHistoryRef.current[0] = { role: 'system', content: systemInstruction };
    }
    
    conversationHistoryRef.current.push({ role: 'user', content: message });
    
    let finalContent = '';
    let maxIterations = 5;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: conversationHistoryRef.current,
          context,
          model: selectedModel || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      finalContent = data.content;
      
      if (!data.toolCalls || data.toolCalls.length === 0) {
        break;
      }

      const executedTools = [];
      let shouldBreakLoop = false;
      
      for (const toolCall of data.toolCalls) {
        try {
          let result;
          switch (toolCall.name) {
            case 'apps_script_list_files':
              result = await callTool('apps_script_list_files', { projectId: toolCall.args.projectId || projectId });
              break;
            case 'apps_script_read_file':
              result = await callTool('apps_script_read_file', { projectId: toolCall.args.projectId || projectId, fileName: toolCall.args.fileName });
              break;
            case 'apps_script_write_file':
              result = await callTool('apps_script_write_file', { projectId: toolCall.args.projectId || projectId, fileName: toolCall.args.fileName, content: toolCall.args.content });
              if (toolCall.args.fileName === selectedFile) setFileContent(toolCall.args.content);
              if (!files.some(f => f.name === toolCall.args.fileName)) loadFiles();
              break;
            case 'apps_script_run_function':
              result = await callTool('apps_script_run_function', { projectId: toolCall.args.projectId || projectId, functionName: toolCall.args.functionName, parameters: toolCall.args.parameters });
              break;
            case 'apps_script_list_deployments':
              result = await callTool('apps_script_list_deployments', { projectId: toolCall.args.projectId || projectId });
              break;
            case 'apps_script_create_version':
              result = await callTool('apps_script_create_version', { projectId: toolCall.args.projectId || projectId, description: toolCall.args.description });
              if (result?.content?.success !== false && !result?.error) {
                loadVersions();
                shouldBreakLoop = true;
              }
              break;
            case 'apps_script_create_deployment':
              result = await callTool('apps_script_create_deployment', { projectId: toolCall.args.projectId || projectId, versionNumber: toolCall.args.versionNumber, description: toolCall.args.description, access: toolCall.args.access || 'ANYONE', executeAs: toolCall.args.executeAs || 'USER_DEPLOYING' });
              if (result && !result.error) shouldBreakLoop = true;
              break;
            case 'apps_script_update_deployment':
              result = await callTool('apps_script_update_deployment', { projectId: toolCall.args.projectId || projectId, deploymentId: toolCall.args.deploymentId, versionNumber: toolCall.args.versionNumber, description: toolCall.args.description });
              if (result && !result.error) shouldBreakLoop = true;
              break;
            case 'apps_script_list_versions':
              result = await callTool('apps_script_list_versions', { projectId: toolCall.args.projectId || projectId });
              break;
            case 'apps_script_get_version_content':
              result = await callTool('apps_script_get_version_content', { projectId: toolCall.args.projectId || projectId, versionNumber: toolCall.args.versionNumber });
              break;
            case 'apps_script_push_to_dev':
              result = await callTool('apps_script_push_to_dev', { devProjectId: devScriptId, files: files });
              break;
            case 'apps_script_pull_from_dev':
              result = await callTool('apps_script_pull_from_dev', { devProjectId: devScriptId });
              break;
            case 'apps_script_push_dev_to_prod':
              result = await callTool('apps_script_push_dev_to_prod', { devProjectId: devScriptId, prodProjectId: projectId, createVersion: toolCall.args.createVersion });
              break;
            case 'apps_script_pull_prod_to_dev':
              result = await callTool('apps_script_pull_prod_to_dev', { prodProjectId: projectId, devProjectId: devScriptId });
              break;
            case 'sheets_get_range':
              result = await callTool('sheets_get_range', { spreadsheetId: toolCall.args.spreadsheetId || spreadsheetContext.spreadsheetId, range: toolCall.args.range });
              break;
            case 'sheets_get_headers':
              result = await callTool('sheets_get_headers', { spreadsheetId: toolCall.args.spreadsheetId || spreadsheetContext.spreadsheetId, sheetName: toolCall.args.sheetName });
              break;
          }
          executedTools.push({ name: toolCall.name, args: toolCall.args, result });
        } catch (toolErr) {
          executedTools.push({ name: toolCall.name, args: toolCall.args, error: String(toolErr) });
        }
      }

      conversationHistoryRef.current.push({ role: 'assistant', content: finalContent, toolCalls: executedTools } as any);
      if (shouldBreakLoop) break;
    }

    return { content: finalContent, toolCalls: (conversationHistoryRef.current[conversationHistoryRef.current.length - 1] as any).toolCalls };
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    if (currentConversation?.id) {
      saveMessage({
        conversation_id: currentConversation.id,
        role: 'user',
        content: chatInput,
        metadata: { source: 'appsscript-editor', project_id: projectId, project_name: projectName, user_email: user?.email }
      }).catch(err => console.warn('Failed to save user message:', err));
    }

    try {
      const response = await processUserMessage(userMessage.content);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);

      if (currentConversation?.id) {
        saveMessage({
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: response.content,
          metadata: { source: 'appsscript-editor', project_id: projectId, project_name: projectName, user_email: user?.email, toolCalls: response.toolCalls }
        }).catch(err => console.warn('Failed to save assistant message:', err));
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return {
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    handleSendMessage,
    clearConversationContext,
    conversationHistoryRef
  };
}

