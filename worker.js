// Modern Cloudflare Worker using ES Modules
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle different routes
    switch (url.pathname) {
      case '/':
        return new Response('Hello World from Cloudflare Worker!', {
          headers: { 
            'content-type': 'text/plain',
            'access-control-allow-origin': '*'
          }
        });
        
      case '/json':
        return new Response(JSON.stringify({
          message: 'Hello from JSON endpoint',
          timestamp: new Date().toISOString(),
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers),
          cf: request.cf
        }), {
          headers: { 
            'content-type': 'application/json',
            'access-control-allow-origin': '*'
          }
        });
        
      case '/html':
        return new Response(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cloudflare Worker</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
              }
              .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 2rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              }
              h1 {
                text-align: center;
                margin-bottom: 2rem;
                font-size: 2.5rem;
              }
              .info {
                background: rgba(255, 255, 255, 0.1);
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
              }
              .endpoint {
                background: rgba(255, 255, 255, 0.05);
                padding: 0.5rem 1rem;
                border-radius: 5px;
                margin: 0.5rem 0;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚀 Cloudflare Worker</h1>
              <div class="info">
                <p><strong>Status:</strong> ✅ Active and running</p>
                <p><strong>Current time:</strong> ${new Date().toISOString()}</p>
                <p><strong>Location:</strong> ${request.cf?.colo || 'Unknown'}</p>
                <p><strong>Country:</strong> ${request.cf?.country || 'Unknown'}</p>
              </div>
              
              <h3>📡 Available Endpoints:</h3>
              <div class="endpoint">GET / - This HTML page</div>
              <div class="endpoint">GET /json - JSON response with request info</div>
              <div class="endpoint">GET /html - This HTML page</div>
              
              <div class="info">
                <p><strong>Powered by:</strong> Cloudflare Workers</p>
                <p><strong>Runtime:</strong> V8 JavaScript Engine</p>
              </div>
            </div>
          </body>
          </html>
        `, {
          headers: { 
            'content-type': 'text/html',
            'access-control-allow-origin': '*'
          }
        });
        
      case '/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 'Always available',
          version: '1.0.0'
        }), {
          headers: { 
            'content-type': 'application/json',
            'access-control-allow-origin': '*'
          }
        });
        
      default:
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: `The path "${url.pathname}" was not found on this worker.`,
          availableRoutes: ['/', '/json', '/html', '/health']
        }), {
          status: 404,
          headers: { 
            'content-type': 'application/json',
            'access-control-allow-origin': '*'
          }
        });
    }
  },
};