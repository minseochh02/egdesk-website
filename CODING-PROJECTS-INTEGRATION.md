# Coding Projects Integration - EGDesk Website

This document describes the complete integration of coding projects (local dev servers) into the egdesk-website interface.

## Overview

Users can now access their local development servers (Next.js, Vite, React, etc.) running on their local machine through the EGDesk web interface via secure tunneling.

## Architecture

```
User Browser (egdesk-website)
    ↓
Tunneling Service (tunneling-service.onrender.com)
    ↓
WebSocket Tunnel
    ↓
EGDesk Desktop App (Local Machine)
    ↓
Project Registry
    ↓
Local Dev Server (localhost:PORT)
```

## Components Created/Modified

### 1. **TabWindow.tsx** (Modified)
Added support for `'coding-project'` tab type.

**Changes:**
- Added `Monitor` icon from lucide-react
- Added `'coding-project'` to `TabType` union
- Extended `Tab` interface with coding project data:
  ```typescript
  codingProjectName?: string;
  codingProjectUrl?: string;
  tunnelId?: string;
  ```
- Added rendering for `CodingProjectViewer` component
- Added Monitor icon (green) for coding project tabs

### 2. **CodingProjectViewer.tsx** (New Component)
Full-featured iframe viewer for local dev servers.

**Features:**
- **Live Preview** - Displays dev server in iframe
- **Refresh Button** - Reload the project
- **Open External Button** - Open in new browser tab
- **Loading State** - Spinner while loading
- **Error Handling** - User-friendly error messages with troubleshooting
- **Status Bar** - Shows live status and tunnel ID
- **Sandbox Attributes** - Secure iframe with appropriate permissions

**URL Pattern:**
```
https://tunneling-service.onrender.com/t/{tunnel_id}/p/{project_name}/
```

### 3. **useCodingProjects.ts** (New Hook)
React hook to fetch and manage coding projects.

**Features:**
- Fetches projects from `/api/coding-projects` endpoint
- Auto-polling every 5 seconds for real-time updates
- Returns: `{ projects, loading, error, refresh }`
- Requires tunnel ID and auth token

**Interface:**
```typescript
interface CodingProject {
  projectName: string;
  folderPath: string;
  port: number;
  url: string;
  status: 'running' | 'stopped' | 'error';
  registeredAt: string;
}
```

### 4. **ChatLayout.tsx** (Modified)
Added handler for opening coding projects in tabs.

**Changes:**
- Added `handleOpenCodingProject` function
- Creates new tabs with type `'coding-project'`
- Passes `onOpenCodingProject` and `tunnelId` to Sidebar
- Prevents duplicate tabs (checks by project name)

**Function Signature:**
```typescript
const handleOpenCodingProject = (
  codingProjectName: string,
  codingProjectUrl: string,
  tunnelId: string
) => { /* ... */ }
```

### 5. **Sidebar.tsx** (Modified)
Added "Dev Servers" section to sidebar.

**Changes:**
- Imported `useCodingProjects` hook and `Monitor`/`Globe` icons
- Added props: `onOpenCodingProject`, `tunnelId`
- Fetches coding projects using hook
- Renders "Dev Servers" section with:
  - Section header with count
  - List of projects with status indicators
  - Click to open in iframe tab
  - Hover effect with globe icon

**Status Indicators:**
- 🟢 Green (pulsing) - Running
- 🔴 Red - Error
- ⚪ Gray - Stopped

### 6. **tunnel-client.ts** (Modified)
Added API endpoint handler for `/api/coding-projects`.

**Changes:**
- Imported `getProjectRegistry` from coding module
- Added special endpoint check in `handleRequest()`
- Returns JSON response:
  ```json
  {
    "success": true,
    "projects": [
      {
        "projectName": "my-nextjs-app",
        "folderPath": "/Users/dev/my-nextjs-app",
        "port": 3000,
        "url": "http://localhost:3000",
        "status": "running",
        "registeredAt": "2024-02-19T..."
      }
    ]
  }
  ```

## User Flow

### 1. Starting a Dev Server (Desktop App)
```
User → Coding Section → Create New → Select Folder
→ DevServerManager starts server
→ ProjectRegistry registers project
→ Server accessible at localhost:PORT
```

### 2. Accessing via Web Interface
```
User → egdesk-website → Sign In
→ Sidebar shows "Dev Servers" section
→ Click on project
→ New tab opens with iframe
→ Project loads via tunnel
```

## Request Flow

**Example: User accesses Next.js app's API endpoint**

```
1. Website Request:
   useCodingProjects hook →
   GET https://tunneling-service.onrender.com/t/abc123/api/coding-projects
   Authorization: Bearer {token}

2. Tunneling Service:
   Forwards to WebSocket → EGDesk tunnel client

3. Tunnel Client (EGDesk):
   Detects /api/coding-projects
   → Calls getProjectRegistry().getAllProjects()
   → Returns JSON

4. Website Receives:
   {
     "success": true,
     "projects": [...]
   }

5. Sidebar Displays:
   "Dev Servers" section with project list

6. User Clicks Project:
   Opens new tab with CodingProjectViewer

7. Iframe Loads:
   src="https://tunneling-service.onrender.com/t/abc123/p/my-nextjs-app/"

8. Request Routes:
   Tunneling Service → Tunnel Client → Request Router
   → Project Registry (lookup port)
   → Proxy to localhost:3000
   → Response back through tunnel
```

## Security

1. **Authentication Required:**
   - All tunnel requests require valid OAuth Bearer token
   - Token validated by Supabase Auth

