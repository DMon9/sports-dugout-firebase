/**
 * Cloudflare Workers Entry Point
 * Routes requests to appropriate API handlers
 */

import { adaptVercelHandler } from './utils/adapter.js';

// Since API handlers use CommonJS, we'll import them dynamically when needed
// This allows node_compat mode to handle the require() statements properly

/**
 * Main worker fetch handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Log request
      console.log(`📨 ${request.method} ${pathname}`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
          }
        });
      }

      // Route to appropriate handler based on pathname
      // Reference the original API handlers from the /api directory
      let handlerPath = null;
      
      if (pathname === '/api' || pathname === '/api/' || pathname.startsWith('/api?')) {
        handlerPath = '../api/index.js';
      } else if (pathname.startsWith('/api/users')) {
        handlerPath = '../api/users.js';
      } else if (pathname.startsWith('/api/sports')) {
        handlerPath = '../api/sports.js';
      } else if (pathname.startsWith('/api/contest')) {
        handlerPath = '../api/contest.js';
      } else if (pathname.startsWith('/api/stats')) {
        handlerPath = '../api/stats.js';
      } else if (pathname.startsWith('/api/referral')) {
        handlerPath = '../api/referral.js';
      } else if (pathname.startsWith('/api/squares')) {
        handlerPath = '../api/squares.js';
      } else if (pathname.startsWith('/api/games')) {
        handlerPath = '../api/games.js';
      } else if (pathname.startsWith('/api/ai-predictions')) {
        handlerPath = '../api/ai-predictions.js';
      } else if (pathname.startsWith('/api/test-stripe')) {
        handlerPath = '../api/test-stripe.js';
      } else if (pathname.startsWith('/api/debug-firebase')) {
        handlerPath = '../api/debug-firebase.js';
      }

      if (handlerPath) {
        const handler = await import(handlerPath);
        return await adaptVercelHandler(handler, request, env);
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Route ${pathname} not found`,
        availableRoutes: [
          '/api',
          '/api/users',
          '/api/sports',
          '/api/contest',
          '/api/stats',
          '/api/referral',
          '/api/squares',
          '/api/games',
          '/api/ai-predictions'
        ]
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('❌ Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
