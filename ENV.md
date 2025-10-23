# Environment Variables

Create a `.env.local` file in the root of the `egdesk-website` directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# MCP Tunnel Service
NEXT_PUBLIC_TUNNEL_SERVICE_URL=https://tunneling-service.onrender.com
NEXT_PUBLIC_MCP_SERVER_KEY=your-mcp-server-key

# Gemini AI (for AI Assistant)
GEMINI_API_KEY=your-gemini-api-key
```

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **anon/public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## MCP Server Configuration

1. `NEXT_PUBLIC_TUNNEL_SERVICE_URL` - The URL of your tunnel service (e.g., https://tunneling-service.onrender.com)
2. `NEXT_PUBLIC_MCP_SERVER_KEY` - The server_key of the MCP server you want to connect to

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

