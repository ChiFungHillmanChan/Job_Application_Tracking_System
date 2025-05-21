// app/api/jobs/route.js
import api from '@/lib/api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await api.get(`/jobs${queryString ? `?${queryString}` : ''}`);
    
    return Response.json(response.data);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return Response.json(
      { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch jobs' 
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const jobData = await request.json();
    
    const response = await api.post('/jobs', jobData);
    
    return Response.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return Response.json(
      { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create job' 
      },
      { status: error.response?.status || 500 }
    );
  }
}