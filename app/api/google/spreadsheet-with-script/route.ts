// egdesk-website/app/api/google/spreadsheet-with-script/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleTokens, refreshGoogleAccessToken, saveGoogleTokens } from '@/lib/google-token';

// Initialize Supabase client for use in API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get authenticated Google access token
async function getAuthenticatedGoogleAccessToken(userId: string): Promise<{
  accessToken?: string;
  error?: string;
}> {
  let { success: tokensSuccess, tokens, error: tokensError } = await getGoogleTokens(userId);

  if (!tokensSuccess || !tokens) {
    return { error: tokensError || 'Google tokens not found. Please re-authenticate with Google.' };
  }

  let currentAccessToken = tokens.access_token;
  let currentExpiresAt = new Date(tokens.expires_at);

  if (currentExpiresAt.getTime() < Date.now() + 60 * 1000) { // Refresh if less than 1 minute to expiry
    if (!tokens.refresh_token) {
      return { error: 'Google refresh token not found. Please re-authenticate with Google.' };
    }

    const { success: refreshSuccess, newAccessToken, error: refreshError } = await refreshGoogleAccessToken(userId, tokens.refresh_token);

    if (!refreshSuccess || !newAccessToken) {
      return { error: refreshError || 'Failed to refresh Google access token. Please re-authenticate.' };
    }
    currentAccessToken = newAccessToken;
  }
  return { accessToken: currentAccessToken };
}

export async function POST(request: NextRequest) {
  const { spreadsheetTitle, scriptTitle, initialScriptContent } = await request.json();

  // 1. Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Authentication error:', authError?.message);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 2. Get authenticated Google access token
  const { accessToken, error: tokenError } = await getAuthenticatedGoogleAccessToken(userId);
  if (tokenError) {
    return NextResponse.json({ success: false, error: tokenError }, { status: 403 });
  }

  let spreadsheetId: string | undefined;
  let spreadsheetUrl: string | undefined;
  let scriptId: string | undefined;

  try {
    // A. Create the Spreadsheet first
    const createSpreadsheetResponse = await fetch(`${request.nextUrl.origin}/api/google/spreadsheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: spreadsheetTitle }),
    });

    if (!createSpreadsheetResponse.ok) {
      const errorData = await createSpreadsheetResponse.json();
      console.error('Error creating spreadsheet:', errorData);
      throw new Error(errorData.error || 'Failed to create spreadsheet');
    }

    const spreadsheetResult = await createSpreadsheetResponse.json();
    spreadsheetId = spreadsheetResult.spreadsheetId;
    spreadsheetUrl = spreadsheetResult.spreadsheetUrl;
    console.log(`✅ Spreadsheet created: ${spreadsheetId}`);

    // B. Create the Apps Script project and bind it to the spreadsheet
    const createScriptResponse = await fetch(`${request.nextUrl.origin}/api/google/scripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: scriptTitle || `${spreadsheetTitle} Script`,
        spreadsheetId: spreadsheetId,
      }),
    });

    if (!createScriptResponse.ok) {
      const errorData = await createScriptResponse.json();
      console.error('Error creating Apps Script project:', errorData);
      throw new Error(errorData.error || 'Failed to create Apps Script project');
    }

    const scriptResult = await createScriptResponse.json();
    scriptId = scriptResult.scriptId;
    console.log(`✅ Apps Script project created and bound to spreadsheet: ${scriptId}`);

    // C. (Optional) Write initial content to the Apps Script project
    if (initialScriptContent && scriptId) {
      const writeScriptContentResponse = await fetch(`${request.nextUrl.origin}/api/google/scripts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptId: scriptId,
          fileName: 'Code.gs',
          content: initialScriptContent,
        }),
      });

      if (!writeScriptContentResponse.ok) {
        const errorData = await writeScriptContentResponse.json();
        console.error('Error writing initial script content:', errorData);
        // Continue even if writing initial content fails, as project is still created
      }
      console.log(`✅ Initial script content written to Code.gs for project: ${scriptId}`);
    }

    return NextResponse.json(
      { success: true, spreadsheetId, spreadsheetUrl, scriptId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Exception in creating spreadsheet with script:', error.message);
    // Implement rollback logic here if necessary (e.g., delete created spreadsheet/script if one step fails after another)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create spreadsheet with script' }, { status: 500 });
  }
}

