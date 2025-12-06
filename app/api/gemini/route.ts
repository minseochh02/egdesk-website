import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;
    
    // Handle both single message and conversation history
    const conversationHistory = Array.isArray(message) ? message : [{ role: 'user', content: message }];

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const systemPrompt = `🚨 CRITICAL INSTRUCTION - READ FIRST:
When user says "download [filename]" with just a filename (not full path):
- IMMEDIATELY call fs_search_files tool (don't ask where the file is!)
- Tool call FIRST, explanation after
- Example: User says "download image.png" → You immediately call fs_search_files(pattern="image.png", path="/")

You are an AI assistant that helps users interact with various MCP (Model Context Protocol) services and tools.

Available MCP Services and Tools:
${context.availableTools.map((tool: any) => {
  const serviceBadge = tool.service ? `[${tool.service.toUpperCase()}]` : '';
  const params = tool.inputSchema?.properties 
    ? Object.entries(tool.inputSchema.properties).map(([key, val]: [string, any]) => {
        const required = tool.inputSchema?.required?.includes(key) ? '(required)' : '(optional)';
        return `${key}: ${val.type || 'string'} ${required}`;
      }).join(', ')
    : JSON.stringify(tool.parameters);
  return `${serviceBadge} ${tool.name}: ${tool.description}\n  Parameters: ${params}`;
}).join('\n')}

GENERAL INSTRUCTIONS:
- You have access to multiple MCP services (filesystem, file-conversion, gmail, etc.)
- Each service provides different tools - choose the appropriate tool based on the user's request
- Be proactive and helpful - infer what the user wants and execute the necessary tools
- Respond naturally and contextually

FILE ATTACHMENTS (FILESYSTEM SERVICE):
When you see "[User has attached X file(s) to this message:]" in the conversation:
- The user has attached files to their message (for images, you cannot see the visual content, but you know the filename and type)
- Files are held in browser memory and NOT automatically saved
- To save attached files: call fs_upload_file with the desired filename
- **RENAMING SUPPORTED**: You can rename files during upload! 
  - User attaches "image.png" but says "save as cat.png" → call fs_upload_file(filename: "cat.png")
  - System will use attached file's content but save with your specified filename
- Only provide the filename parameter - content is automatically pulled from attached files
- Respond naturally based on what the user asks - don't always ask "what would you like to do" unless it's unclear

🚨 CRITICAL FILESYSTEM BEHAVIOR - IMMEDIATE ACTION REQUIRED:
When user says "download image.png" or any filename WITHOUT full path:
- DO NOT respond with text asking for location
- IMMEDIATELY call fs_search_files(pattern="image.png", path="/") 
- Tool call FIRST, no conversational text before tool call
- Then download if 1 result, or list options if multiple

MANDATORY PATTERN:
User: "download image.png" 
You: [fs_search_files tool call] (no text first!)
Then: explain results and download or ask which one

FILE CONVERSION WORKFLOW (3-STEP PROCESS):
File conversion tools work with files ON THE DESKTOP, not in browser memory. You MUST follow this workflow:

**Step 1: UPLOAD** (if user attached file)
- Use fs_upload_file to save the file to desktop
- The system will automatically use the attached file's content when you provide just the filename
- IMPORTANT: The response will tell you the EXACT path where the file was saved
- Response format: "File uploaded successfully to: /full/path/to/file.xlsx"
- YOU MUST extract and use this path for the next step!

**Step 2: CONVERT**
- Use file-conversion tools (excel_to_pdf, word_to_pdf, image_convert, etc.)
- Use the EXACT path from Step 1's response as inputPath
- Generate outputPath by changing the file extension (e.g., .xlsx → .pdf)
- Example: excel_to_pdf(inputPath: "/Users/username/Downloads/data.xlsx", outputPath: "/Users/username/Downloads/data.pdf")

**Step 3: DOWNLOAD** (to send back to user's browser)
- Use fs_download_file with the outputPath from step 2
- This sends the converted file back to the user's browser

EXAMPLE WORKFLOW:
User says: "Convert this Excel file to PDF" (with attached file.xlsx)
1. fs_upload_file(filename: "file.xlsx") 
   Response: "File uploaded successfully to: /Users/john/Downloads/file.xlsx"
2. Extract path → use "/Users/john/Downloads/file.xlsx" as inputPath
   excel_to_pdf(inputPath: "/Users/john/Downloads/file.xlsx", outputPath: "/Users/john/Downloads/file.pdf")
3. fs_download_file(path: "/Users/john/Downloads/file.pdf") → sends PDF to browser

Available conversion tools: pdf_merge, pdf_split, pdf_rotate, images_to_pdf, image_convert, image_resize, word_to_pdf, excel_to_pdf, markdown_to_pdf, html_to_pdf

GMAIL TOOLS:
- Use gmail service tools to send emails, read messages, manage labels, etc.
- Examples: send_email, list_messages, get_message, create_draft, etc.
- Check available Gmail tools in the list above

${context?.currentFile ? `
APPS SCRIPT EDITOR CONTEXT:
You are helping the user edit an Apps Script project in a code editor.
- Current Project: ${context?.currentProjectName || context?.currentProject || 'Unknown'}
- Project ID: ${context?.currentProject || 'Unknown'}
- Currently Open File: ${context?.currentFile}
${context?.currentFileContent ? `
--- CURRENT FILE CONTENT (${context?.currentFile}) ---
${context?.currentFileContent}
--- END OF FILE CONTENT ---
` : '(No content loaded yet)'}

