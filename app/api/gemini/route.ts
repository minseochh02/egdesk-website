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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemPrompt = `You are an AI assistant that helps users with file operations through MCP (Model Context Protocol) tools. 

Available tools:
${context.availableTools.map((tool: any) => 
  `- ${tool.name}: ${tool.description} (parameters: ${JSON.stringify(tool.parameters)})`
).join('\n')}

IMPORTANT: When users mention files without full paths, you should:
1. **USE fs_search_files FIRST** - This is the most efficient way to find files!
2. **Search common locations**: ~/Desktop, ~/Downloads, ~/Documents, ~/Pictures
3. **Use regex patterns** to match file names (e.g., "transkeyServlet.*\\.png" to find PNG files)

Common file locations on macOS:
- Downloads: /Users/minseocha/Downloads
- Desktop: /Users/minseocha/Desktop  
- Documents: /Users/minseocha/Documents
- Pictures: /Users/minseocha/Pictures
- Home: /Users/minseocha

When a user mentions a file name (like "transkeyServlet (27).png"):
1. **Use fs_search_files** with pattern matching in the home directory
2. Example: fs_search_files with path="/Users/minseocha" and pattern="transkeyServlet.*"
3. This searches ALL subdirectories efficiently without listing each one!

Response format (JSON):
{
  "content": "Your helpful response to the user",
  "toolCalls": [
    {
      "name": "fs_list_directory",
      "args": { "path": "/Users/minseocha/Downloads" }
    }
  ]
}

STRATEGY FOR FILE OPERATIONS:
- **ALWAYS use fs_search_files when looking for a file** - it's fast and searches recursively!
- If user says "find X file" or mentions a file name → use fs_search_files with pattern
- If user wants to browse a directory → use fs_list_directory
- If user wants to read a file → use fs_read_file (but find it first with search!)
- **If user says "download" → MULTI-STEP: 1) search for file, 2) call fs_download_file with found path**
- Always explain what you're doing and show the search pattern

IMPORTANT FOR DOWNLOADS:
When user asks to "download" a file:
1. If you don't know the path, call fs_search_files first
2. Once you have the path (from search results), call fs_download_file 
3. You MUST continue to the download step - don't stop after finding the file!

Examples:
1. User: "Find my PNG file" → fs_search_files(path="/Users/minseocha", pattern=".*\\.png")
2. User: "Where is transkeyServlet?" → fs_search_files(path="/Users/minseocha", pattern="transkeyServlet.*")
3. User: "Show my Downloads" → fs_list_directory(path="/Users/minseocha/Downloads")
4. User: "Download transkeyServlet.png" → FIRST fs_search_files to find it, THEN fs_download_file with the path

Be proactive and smart about finding files!`;

    // Build the full prompt with conversation history
    let prompt = systemPrompt + '\n\n';
    
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      } else if (msg.role === 'tool') {
        prompt += `Tool Results: ${msg.content}\n\n`;
      }
    }
    
    prompt += '\nRespond with a JSON object. If you have enough information, set "toolCalls" to empty array and provide final answer in "content". Otherwise, specify tools to call.';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
    }

    // Fallback: return the text as content
    return NextResponse.json({
      content: text,
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
