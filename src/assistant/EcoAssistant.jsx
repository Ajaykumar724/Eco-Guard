import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamAssistantMessage } from './api.js'

function EcoAssistant({ context, open, onClose }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hi! Ask me about your local conditions, health recommendations, recycling, energy, or any sustainability question.',
  }])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const message = input.trim()
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
    try {
      await streamAssistantMessage(
        { message, context: context ?? {}, history },
        (chunk) => setMessages((current) => current.map((item, index) => (
          index === assistantIndex ? { ...item, content: item.content + chunk } : item
        ))),
      )
    } catch (requestError) {
      setError(requestError.message || 'Eco AI could not answer right now.')
      setMessages((current) => current.filter((item, index) => index !== assistantIndex || item.content))
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  return (
    <section className="assistant-drawer" id="eco-assistant-panel" aria-label="EcoGuard AI assistant">
      <header className="assistant-header">
        <div>
          <strong><span aria-hidden="true">◉</span> EcoGuard AI</strong>
          <small>Ask anything about your environment</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close EcoGuard AI assistant">×</button>
      </header>
      <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
        {messages.map((item, index) => (
          <div className={`assistant-message ${item.role}`} key={`${item.role}-${index}`}>
            {item.content
              ? <ReactMarkdown>{item.content}</ReactMarkdown>
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
        <button type="submit" aria-label="Send message" disabled={pending || !input.trim()}>↗</button>
      </form>
    </section>
  )
}

export default EcoAssistant
