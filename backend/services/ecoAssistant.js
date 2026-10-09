import { config } from '../config.js'

const instructions = `You are EcoGuard's helpful, general-purpose eco assistant. Answer the user's actual question using the conversation and the supplied live environmental context when relevant. You may give general sustainability information, but never invent current local readings or claim unavailable data is known. Be clear when information is missing. Keep answers practical and do not diagnose medical conditions.`

export async function askEcoAssistant(message, context, history = []) {
  const messages = buildConversation(message, context, history)
  return requestModel({ messages, maxOutputTokens: 600 })
}

export async function* streamEcoAssistant(message, context, history = [], signal) {
  const messages = buildConversation(message, context, history)
  yield* requestModelStream({ messages, maxOutputTokens: 600, signal })
}

export async function getRecommendations(context) {
  const output = await requestModel({
    messages: [
      { role: 'system', content: `You are EcoGuard's environmental health recommender. Use only the supplied dashboard context. Do not invent AQI, temperature, water, waste, or other current readings. If any data is unavailable, say so where relevant and make only safe, practical suggestions. Do not diagnose medical conditions. Return exactly four concise recommendations as a JSON array of four strings, with no other text. Format each string as "Short title: one-sentence practical explanation".` },
      { role: 'user', content: `Current dashboard context (JSON):\n${JSON.stringify(context)}\n\nReturn exactly four practical recommendations based on this context. Format each as "Short title: one-sentence practical explanation".` },
    ],
    maxOutputTokens: 400,
  })

  return parseRecommendations(output)
}

export function parseRecommendations(output) {
  const normalized = output.trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')
  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed) && parsed.length === 4 && parsed.every((item) => typeof item === 'string' && item.trim())) {
      return parsed.map((item) => item.trim())
    }
  } catch {
    const lines = normalized.split(/\r?\n/)
      .map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s*/, ''))
      .filter(Boolean)
    if (lines.length === 4) return lines
  }

  throw new TypeError('Eco AI did not return exactly four recommendations')
}

export function buildChatCompletionsEndpoint(baseUrl) {
  return new URL(`${baseUrl.replace(/\/+$/, '')}/chat/completions`)
}

export function extractChatCompletionText(result) {
  const content = result.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim()
  }
  return ''
}

export function normalizeProviderError(error) {
  if (error?.name === 'TimeoutError' || error?.cause?.name === 'TimeoutError') {
    const normalized = new Error(`Eco AI timed out after ${config.assistantTimeoutMs} ms. Increase AI_TIMEOUT_MS or try again.`, { cause: error })
    normalized.statusCode = 504
    return normalized
  }
  return new Error(`Eco AI provider request failed: ${error.message}`, { cause: error })
}

function buildConversation(message, context, history) {
  return [
    {
      role: 'system',
      content: `${instructions}\n\nCurrent dashboard context (JSON; unavailable values are not known):\n${JSON.stringify(context)}`,
    },
    ...history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: message },
  ]
}

async function requestModel({ messages, maxOutputTokens }) {
  if (!config.assistantApiKey) {
    const error = new Error('Eco AI is not configured. Set AWS_BEARER_TOKEN_BEDROCK or OPENAI_API_KEY in the project-root .env file.')
    error.statusCode = 503
    throw error
  }

  const endpoint = buildChatCompletionsEndpoint(config.assistantBaseUrl)
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.assistantApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: config.assistantModel,
        messages,
        max_tokens: maxOutputTokens,
      }),
      signal: AbortSignal.timeout(config.assistantTimeoutMs),
    })
  } catch (error) {
    throw normalizeProviderError(error)
  }

  if (!response.ok) {
    const error = new Error(`Eco AI provider returned HTTP ${response.status}`)
    error.statusCode = 502
    throw error
  }

  const result = await response.json()
  const text = extractChatCompletionText(result)
  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Eco AI returned an empty response. Try again or check the configured model.')
    error.statusCode = 502
    throw error
  }
  return text.trim()
}

async function* requestModelStream({ messages, maxOutputTokens, signal }) {
  if (!config.assistantApiKey) {
    const error = new Error('Eco AI is not configured. Set AWS_BEARER_TOKEN_BEDROCK or OPENAI_API_KEY in the project-root .env file.')
    error.statusCode = 503
    throw error
  }

  const endpoint = buildChatCompletionsEndpoint(config.assistantBaseUrl)
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.assistantApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: config.assistantModel,
        messages,
        max_tokens: maxOutputTokens,
        stream: true,
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(config.assistantTimeoutMs)])
        : AbortSignal.timeout(config.assistantTimeoutMs),
    })
  } catch (error) {
    throw normalizeProviderError(error)
  }

  if (!response.ok) {
    const error = new Error(`Eco AI provider returned HTTP ${response.status}`)
    error.statusCode = 502
    throw error
  }
  if (!response.body) {
    const error = new Error('Eco AI provider returned no response stream. Check that the configured model supports streaming.')
    error.statusCode = 502
    throw error
  }

  yield* parseChatCompletionStream(response.body)
}

export async function* parseChatCompletionStream(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedContent = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''
      let streamComplete = false
      for (const frame of frames) {
        const chunk = extractStreamChunk(frame)
        if (chunk === null) {
          streamComplete = true
          break
        }
        if (chunk) {
          receivedContent = true
          yield chunk
        }
      }
      if (streamComplete) break
      if (done) break
    }
    if (buffer.trim()) {
      const chunk = extractStreamChunk(buffer)
      if (chunk) {
        receivedContent = true
        yield chunk
      }
    }
  } finally {
    reader.releaseLock()
  }
  if (!receivedContent) {
    const error = new Error('Eco AI provider finished without sending any text. Try again or check that the configured model supports streaming.')
    error.statusCode = 502
    throw error
  }
}

export function extractStreamChunk(frame) {
  const data = frame.split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data) return ''
  if (data === '[DONE]') return null

  const event = JSON.parse(data)
  if (event.error) throw new Error(event.error.message || 'Eco AI stream failed')
  const content = event.choices?.[0]?.delta?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
  }
  return ''
}
