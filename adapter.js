/**
 * Adapter to convert Vercel-style handlers (Node.js req/res)
 * to Cloudflare Workers style (Request/Response)
 */

/**
 * Creates a mock Vercel-style request object from a Cloudflare Request
 */
async function createVercelRequest(request) {
  const url = new URL(request.url);
  
  let body = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      try {
        body = await request.text();
      } catch (e) {
        body = null;
      }
    }
  }

  return {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    body: body,
    query: Object.fromEntries(url.searchParams)
  };
}

/**
 * Creates a mock Vercel-style response object
 */
function createVercelResponse() {
  let statusCode = 200;
  let headers = {};
  let responseBody = null;
  let ended = false;

  return {
    status: function(code) {
      statusCode = code;
      return this;
    },
    setHeader: function(key, value) {
      headers[key] = value;
      return this;
    },
    json: function(data) {
      responseBody = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      ended = true;
      return this;
    },
    send: function(data) {
      responseBody = data;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = typeof data === 'string' ? 'text/html' : 'application/json';
      }
      ended = true;
      return this;
    },
    end: function(data) {
      if (data) {
        responseBody = data;
      }
      ended = true;
      return this;
    },
    writeHead: function(code, headersObj) {
      statusCode = code;
      if (headersObj) {
        headers = { ...headers, ...headersObj };
      }
      return this;
    },
    getStatusCode: function() {
      return statusCode;
    },
    getHeaders: function() {
      return headers;
    },
    getBody: function() {
      return responseBody;
    },
    isEnded: function() {
      return ended;
    }
  };
}

/**
 * Adapts a Vercel-style handler to work with Cloudflare Workers
 */
export async function adaptVercelHandler(handler, request, env) {
  // Make environment variables available as process.env
  global.process = global.process || {};
  global.process.env = global.process.env || {};
  
  // Map Cloudflare env to process.env
  if (env) {
    Object.keys(env).forEach(key => {
      global.process.env[key] = env[key];
    });
  }

  const req = await createVercelRequest(request);
  const res = createVercelResponse();

  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const headers = res.getHeaders();
  const body = res.getBody();
  const status = res.getStatusCode();

  return new Response(body, {
    status: status,
    headers: headers
  });
}
