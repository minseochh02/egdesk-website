import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session or user object
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized',
          message: 'You must be signed in to delete your account'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Use Admin Client for privileged operations
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🗑️ Starting account deletion for user: ${user.id} (${user.email})`)

    // Step 1: Get all MCP servers owned by this user
    const { data: userServers, error: serversError } = await supabaseAdminClient
      .from('mcp_servers')
      .select('id, server_key, name')
      .eq('owner_user_id', user.id)

    if (serversError) {
      console.error('Error fetching user servers:', serversError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error',
          message: 'Failed to fetch your MCP servers'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const serverIds = userServers?.map(s => s.id) || []
    console.log(`📊 Found ${serverIds.length} MCP servers to delete`)

    // Step 2: Delete all permissions for these servers
    if (serverIds.length > 0) {
      const { error: permissionsError } = await supabaseAdminClient
        .from('mcp_server_permissions')
        .delete()
        .in('server_id', serverIds)

      if (permissionsError) {
        console.error('Error deleting permissions:', permissionsError)
        // Continue anyway - we still want to delete servers
      } else {
        console.log(`✅ Deleted all permissions for user's MCP servers`)
      }

      // Step 3: Delete all MCP servers owned by the user
      const { error: deleteServersError } = await supabaseAdminClient
        .from('mcp_servers')
        .delete()
        .eq('owner_user_id', user.id)

      if (deleteServersError) {
        console.error('Error deleting MCP servers:', deleteServersError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database error',
            message: 'Failed to delete your MCP servers'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.log(`✅ Deleted ${serverIds.length} MCP servers`)
    }

    // Step 4: Delete permissions where user is a guest (not owner)
    const { error: guestPermissionsError } = await supabaseAdminClient
      .from('mcp_server_permissions')
      .delete()
      .eq('user_email', user.email)

    if (guestPermissionsError) {
      console.error('Error deleting guest permissions:', guestPermissionsError)
      // Continue anyway
    } else {
      console.log(`✅ Deleted guest permissions for user`)
    }

    // Step 5: Delete the user account using Admin Client
    const { error: deleteUserError } = await supabaseAdminClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Account deletion failed',
          message: 'Failed to delete your account. Please contact support.',
          details: deleteUserError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`✅ Successfully deleted user account: ${user.id}`)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account successfully deleted',
        details: {
          servers_deleted: serverIds.length,
          user_id: user.id,
          email: user.email
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error during account deletion:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

