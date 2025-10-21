import { sql } from 'bun'

// Initialize database table
let dbInitialized = false
async function initializeDB() {
  if (!dbInitialized) {
    await sql`
      CREATE TABLE IF NOT EXISTS groceries (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    dbInitialized = true
    console.log('Database initialized')
  }
}

const server = Bun.serve({
  port: process.env.PORT || 3000,
  hostname: '0.0.0.0',
  async fetch(req) {
    // Ensure database is initialized on first request
    await initializeDB()

    const url = new URL(req.url)

    // Serve the HTML form
    if (url.pathname === '/' && req.method === 'GET') {
      const groceries =
        await sql`SELECT * FROM groceries ORDER BY created_at DESC`

      const groceryList = groceries
        .map(
          (g) =>
            `<li>${g.item} <form method="POST" action="/delete/${g.id}" style="display:inline"><button>Delete</button></form></li>`
        )
        .join('')

      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Grocery List</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            input, button { padding: 10px; margin: 5px 0; }
            input { width: 300px; }
            ul { list-style: none; padding: 0; }
            li { padding: 10px; margin: 5px 0; background: #f0f0f0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Grocery List</h1>
          <form method="POST" action="/add">
            <input type="text" name="item" placeholder="Enter grocery item" required />
            <button type="submit">Add Item</button>
          </form>
          <h2>Your Groceries:</h2>
          <ul>${groceryList || '<li>No items yet!</li>'}</ul>
        </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }

    // Add new grocery item
    if (url.pathname === '/add' && req.method === 'POST') {
      const formData = await req.formData()
      const item = formData.get('item')

      if (item) {
        await sql`INSERT INTO groceries (item) VALUES (${item})`
      }

      return Response.redirect(url.origin, 303)
    }

    // Delete grocery item
    if (url.pathname.startsWith('/delete/') && req.method === 'POST') {
      const id = url.pathname.split('/')[2]
      await sql`DELETE FROM groceries WHERE id = ${id}`
      return Response.redirect(url.origin, 303)
    }

    // Health check
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
