import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamAssistantMessage } from './api.js'

function InlineEcoInsight({ prompt, context, className = '', onMoreDetails }) {
  const controllerRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const dragRef = useRef(null)
  const [answer, setAnswer] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 24 })

  useEffect(() => () => controllerRef.current?.abort(), [])

  function clampPosition(x, y) {
    const bounds = panelRef.current?.getBoundingClientRect()
    const width = bounds?.width ?? 360
    const height = bounds?.height ?? 280
    return {
      x: Math.max(12, Math.min(x, window.innerWidth - width - 12)),
      y: Math.max(12, Math.min(y, window.innerHeight - height - 12)),
    }
  }

  function placePanelNearTrigger() {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return

    const width = Math.min(360, window.innerWidth - 24)
    const x = trigger.right + width + 12 <= window.innerWidth
      ? trigger.right + 12
      : trigger.left - width - 12
    setPosition(clampPosition(x, trigger.top))
  }

  useEffect(() => {
    if (!panelOpen) return undefined
    const keepPanelVisible = () => setPosition((current) => clampPosition(current.x, current.y))
    const resizeObserver = panelRef.current
      ? new ResizeObserver(keepPanelVisible)
      : null
    if (panelRef.current) resizeObserver.observe(panelRef.current)
    window.addEventListener('resize', keepPanelVisible)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', keepPanelVisible)
    }
  }, [panelOpen])

  async function askEcoGuard() {
    if (pending) return

    const controller = new AbortController()
    controllerRef.current = controller
    setAnswer('')
    setError('')
    setCollapsed(false)
    setPending(true)
    let bufferedText = ''
    const wordQueue = []
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
        if (word) setAnswer((current) => current + word)
        await new Promise((resolve) => setTimeout(resolve, 35))
      }
    }

    const rendering = renderWords()
    try {
      await streamAssistantMessage(
        { message: prompt, context: context ?? {}, history: [] },
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
        setError(requestError.message || 'EcoGuard AI could not answer right now.')
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      setPending(false)
    }
  }

  function stopResponse() {
    controllerRef.current?.abort()
  }

  function togglePanel() {
    if (panelOpen) {
      stopResponse()
      setPanelOpen(false)
      return
    }

    placePanelNearTrigger()
    setPanelOpen(true)
    setCollapsed(false)
    if (!answer && !pending) askEcoGuard()
  }

  function closePanel() {
    stopResponse()
    setPanelOpen(false)
  }

  function startDragging(event) {
    if (event.target.closest('button')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
    }
  }

  function dragPanel(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setPosition(clampPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY))
  }

  function stopDragging(event) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  return (
    <div className={`inline-eco-insight ${className}`}>
      <button
        ref={triggerRef}
        className="inline-eco-trigger"
        type="button"
        onClick={togglePanel}
        disabled={pending}
        aria-expanded={panelOpen}
        title="Ask EcoGuard AI about this"
      >
        <i className="fa-solid fa-robot" aria-hidden="true" /><span className="visually-hidden">Ask EcoGuard AI about this</span>
      </button>
      {panelOpen && createPortal(
        <section
          ref={panelRef}
          className={`inline-eco-answer ${collapsed ? 'is-collapsed' : ''}`}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          aria-label="EcoGuard AI insight"
          aria-live="polite"
        >
          <header
            className="inline-eco-answer-drag-handle"
            onPointerDown={startDragging}
            onPointerMove={dragPanel}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <strong><i className="fa-solid fa-robot" aria-hidden="true" /> EcoGuard AI <small>Drag to move</small></strong>
            <div className="inline-eco-window-actions">
              {pending && <button className="inline-eco-stop" type="button" onClick={stopResponse} aria-label="Stop response">Stop</button>}
              <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? 'Expand response window' : 'Collapse response window'}
                aria-expanded={!collapsed}
              >
                {collapsed ? '□' : '−'}
              </button>
              <button type="button" onClick={closePanel} aria-label="Close response window">×</button>
            </div>
          </header>
          {!collapsed && (
            <>
              {answer
                ? <div className="inline-eco-answer-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                  </div>
                : pending
                  ? <p className="inline-eco-status" role="status">Checking this environmental reading…</p>
                  : <p className="inline-eco-status" role="status">Response stopped.</p>}
              {error && <p className="inline-eco-error" role="alert">{error}</p>}
              {answer && !pending && (
                <button
                  className="inline-eco-more-details"
                  type="button"
                  onClick={() => onMoreDetails?.(`Please give me more detail about this EcoGuard insight: ${prompt}`)}
                >
                  More details in EcoGuard AI <span aria-hidden="true">→</span>
                </button>
              )}
            </>
          )}
        </section>,
        document.body,
      )}
    </div>
  )
}

export default InlineEcoInsight
