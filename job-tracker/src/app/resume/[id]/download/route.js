// src/app/api/resumes/[id]/download/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { id } = params;
  
  try {
    // Get token from multiple sources
    const cookieStore = cookies();
    let token = cookieStore.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

    // If no token in cookies/headers, try to get from localStorage via client-side
    if (!token) {
      // For client-side requests, check if we can get token from request URL params
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      console.log('No token found in download route');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the backend API URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/resumes/${id}/download`, {
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

    // Create response with proper headers
    const headers = new Headers();
    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'no-cache');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error in download route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}