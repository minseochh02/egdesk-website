# Delete Account Edge Function

This Supabase Edge Function handles account deletion requests from authenticated users.

## What It Does

When a user requests account deletion, this function:

1. **Verifies Authentication** - Ensures the user is signed in
2. **Deletes MCP Servers** - Removes all MCP servers owned by the user from the registry
3. **Revokes Permissions** - Deletes all permissions associated with the user's servers
4. **Removes Guest Access** - Removes any guest permissions the user had on other servers
5. **Deletes User Account** - Permanently removes the user account from Supabase Auth

## Deployment

Deploy this function using the Supabase CLI:

```bash
# Navigate to the egdesk-website directory
cd egdesk-website

# Deploy the function
supabase functions deploy delete-account

# Set required environment variables (if not already set)
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoint

**POST** `https://your-project.supabase.co/functions/v1/delete-account`

### Headers
- `Authorization: Bearer <user_access_token>` (required)
- `Content-Type: application/json`

### Request Body
None required - the function uses the authenticated user's information from the JWT token.

### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Account successfully deleted",
  "details": {
    "servers_deleted": 2,
    "user_id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error (401, 500)**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security

- Requires valid JWT authentication token
- Uses Supabase Service Role Key for admin operations
- Only the authenticated user can delete their own account
- Cascading deletion ensures all related data is removed

## Testing

You can test this function locally:

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve delete-account

# Test with curl (replace TOKEN with actual JWT)
curl -X POST http://localhost:54321/functions/v1/delete-account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Notes

- Account deletion is **permanent** and cannot be undone
- Local data on the user's PC is not affected
- The desktop application will continue to work offline
- Remote access via the web interface will no longer be available

