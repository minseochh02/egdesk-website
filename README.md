# EGDesk MCP Web Client

A Next.js web application that connects to remote MCP (Model Context Protocol) servers through the EGDesk tunneling service with Supabase OAuth authentication.

## Features

- 🔐 **OAuth Authentication** - Sign in with Google or GitHub via Supabase
- 🌐 **Remote MCP Access** - Connect to MCP servers running anywhere
- 🔒 **Secure Authorization** - Email-based permission system
- 💬 **Real-time Chat** - Interactive chat interface with MCP servers
- 📁 **File Tree** - Browse and manage files
- ✅ **Connection Status** - Visual indicators for connection health

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# MCP Tunnel Service
NEXT_PUBLIC_TUNNEL_SERVICE_URL=https://tunneling-service.onrender.com
NEXT_PUBLIC_MCP_SERVER_KEY=your-mcp-server-key
```

See `ENV.md` for detailed instructions on getting these values.

### 3. Set Up Supabase OAuth

#### Enable OAuth Providers

1. Go to your Supabase dashboard → **Authentication** → **Providers**
2. Enable **Google** and/or **GitHub** providers
3. Follow the provider-specific setup instructions

#### Google OAuth Setup

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable the Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
5. Copy Client ID and Client Secret to Supabase settings

#### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth app
3. Set Authorization callback URL:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
4. Copy Client ID and Client Secret to Supabase settings

### 4. Get MCP Server Access

To connect to a remote MCP server:

1. **Ask the server owner** to add your email to their permission list
2. **Get the server_key** from the server owner
3. **Add the server_key** to your `.env.local` as `NEXT_PUBLIC_MCP_SERVER_KEY`

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

## How It Works

### Authentication Flow

1. User clicks "Sign In" and chooses OAuth provider (Google/GitHub)
2. Supabase handles OAuth flow and returns access token
3. Access token is stored in session
4. All MCP requests include `Authorization: Bearer <token>` header

### MCP Request Flow

1. User sends a message in the chat
2. App sends authenticated POST request to:
   ```
   https://tunnel-service.com/t/[server_key]/process
   ```
3. Tunnel service:
   - Verifies OAuth token with Supabase
   - Extracts user email from token
   - Checks permission list for this email
   - Forwards request to MCP server if authorized
4. Response is sent back through the tunnel

### Authorization

The tunnel service checks:
- ✅ Valid Supabase access token
- ✅ User email is in server's permission list
- ✅ Permission status is `active` (not revoked or expired)
- ✅ Permission hasn't expired (if expiration date set)

## Project Structure

```
egdesk-website/
├── app/
│   ├── auth/
│   │   └── callback/         # OAuth callback handler
│   ├── components/
│   │   ├── AuthButton.tsx    # Login/logout UI (in header)
│   │   ├── SignInPage.tsx    # Dedicated sign-in page
│   │   ├── ChatLayout.tsx    # Layout with auth guard
│   │   ├── ChatArea.tsx      # Main chat interface
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── TabWindow.tsx     # Tab management
│   │   └── FileTree.tsx      # File browser
│   ├── layout.tsx            # Root layout with AuthProvider
│   └── page.tsx              # Home page
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   └── supabase.ts           # Supabase client
├── ENV.md                    # Environment variable guide
└── README.md                 # This file
```

## Usage

### Sign In

When you first visit the app, you'll see a dedicated sign-in page:

1. Click either "Continue with Google" or "Continue with GitHub"
2. You'll be redirected to the OAuth provider
3. Authorize the application
4. You'll be redirected back and automatically signed in
5. The chat interface will appear

The app remembers your session, so you won't need to sign in again until you sign out or your session expires.

### Send Messages

1. After signing in, type your message in the input field
2. Press Enter or click Send
3. The message will be sent to the MCP server
4. The response will appear in the chat

### Connection Status

- 🟢 **Connected** - Successfully authenticated and connected to MCP server
- 🔴 **Error** - Failed to connect or permission denied
- ⚫ **Not Connected** - Not signed in

## Error Handling

Common errors and solutions:

### 401 Unauthorized
- **Cause**: Invalid or expired access token
- **Solution**: Sign out and sign in again

### 403 Forbidden
- **Cause**: Your email is not in the server's permission list
- **Solution**: Ask the server owner to add your email

### 403 Access Revoked
- **Cause**: Server owner revoked your access
- **Solution**: Contact the server owner

### 403 Access Expired
- **Cause**: Your access permission has expired
- **Solution**: Ask the server owner to extend your access

### 404 Server Not Found
- **Cause**: Invalid `MCP_SERVER_KEY` or server is offline
- **Solution**: Check your `.env.local` and verify server is running

## Development

### Adding New Features

1. Create new components in `app/components/`
2. Use the `useAuth` hook to access authentication state
3. Use `session?.access_token` for authenticated requests

### Example: Authenticated Request

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { session } = useAuth();

  const makeRequest = async () => {
    const response = await fetch(
      `${TUNNEL_SERVICE_URL}/t/${MCP_SERVER_KEY}/endpoint`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return data;
  };
}
```

## Security

- ✅ OAuth tokens are never stored in localStorage
- ✅ Tokens are session-only (cleared on browser close)
- ✅ All MCP requests require authentication
- ✅ Email-based permission system
- ✅ Server owners control access via EGDesk desktop app

## Troubleshooting

### OAuth Not Working

1. Check Supabase project URL and anon key in `.env.local`
2. Verify OAuth providers are enabled in Supabase dashboard
3. Check browser console for errors

### MCP Requests Failing

1. Verify `NEXT_PUBLIC_TUNNEL_SERVICE_URL` is correct
2. Check `NEXT_PUBLIC_MCP_SERVER_KEY` matches server
3. Ensure your email is in the server's permission list
4. Check browser console and network tab for detailed errors

### Development Server Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review MCP-AUTHORIZATION-SYSTEM.md for architecture details
3. Contact the server owner for permission-related issues
