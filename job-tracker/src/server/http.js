import { NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import logger from '@/server/logger';

// Thrown by server code (auth.js, route handlers, etc.) to short-circuit
// withApi with a specific HTTP status + message.
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Replicates backend/middleware/error.js's error -> JSON mapping exactly.
export function jsonError(err) {
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return NextResponse.json(
      { success: false, error: 'Resource not found' },
      { status: 404 }
    );
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    return NextResponse.json(
      {
        success: false,
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use`,
      },
      { status: 400 }
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return NextResponse.json(
      { success: false, error: message.join(', ') },
      { status: 400 }
    );
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return NextResponse.json(
      { success: false, error: 'Invalid token. Please log in again.' },
      { status: 401 }
    );
  }

  // JWT Expired
  if (err.name === 'TokenExpiredError') {
    return NextResponse.json(
      { success: false, error: 'Your token has expired. Please log in again.' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { success: false, error: err.message || 'Server Error' },
    { status: err.statusCode || 500 }
  );
}

// Wraps an App Router route handler: connects to the DB, then maps any
// thrown error (including ApiError) to the JSON shape above.
export function withApi(handler) {
  return async (request, context) => {
    try {
      await connectDB();
      return await handler(request, context);
    } catch (err) {
      return jsonError(err);
    }
  };
}
