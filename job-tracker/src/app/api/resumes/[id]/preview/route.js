import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/resumes/${id}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch resume' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('content-type');
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': response.headers.get('content-disposition'),
      },
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}