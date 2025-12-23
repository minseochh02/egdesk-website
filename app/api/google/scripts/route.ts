import { NextRequest, NextResponse } from 'next/server';
import { getGoogleToken } from '@/lib/google-token';

// Create a new Apps Script project
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
    const { title, parentId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Script title is required' },
        { status: 400 }
      );
    }

    const requestBody: any = {
      title: title,
    };

    // If parentId is provided (e.g. spreadsheet ID), bind the script to it
    if (parentId) {
      requestBody.parentId = parentId;
    }

    const response = await fetch('https://script.googleapis.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create script project' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      scriptId: data.scriptId,
      scriptUrl: data.scriptUrl, // Note: API might not return URL directly, but we can construct it
    });
  } catch (error) {
    console.error('Error creating script project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update Apps Script content
export async function PUT(request: NextRequest) {
  try {
    const token = await getGoogleToken();

    if (!token) {
      return NextResponse.json(
        { error: 'No Google OAuth token found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scriptId, files } = body;

    if (!scriptId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'scriptId and files array are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: files,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to update script content' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      scriptId: data.scriptId,
    });
  } catch (error) {
    console.error('Error updating script content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
