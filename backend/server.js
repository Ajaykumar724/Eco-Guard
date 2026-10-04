import { createServer } from 'node:http'
import { Buffer } from 'node:buffer'
import { config } from './config.js'
import { getEnvironmentData } from './services/environmentService.js'

class RequestValidationError extends Error {}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  const origin = request.headers.origin

  if (origin && config.corsOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }

  if (requestUrl.pathname === '/api/environment') {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET, OPTIONS')
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    const hasLatitude = requestUrl.searchParams.has('latitude')
    const hasLongitude = requestUrl.searchParams.has('longitude')
    if (hasLatitude !== hasLongitude) {
      sendJson(response, 400, { error: 'latitude and longitude must be provided together' })
      return
    }

    try {
      const data = await getEnvironmentData(hasLatitude ? {
        latitude: requestUrl.searchParams.get('latitude'),
        longitude: requestUrl.searchParams.get('longitude'),
      } : {})
      sendJson(response, 200, data)
    } catch (error) {
      sendJson(response, 400, { error: error instanceof RangeError ? error.message : 'Invalid coordinates' })
    }
    return
  }

  if (requestUrl.pathname === '/api/assistant' || requestUrl.pathname === '/api/recommendations') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST, OPTIONS')
      sendJson(response, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const body = await readJsonBody(request)
      const { streamEcoAssistant, getRecommendations } = await import('./services/ecoAssistant.js')
      const context = body.context
      if (!context || typeof context !== 'object' || Array.isArray(context)) {
        sendJson(response, 400, { error: 'A dashboard context object is required' })
        return
      }

      if (requestUrl.pathname === '/api/recommendations') {
        sendJson(response, 200, { recommendations: await getRecommendations(context) })
        return
      }

      const message = typeof body.message === 'string' ? body.message.trim() : ''
      if (!message || message.length > 2000) {
        sendJson(response, 400, { error: 'Message must contain 1–2000 characters' })
        return
      }
      const history = normalizeHistory(body.history)
      const controller = new AbortController()
      response.on('close', () => {
        if (!response.writableEnded) controller.abort()
      })
      response.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      for await (const chunk of streamEcoAssistant(message, context, history, controller.signal)) {
        if (!response.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)) {
          await new Promise((resolve) => response.once('drain', resolve))
        }
      }
      response.write('event: done\ndata: {}\n\n')
      response.end()
    } catch (error) {
      if (response.headersSent) {
        if (!response.destroyed) {
          console.error('Eco AI stream failed:', error)
          response.write(`event: error\ndata: ${JSON.stringify({ error: publicAssistantError(error) })}\n\n`)
          response.end()
        }
        return
      }
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: 'Request body must be valid JSON' })
      } else if (error instanceof RangeError) {
        sendJson(response, 413, { error: error.message })
      } else if (error instanceof RequestValidationError) {
        sendJson(response, 400, { error: error.message })
      } else {
        console.error('Eco AI request failed:', error)
        sendJson(response, error.statusCode || 502, {
          error: publicAssistantError(error),
        })
      }
    }
    return
  }

  sendJson(response, 404, { error: 'Not found' })
})

server.listen(config.port, () => {
  console.log(`EcoGuard API listening on http://localhost:${config.port}`)
})

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(data))
}

function publicAssistantError(error) {
  if ([503, 504].includes(error.statusCode)) return error.message
  if (error.statusCode === 502 && error.message.startsWith('Eco AI')) return error.message
  return 'Eco AI could not answer right now. Check the server provider configuration and try again.'
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 16 * 1024) throw new RangeError('Request body must be no larger than 16 KB')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function normalizeHistory(history) {
  if (history === undefined) return []
  if (!Array.isArray(history) || history.length > 10) {
    throw new RequestValidationError('Conversation history must contain at most 10 messages')
  }
  return history.map((item) => {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') {
      throw new RequestValidationError('Conversation history contains an invalid message')
    }
    return { role: item.role, content: item.content.slice(0, 1200) }
  })
}