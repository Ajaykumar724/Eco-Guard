import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamAssistantMessage } from './api.js'

function EcoAssistant({ context, open, onClose, initialPrompt }) {
  const messagesRef = useRef(null)
  const abortControllerRef = useRef(null)
  const handledPromptRef = useRef(null)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hi! Ask me about your local conditions, health recommendations, recycling, energy, or any sustainability question.',
  }])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const messageList = messagesRef.current
    if (messageList) messageList.scrollTop = messageList.scrollHeight
  }, [messages, pending, error])

  function stopResponse() {
    abortControllerRef.current?.abort()
  }

  const sendMessage = useCallback(async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || pending) return

    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }))
    const assistantIndex = messages.length + 1
    setMessages((current) => [
      ...current,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
    setInput('')
    setError('')
    setPending(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    const wordQueue = []
    let bufferedText = ''
    let streamFinished = false

    function queueWords(text, flush = false) {
      bufferedText += text
      const words = bufferedText.match(/\S+\s*|\s+/g) ?? []
      if (!flush && words.length && !/\s$/.test(bufferedText)) {
        bufferedText = words.pop()
      } else {
        bufferedText = ''
      }
      wordQueue.push(...words)
      if (flush && bufferedText) {
        wordQueue.push(bufferedText)
        bufferedText = ''
      }
    }

    async function renderWords() {
      while ((!controller.signal.aborted && !streamFinished) || wordQueue.length) {
        const word = wordQueue.shift()
        if (word) {
          setMessages((current) => current.map((item, index) => (
            index === assistantIndex ? { ...item, content: item.content + word } : item
          )))
        }
        await new Promise((resolve) => setTimeout(resolve, 35))
      }
    }

    const rendering = renderWords()
    try {
      await streamAssistantMessage(
        { message, context: context ?? {}, history },
        (chunk) => queueWords(chunk),
        controller.signal,
      )
      queueWords('', true)
      streamFinished = true
      await rendering
    } catch (requestError) {
      queueWords('', true)
      streamFinished = true
      await rendering
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'Eco AI could not answer right now.')
        setMessages((current) => current.filter((item, index) => index !== assistantIndex || item.content))
      }
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
      setPending(false)
    }
  }, [context, messages, pending])

  useEffect(() => {
    if (!open || !initialPrompt || handledPromptRef.current === initialPrompt.id) return
    handledPromptRef.current = initialPrompt.id
    void sendMessage(initialPrompt.message)
  }, [initialPrompt, open, sendMessage])

  function handleSubmit(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message || pending) return
    setInput('')
    void sendMessage(message)
  }

  if (!open) return null

  return (
    <section className="assistant-drawer" id="eco-assistant-panel" aria-label="EcoGuard AI assistant">
      <header className="assistant-header">
        <div>
          <strong><i className="fa-solid fa-robot" aria-hidden="true" /> EcoGuard AI</strong>
          <small>Ask anything about your environment</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close EcoGuard AI assistant">×</button>
      </header>
      <div className="assistant-messages" ref={messagesRef} aria-live="polite" aria-relevant="additions text">
        {messages.map((item, index) => (
          <div className={`assistant-message ${item.role}`} key={`${item.role}-${index}`}>
            {item.content
              ? <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="assistant-table">
                        <table>{children}</table>
                      </div>
                    ),
                  }}
                >
                  {item.content}
                </ReactMarkdown>
              : pending && item.role === 'assistant' && <span role="status">Thinking…</span>}
          </div>
        ))}
        {error && <p className="assistant-error" role="alert">{error}</p>}
      </div>
      <form className="assistant-input" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="eco-assistant-message">Message EcoGuard AI</label>
        <input
          id="eco-assistant-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask anything…"
          maxLength={2000}
          disabled={pending}
        />
        {pending
          ? <button className="assistant-stop" type="button" onClick={stopResponse} aria-label="Stop response" title="Stop response">■</button>
          : <button type="submit" aria-label="Send message" disabled={!input.trim()}>↗</button>}
      </form>
    </section>
  )
}

export default EcoAssistant