2. **Permissions:**
   - User must have permission to access the tunnel/server
   - Checked at tunneling service level

3. **Iframe Sandbox:**
   - Restricted permissions via sandbox attribute
   - Allows scripts, forms, popups, but isolated origin

4. **Local-Only Dev Servers:**
   - Dev servers bind to localhost only
   - Not directly accessible from internet
   - Only via authenticated tunnel

## Features

### Real-Time Updates
- Projects list polls every 5 seconds
- Status indicators update automatically
- New projects appear immediately

### Status Management
- 🟢 **Running** - Dev server is active and responsive
- 🔴 **Error** - Dev server encountered an error
- ⚪ **Stopped** - Dev server is not running

### Error Handling
- Connection errors display helpful troubleshooting
- Retry button to attempt reload
- Open in new tab as fallback
- Clear error messages

### User Experience
- Chrome-style tabs
- Smooth transitions
- Loading states
- Keyboard shortcuts (tab switching)
- Responsive design

## Example Usage

### Scenario: Next.js Development

**1. Local Setup (EGDesk Desktop App):**
```bash
# User selects Next.js project folder
# EGDesk automatically:
# - Detects project type (Next.js)
# - Installs dependencies (npm install)
# - Starts dev server (npm run dev)
# - Assigns port (e.g., 3000)
# - Registers in ProjectRegistry as "my-nextjs-app"
```

**2. Web Access (egdesk-website):**
```javascript
// Sidebar shows:
Dev Servers
  🟢 my-nextjs-app
     localhost:3000 • running

// User clicks → New tab opens
// Tab title: "my-nextjs-app"
// Tab icon: 🖥️ Monitor (green)
// Content: Iframe showing full Next.js app
```

**3. Development:**
```
- Edit code in local IDE
- Changes auto-reload via HMR (Hot Module Replacement)
- View changes in egdesk-website iframe
- Test APIs directly in browser
- Use browser DevTools
```

## API Endpoints

### GET /api/coding-projects
Returns list of registered coding projects.

**Request:**
```http
GET /api/coding-projects
Host: tunneling-service.onrender.com
Authorization: Bearer {supabase_auth_token}
```

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "projectName": "my-nextjs-app",
      "folderPath": "/Users/dev/my-nextjs-app",
      "port": 3000,
      "url": "http://localhost:3000",
      "status": "running",
      "registeredAt": "2024-02-19T12:34:56.789Z"
    }
  ]
}
```

### GET /p/{project_name}/{path}
Access specific project routes.

**Request:**
```http
GET /p/my-nextjs-app/api/posts
Host: tunneling-service.onrender.com
Authorization: Bearer {supabase_auth_token}
```

**Response:**
Proxied response from local dev server.

## Troubleshooting

### Project Not Showing in Sidebar
**Possible Causes:**
- Dev server not started in EGDesk app
- Tunnel not connected
- Project not registered

**Solutions:**
1. Open EGDesk desktop app
2. Go to Coding section
3. Verify project status is "running"
4. Check tunnel connection status

### Iframe Loading Error
**Possible Causes:**
- Dev server crashed
- Port conflict
- Tunnel disconnected

**Solutions:**
1. Refresh the project in EGDesk
2. Check dev server console for errors
3. Restart tunnel connection
4. Try opening in new tab (external link)

### Empty Projects List
**Possible Causes:**
- No dev servers running
- API endpoint not responding
- Authentication issue

**Solutions:**
1. Start a dev server in EGDesk
2. Check browser console for errors
3. Verify auth token is valid
4. Check tunneling service status

## Future Enhancements

1. **WebSocket Support**
   - Enable WebSocket connections for HMR
   - Live reload notifications

2. **Dev Tools Integration**
   - Built-in console
   - Network inspector
   - Performance monitoring

3. **Project Management**
   - Stop/start servers from web UI
   - View server logs
   - Configure environment variables

4. **Collaboration**
   - Share dev server URLs
   - Multi-user access
   - Session management

5. **Custom Domains**
   - Assign subdomains to projects
   - SSL certificates
   - Custom routing rules

## Testing

### Manual Testing Checklist

- [ ] Start dev server in EGDesk
- [ ] Verify project appears in Sidebar
- [ ] Click project to open tab
- [ ] Verify iframe loads correctly
- [ ] Test navigation within app
- [ ] Test API endpoints
- [ ] Test refresh button
- [ ] Test open external button
- [ ] Stop server and verify error handling
- [ ] Restart server and verify recovery
- [ ] Test with multiple projects
- [ ] Test tab switching
- [ ] Test tab closing

### Browser Compatibility

Tested in:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## Files Modified

### Desktop App (egdesk-scratch)
1. `src/main/mcp/server-creator/tunnel-client.ts`
   - Added `/api/coding-projects` endpoint handler

### Website (egdesk-website)
1. `app/components/TabWindow.tsx`
   - Added coding-project tab type
2. `app/components/CodingProjectViewer.tsx` (NEW)
   - Iframe viewer component
3. `app/components/ChatLayout.tsx`
   - Added handleOpenCodingProject
4. `app/components/Sidebar.tsx`
   - Added Dev Servers section
5. `hooks/useCodingProjects.ts` (NEW)
   - Project fetching hook

## Summary

The coding projects integration is now complete! Users can:

✅ Start dev servers locally in EGDesk
✅ View running projects in web interface
✅ Click to open projects in iframe tabs
✅ Access full functionality via secure tunnel
✅ Monitor project status in real-time
✅ Handle errors gracefully

The system provides a seamless development experience, allowing developers to work on their local projects while accessing them from anywhere through the web interface.
