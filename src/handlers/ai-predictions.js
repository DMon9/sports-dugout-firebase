import { adaptVercelHandler } from '../adapter.js';

// Import the original Vercel handler
const originalHandler = require('../ai-predictions.js');

export default async function handler(request, env) {
  return await adaptVercelHandler(originalHandler, request, env);
}
