import { NextRequest, NextResponse } from 'next/server';
import { getGoogleToken } from '@/lib/google-token';

export async function POST(request: NextRequest) {
  try {
    const token = await getGoogleToken();

    if (!token) {
      return NextResponse.json(
        { error: 'No Google OAuth token found. Please sign in with Google.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, scriptTitle, initialFiles } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Spreadsheet title is required' },
        { status: 400 }
      );
    }

    // 1. Create Spreadsheet
    console.log('Creating spreadsheet:', title);
    const sheetResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
      }),
    });

    if (!sheetResponse.ok) {
      const errorData = await sheetResponse.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create spreadsheet' },
        { status: sheetResponse.status }
      );
    }

    const sheetData = await sheetResponse.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // 2. Create Bound Apps Script Project
    console.log('Creating bound script for spreadsheet:', spreadsheetId);
    const scriptResponse = await fetch('https://script.googleapis.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: scriptTitle || `${title} Script`,
        parentId: spreadsheetId,
      }),
    });

    if (!scriptResponse.ok) {
      // If script creation fails, we still return the spreadsheet but with an error about the script
      const errorData = await scriptResponse.json();
      return NextResponse.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        scriptError: errorData.error?.message || 'Failed to create bound script',
      });
    }

    const scriptData = await scriptResponse.json();
    const scriptId = scriptData.scriptId;
    const scriptUrl = `https://script.google.com/d/${scriptId}/edit`;

    // 3. Update Script Content (if provided)
    if (initialFiles && Array.isArray(initialFiles) && initialFiles.length > 0) {
      console.log('Updating initial script content for:', scriptId);
      const contentResponse = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: initialFiles,
        }),
      });
      
      if (!contentResponse.ok) {
         console.warn('Failed to populate initial script content');
      }
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      scriptId,
      scriptUrl,
    });
  } catch (error) {
    console.error('Error creating spreadsheet with script:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
