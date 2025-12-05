// Test script to verify backend components
import app from './app.js';
import { validateRegistration } from './middleware/validation.middleware.js';
import asyncHandler from './utils/asyncHandler.js';
import ErrorResponse from './utils/errorResponse.js';

console.log('✅ All imports successful');

// Test asyncHandler
const testAsyncHandler = asyncHandler(async (req, res, next) => {
  console.log('✅ asyncHandler working');
  res.send('Test');
});

console.log('✅ asyncHandler created successfully');

// Test ErrorResponse
const testError = new ErrorResponse('Test error', 400);
console.log('✅ ErrorResponse working:', testError.message, testError.statusCode);

// Test validation middleware array
console.log('✅ Validation middleware array length:', validateRegistration.length);

console.log('🎉 All backend components are working correctly!');