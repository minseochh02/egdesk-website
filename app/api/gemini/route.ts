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

    const systemPrompt = `You are an AI assistant that helps users interact with various MCP (Model Context Protocol) services and tools.

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
- To save attached files, call fs_upload_file with just the filename - the system will automatically use the attached file's content
- Respond naturally based on what the user asks - don't always ask "what would you like to do" unless it's unclear

FILESYSTEM TOOLS STRATEGY:
- When users mention files without full paths, use fs_search_files to find them
- Common file locations on macOS: ~/Downloads, ~/Desktop, ~/Documents, ~/Pictures, ~/Home
- Example: User mentions "report.pdf" → fs_search_files(path="/Users/minseocha", pattern="report.*\\.pdf")
- For downloads: FIRST search for the file, THEN call fs_download_file with the found path

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

Response format (JSON):
{
  "content": "Your helpful response to the user",
  "toolCalls": [
    {
      "name": "tool_name",
      "args": { "param1": "value1", "param2": "value2" }
    }
  ]
}

Be intelligent and use the right tools from the right services!`;

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

    console.log('🤖 Sending to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Gemini response received:', text.substring(0, 200) + '...');

    // Try to parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('📤 Returning parsed response with', parsed.toolCalls?.length || 0, 'tool calls');
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
