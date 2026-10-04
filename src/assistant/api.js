async function postAssistantRequest(path, body, signal) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || `Eco AI returned ${response.status}`)
  return result
}

export async function fetchRecommendations(context, signal) {
  const result = await postAssistantRequest('/api/recommendations', { context }, signal)
  if (!Array.isArray(result.recommendations) || result.recommendations.length !== 4
    || !result.recommendations.every((item) => typeof item === 'string' && item.trim())) {
    throw new TypeError('Eco AI returned an invalid recommendations response')
  }
  return result.recommendations
}

export async function streamAssistantMessage({ message, context, history }, onChunk, signal) {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, history }),
    signal,
  })
  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || `Eco AI returned ${response.status}`)
  }
  if (!response.body) throw new TypeError('Eco AI returned no response stream')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let receivedContent = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        const result = processAssistantEvent(frame, onChunk)
        receivedContent ||= result.receivedContent
        if (result.done) {
          if (!receivedContent) throw new Error('Eco AI ended the response without returning an answer')
          return
        }
      }
      if (done) break
    }
    if (buffer.trim()) {
      const result = processAssistantEvent(buffer, onChunk)
      receivedContent ||= result.receivedContent
    }
  } finally {
    reader.releaseLock()
  }
  if (!receivedContent) throw new Error('The connection closed before Eco AI sent an answer. Please try again.')
}

function processAssistantEvent(frame, onChunk) {
  const event = frame.split(/\r?\n/).find((line) => line.startsWith('event:'))?.slice(6).trim()
  const data = frame.split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (event === 'done') return { done: true, receivedContent: false }
  if (event === 'error') {
    const result = JSON.parse(data)
    throw new Error(result.error || 'Eco AI stream failed')
  }
  if (!data) return { done: false, receivedContent: false }

  const result = JSON.parse(data)
  if (typeof result.content !== 'string') throw new TypeError('Eco AI returned an invalid stream event')
  if (result.content) onChunk(result.content)
  return { done: false, receivedContent: Boolean(result.content) }
}
