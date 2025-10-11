import { adaptVercelHandler } from '../adapter.js';

// Import the original Vercel handler
const originalHandler = require('../games.js');

export default async function handler(request, env) {
  return await adaptVercelHandler(originalHandler, request, env);
}
