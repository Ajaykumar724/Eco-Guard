import { createServer } from 'node:http'
import { config } from './config.js'
import { getEnvironmentData } from './services/environmentService.js'

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  const origin = request.headers.origin

  if (origin && config.corsOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }

  if (requestUrl.pathname !== '/api/environment') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

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
})

server.listen(config.port, () => {
  console.log(`EcoGuard API listening on http://localhost:${config.port}`)
})

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(data))
}