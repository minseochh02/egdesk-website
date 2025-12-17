// egdesk-website/app/api/google/scripts/route.ts

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

// POST handler for creating a new Apps Script project
export async function POST(request: NextRequest) {
  const { title, parentId, spreadsheetId } = await request.json(); // parentId is for Drive folder, spreadsheetId for binding

  // 1. Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 2. Get authenticated Google access token
  const { accessToken, error: tokenError } = await getAuthenticatedGoogleAccessToken(userId);
  if (tokenError) {
    return NextResponse.json({ success: false, error: tokenError }, { status: 403 });
  }

  try {
    // Create a new Apps Script project
    const createResponse = await fetch('https://script.googleapis.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        // Optionally link to a spreadsheet if spreadsheetId is provided
        ...(spreadsheetId && { parentId: spreadsheetId, parentFileType: 'SPREADSHEET' }),
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Apps Script API error during project creation:', errorData);
      return NextResponse.json({ success: false, error: errorData.error?.message || 'Failed to create Apps Script project' }, { status: createResponse.status });
    }

    const projectData = await createResponse.json();
    console.log(`✅ Created Apps Script project: ${title} (ID: ${projectData.scriptId}) for user: ${userId}`);

    // If a spreadsheetId was provided, the project is already bound.
    // No need for a separate update in this endpoint for binding.

    return NextResponse.json({ success: true, scriptId: projectData.scriptId, projectData }, { status: 200 });

  } catch (error: any) {
    console.error('Exception creating Apps Script project:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating file content in an Apps Script project
export async function PUT(request: NextRequest) {
  const { scriptId, fileName, content } = await request.json();

  // 1. Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 2. Get authenticated Google access token
  const { accessToken, error: tokenError } = await getAuthenticatedGoogleAccessToken(userId);
  if (tokenError) {
    return NextResponse.json({ success: false, error: tokenError }, { status: 403 });
  }

  try {
    // First, get the current content of the project to find existing files
    const getFilesResponse = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!getFilesResponse.ok) {
      const errorData = await getFilesResponse.json();
      console.error('Apps Script API error fetching project content:', errorData);
      return NextResponse.json({ success: false, error: errorData.error?.message || 'Failed to fetch project content' }, { status: getFilesResponse.status });
    }

    const projectContent = await getFilesResponse.json();
    const existingFiles = projectContent.files || [];

    // Determine file type based on extension or existing file
    let fileType = 'CODE_JS'; // Default for .gs
    if (fileName.endsWith('.html')) {
      fileType = 'HTML';
    } else if (fileName.endsWith('.json')) {
      fileType = 'JSON'; // For appsscript.json
    } else {
      // Check if it's an existing file with a specific type
      const existingFile = existingFiles.find((f: any) => f.name === fileName);
      if (existingFile) {
        fileType = existingFile.type; // Use existing type
      } else if (fileName.endsWith('.gs')) {
        fileType = 'SERVER_JS'; // Explicitly set for new .gs files
      } else {
        fileType = 'JSON'; // Default to JSON for new manifest files, or other unknown types
      }
    }

    const updatedFiles = existingFiles.filter((f: any) => f.name !== fileName);
    updatedFiles.push({ name: fileName, type: fileType, source: content });

    // Update the project content
    const updateResponse = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: updatedFiles }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Apps Script API error during file update:', errorData);
      return NextResponse.json({ success: false, error: errorData.error?.message || 'Failed to update Apps Script file' }, { status: updateResponse.status });
    }

    console.log(`✅ Updated file ${fileName} in project ${scriptId} for user: ${userId}`);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Exception updating Apps Script file:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET handler for reading file content from an Apps Script project
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scriptId = searchParams.get('scriptId');
  const fileName = searchParams.get('fileName');

  if (!scriptId || !fileName) {
    return NextResponse.json({ success: false, error: 'scriptId and fileName are required' }, { status: 400 });
  }

  // 1. Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 2. Get authenticated Google access token
  const { accessToken, error: tokenError } = await getAuthenticatedGoogleAccessToken(userId);
  if (tokenError) {
    return NextResponse.json({ success: false, error: tokenError }, { status: 403 });
  }

  try {
    // Get the project content
    const getFilesResponse = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!getFilesResponse.ok) {
      const errorData = await getFilesResponse.json();
      console.error('Apps Script API error fetching project content for read:', errorData);
      return NextResponse.json({ success: false, error: errorData.error?.message || 'Failed to fetch project content' }, { status: getFilesResponse.status });
    }

    const projectContent = await getFilesResponse.json();
    const file = projectContent.files?.find((f: any) => f.name === fileName);

    if (!file) {
      return NextResponse.json({ success: false, error: `File ${fileName} not found in project ${scriptId}` }, { status: 404 });
    }

    console.log(`✅ Read file ${fileName} from project ${scriptId} for user: ${userId}`);

    return NextResponse.json({ success: true, content: file.source }, { status: 200 });

  } catch (error: any) {
    console.error('Exception reading Apps Script file:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
