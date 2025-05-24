// src/app/api/resumes/[id]/preview/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { id } = params;
  
  try {
    // Get token from cookies or headers
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the backend API URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/resumes/${id}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch resume' }));
      return new NextResponse(JSON.stringify(errorData), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the file data as a stream
    const fileBuffer = await response.arrayBuffer();
    
    // Get headers from backend response
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    // Create response with proper headers for inline display
    const headers = new Headers();
    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // Add CORS headers for iframe embedding
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error in preview route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}