// Port of backend/server.js GET /health
// @route   GET /health
// @access  Public
// Deliberately not wrapped in withApi: the Express version has no DB or
// auth dependency, and a health check should still answer even if Mongo is
// unreachable, so it is kept as a plain, DB-free handler.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 }
  );
}
