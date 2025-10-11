import { adaptVercelHandler } from '../adapter.js';

// Import the original Vercel handler - Note: squares.js uses ES6 export default
// We need to handle this differently
const squaresModule = require('../squares.js');
const originalHandler = squaresModule.default || squaresModule;

export default async function handler(request, env) {
  return await adaptVercelHandler(originalHandler, request, env);
}
