import { Buffer } from 'node:buffer'
import { config } from '../../backend/config.js'
import { getEnvironmentData } from '../../backend/services/environmentService.js'
import { getRecommendations, streamEcoAssistant } from '../../backend/services/ecoAssistant.js'

class RequestValidationError extends Error {}

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' }
  }

  const route = event.queryStringParameters?.route
  try {
    if (route === 'environment') return await handleEnvironment(event)
    if (route === 'assistant' || route === 'recommendations') return await handleAssistant(event, route)
    return jsonResponse(404, { error: 'Not found' }, event)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse(400, { error: 'Request body must be valid JSON' }, event)
    }
    if (error instanceof RangeError) {
      return jsonResponse(413, { error: error.message }, event)
    }
    if (error instanceof RequestValidationError) {
      return jsonResponse(400, { error: error.message }, event)
    }

    console.error('EcoGuard API request failed:', error)
    return jsonResponse(error.statusCode || 502, { error: publicAssistantError(error) }, event)
  }
}

async function handleEnvironment(event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' }, event, { Allow: 'GET, OPTIONS' })
  }

  const query = event.queryStringParameters || {}
  const hasLatitude = Object.hasOwn(query, 'latitude')
  const hasLongitude = Object.hasOwn(query, 'longitude')
  if (hasLatitude !== hasLongitude) {
    return jsonResponse(400, { error: 'latitude and longitude must be provided together' }, event)
  }

  try {
    const data = await getEnvironmentData(hasLatitude
      ? { latitude: query.latitude, longitude: query.longitude }
      : {})
    return jsonResponse(200, data, event)
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof RangeError ? error.message : 'Invalid coordinates',
    }, event)
  }
}

async function handleAssistant(event, route) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, event, { Allow: 'POST, OPTIONS' })
  }

  const body = readJsonBody(event)
  const context = body.context
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return jsonResponse(400, { error: 'A dashboard context object is required' }, event)
  }

  if (route === 'recommendations') {
    return jsonResponse(200, { recommendations: await getRecommendations(context) }, event)
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 2000) {
    return jsonResponse(400, { error: 'Message must contain 1–2000 characters' }, event)
  }
  const history = normalizeHistory(body.history)
  const frames = []
  for await (const chunk of streamEcoAssistant(message, context, history)) {
    frames.push(`data: ${JSON.stringify({ content: chunk })}\n\n`)
  }
  frames.push('event: done\ndata: {}\n\n')
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(event),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
    body: frames.join(''),
  }
}

function readJsonBody(event) {
  if (!event.body || event.body.length > 16 * 1024) {
    if (event.body && event.body.length > 16 * 1024) {
      throw new RangeError('Request body must be no larger than 16 KB')
    }
    throw new SyntaxError('Request body must be valid JSON')
  }
  const text = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body
  return JSON.parse(text)
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

function publicAssistantError(error) {
  if ([503, 504].includes(error.statusCode)) return error.message
  if (error.statusCode === 502 && error.message.startsWith('Eco AI')) return error.message
  return 'Eco AI could not answer right now. Check the server provider configuration and try again.'
}

function corsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin
  if (origin && config.corsOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    }
  }
  return {}
}

function jsonResponse(statusCode, data, event, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...corsHeaders(event), ...jsonHeaders, ...extraHeaders },
    body: JSON.stringify(data),
  }
}
