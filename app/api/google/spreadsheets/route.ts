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
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Spreadsheet title is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create spreadsheet' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl,
    });
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