When the user asks about "this code" or "the code", they are referring to the file content shown above.
You can use apps_script_read_file to read other files, or apps_script_write_file to make changes.
` : ''}

🚨 CRITICAL: RESPONSE FORMAT (MUST BE VALID JSON):
You MUST respond with a valid JSON object. No markdown, no code fences, just pure JSON.

{
  "content": "Your response text here (escape quotes and newlines properly)",
  "toolCalls": []
}

Or with tool calls:
{
  "content": "Brief explanation of what you're doing",
  "toolCalls": [
    {"name": "tool_name", "args": {"param1": "value1"}}
  ]
}

JSON RULES:
- Escape all quotes inside strings with \\"
- Escape newlines with \\n
- NO trailing commas
- toolCalls must be an array (use [] if no tools needed)
- Keep "content" concise when calling tools

Be intelligent and use the right tools from the right services!`;

    // Build the full prompt with conversation history
    let prompt = systemPrompt + '\n\n';
    
    // If a custom system instruction was provided in context, include it prominently
    if (context?.systemInstruction) {
      console.log('📋 Custom system instruction found, length:', context.systemInstruction.length);
      console.log('📋 First 500 chars:', context.systemInstruction.substring(0, 500));
      prompt += `═══════════════════════════════════════════════════════════════════════════
CUSTOM SYSTEM INSTRUCTION (HIGHEST PRIORITY - FOLLOW THESE RULES):
═══════════════════════════════════════════════════════════════════════════
${context.systemInstruction}
═══════════════════════════════════════════════════════════════════════════

`;
    } else {
      console.log('⚠️ No custom system instruction in context!');
      console.log('📋 Context keys:', context ? Object.keys(context) : 'no context');
    }
    
    for (const msg of conversationHistory) {
      if (msg.role === 'system') {
        // Handle system messages from conversation history
        prompt += `[SYSTEM INSTRUCTION]\n${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      } else if (msg.role === 'tool') {
        prompt += `Tool Results: ${msg.content}\n\n`;
      }
    }
    
    prompt += '\nRespond with a JSON object. If you have enough information, set "toolCalls" to empty array and provide final answer in "content". Otherwise, specify tools to call.';

    console.log('🤖 Sending to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Gemini response received:', text.substring(0, 200) + '...');

    // Try to parse the JSON response with robust error handling
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Try direct parse first
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('📤 Returning parsed response with', parsed.toolCalls?.length || 0, 'tool calls');
          return NextResponse.json(parsed);
        } catch (directParseError) {
          console.log('⚠️ Direct JSON parse failed, attempting repair...');
          
          // Common JSON repairs
          // 1. Remove trailing commas before } or ]
          jsonStr = jsonStr.replace(/,\s*([\}\]])/g, '$1');
          
          // 2. Fix unescaped newlines in strings (common in code content)
          // This is tricky - we need to escape newlines that are inside string values
          // Try to identify if the error is from unescaped content in "content" field
          
          // 3. Try to extract just the essential fields
          const contentMatch = jsonStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const toolCallsMatch = jsonStr.match(/"toolCalls"\s*:\s*(\[[\s\S]*?\])/);
          
          if (contentMatch) {
            // Build a clean JSON object
            const cleanContent = contentMatch[1];
            const toolCalls = toolCallsMatch ? toolCallsMatch[1] : '[]';
            
            try {
              const cleanJson = `{"content": "${cleanContent}", "toolCalls": ${toolCalls}}`;
              const parsed = JSON.parse(cleanJson);
              console.log('📤 Returning repaired JSON with', parsed.toolCalls?.length || 0, 'tool calls');
              return NextResponse.json(parsed);
            } catch (cleanError) {
              // If even clean extraction fails, try one more approach
              console.log('⚠️ Clean extraction failed, trying lenient parse...');
            }
          }
          
          // 4. Last resort: Try to fix by truncating at a valid point
          // Find the last valid closing brace that balances
          let braceCount = 0;
          let lastValidEnd = -1;
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            else if (jsonStr[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastValidEnd = i;
              }
            }
          }
          
          if (lastValidEnd > 0) {
            try {
              const truncated = jsonStr.substring(0, lastValidEnd + 1);
              const parsed = JSON.parse(truncated);
              console.log('📤 Returning truncated JSON with', parsed.toolCalls?.length || 0, 'tool calls');
              return NextResponse.json(parsed);
            } catch (truncateError) {
              // Continue to fallback
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
    }

    // Fallback: return the text as content (strip any partial JSON)
    let cleanText = text;
    // If there's a content field we can extract, use just that
    const contentExtract = text.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (contentExtract) {
      cleanText = contentExtract[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    
    console.log('📤 Returning fallback text response');
    return NextResponse.json({
      content: cleanText,
      toolCalls: []
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request with Gemini' },
      { status: 500 }
    );
  }
}
