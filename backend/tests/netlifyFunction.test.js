import test from 'node:test'
import assert from 'node:assert/strict'
import { handler } from '../../netlify/functions/api.js'

test('Netlify API function handles preflight requests', async () => {
  const response = await handler({ httpMethod: 'OPTIONS', headers: {} })
  assert.equal(response.statusCode, 204)
})

test('Netlify API function rejects unsupported routes and methods', async () => {
  const missingRoute = await handler({
    httpMethod: 'GET',
    queryStringParameters: {},
    headers: {},
  })
  assert.equal(missingRoute.statusCode, 404)

  const wrongMethod = await handler({
    httpMethod: 'GET',
    queryStringParameters: { route: 'assistant' },
    headers: {},
  })
  assert.equal(wrongMethod.statusCode, 405)
  assert.equal(wrongMethod.headers.Allow, 'POST, OPTIONS')
})

test('Netlify API function validates assistant request JSON and context', async () => {
  const invalidJson = await handler({
    httpMethod: 'POST',
    queryStringParameters: { route: 'assistant' },
    body: '{',
    headers: {},
  })
  assert.equal(invalidJson.statusCode, 400)

  const invalidContext = await handler({
    httpMethod: 'POST',
    queryStringParameters: { route: 'assistant' },
    body: JSON.stringify({ message: 'Hello', context: [] }),
    headers: {},
  })
  assert.equal(invalidContext.statusCode, 400)
  assert.match(JSON.parse(invalidContext.body).error, /dashboard context/)
})

test('Netlify API function requires environment coordinates as a pair', async () => {
  const response = await handler({
    httpMethod: 'GET',
    queryStringParameters: { route: 'environment', latitude: '28.98' },
    headers: {},
  })
  assert.equal(response.statusCode, 400)
  assert.match(JSON.parse(response.body).error, /provided together/)
})
