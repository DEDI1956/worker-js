// Simple Cloudflare Worker Example
// This is a basic example of a Cloudflare Worker

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Handle different routes
  switch (url.pathname) {
    case '/':
      return new Response('Hello World from Cloudflare Worker!', {
        headers: { 'content-type': 'text/plain' }
      })
      
    case '/json':
      return new Response(JSON.stringify({
        message: 'Hello from JSON endpoint',
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url
      }), {
        headers: { 'content-type': 'application/json' }
      })
      
    case '/html':
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cloudflare Worker</title>
        </head>
        <body>
          <h1>Hello from Cloudflare Worker!</h1>
          <p>This page is served by a Cloudflare Worker.</p>
          <p>Current time: ${new Date().toISOString()}</p>
        </body>
        </html>
      `, {
        headers: { 'content-type': 'text/html' }
      })
      
    default:
      return new Response('Not Found', { status: 404 })
  }
}