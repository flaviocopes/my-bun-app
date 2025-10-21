const server = Bun.serve({
  port: process.env.PORT || 3000,
  hostname: '0.0.0.0',
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/') {
      return Response.json({
        message: 'Hello from Railway with Bun!',
        environment: process.env.RAILWAY_ENVIRONMENT || 'local',
      })
    }

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        uptime: process.uptime(),
      })
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Server running on port ${server.port}`)
