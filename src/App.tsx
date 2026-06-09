import { useState, useCallback, useRef } from 'react'
import { JsonTree } from './components/JsonTree'
import './App.css'

const SAMPLE_JSON = `{
  "name": "quack-json",
  "version": "1.0.0",
  "description": "A fast JSON viewer",
  "author": {
    "name": "You",
    "email": "you@example.com"
  },
  "features": ["tree view", "syntax highlight", "format", "load file"],
  "active": true,
  "score": 9.5,
  "metadata": null
}`

export default function App() {
  const [rawJson, setRawJson] = useState(SAMPLE_JSON)
  const [parsedJson, setParsedJson] = useState<unknown>(() => {
    try { return JSON.parse(SAMPLE_JSON) } catch { return null }
  })
  const [error, setError] = useState<string | null>(null)
  const [expandTrigger, setExpandTrigger] = useState(0)
  const [collapseTrigger, setCollapseTrigger] = useState(0)
  const [splitRatio, setSplitRatio] = useState(0.44)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleJsonChange = useCallback((value: string) => {
    setRawJson(value)
    if (!value.trim()) {
      setParsedJson(null)
      setError(null)
      return
    }
    try {
      setParsedJson(JSON.parse(value))
      setError(null)
    } catch (e) {
      setParsedJson(null)
      setError((e as Error).message)
    }
  }, [])

  const handleFormat = () => {
    if (parsedJson !== null) {
      setRawJson(JSON.stringify(parsedJson, null, 2))
    }
  }

  const handleLoadFile = async () => {
    if (window.electronAPI) {
      const content = await window.electronAPI.openFile()
      if (content) handleJsonChange(content)
    }
  }

  const handleCopy = () => {
    if (parsedJson === null) return
    navigator.clipboard.writeText(JSON.stringify(parsedJson, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleClear = () => {
    setRawJson('')
    setParsedJson(null)
    setError(null)
  }

  // Resizable splitter
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (ev.clientX - rect.left) / rect.width
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const isValid = parsedJson !== null && !error
  const isEmpty = rawJson.trim() === ''

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🦆</span>
          <span className="logo-text">quack-json</span>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={handleFormat} disabled={!isValid} title="Format JSON">
            Format
          </button>
          <button className="btn" onClick={handleLoadFile} title="Load JSON from file">
            Load File
          </button>
          <button className="btn" onClick={handleCopy} disabled={!isValid} title="Copy formatted JSON">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <div className="toolbar-divider" />
          <button className="btn" onClick={() => setExpandTrigger(t => t + 1)} disabled={!isValid} title="Expand all nodes">
            Expand All
          </button>
          <button className="btn" onClick={() => setCollapseTrigger(t => t + 1)} disabled={!isValid} title="Collapse all nodes">
            Collapse All
          </button>
          <div className="toolbar-divider" />
          <button className="btn btn-danger" onClick={handleClear} disabled={isEmpty} title="Clear editor">
            Clear
          </button>
        </div>
      </header>

      {/* Main panels */}
      <main className="main" ref={containerRef}>
        {/* Left: Editor */}
        <div className="panel editor-panel" style={{ width: `${splitRatio * 100}%` }}>
          <div className="panel-header">
            <span>JSON Input</span>
            <span className="panel-hint">Paste or type your JSON here</span>
          </div>
          <textarea
            className="json-editor"
            value={rawJson}
            onChange={e => handleJsonChange(e.target.value)}
            placeholder={'Paste your JSON here...\n\nExample:\n{\n  "name": "John",\n  "age": 30\n}'}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Draggable divider */}
        <div className="divider" onMouseDown={handleDividerMouseDown} />

        {/* Right: Viewer */}
        <div className="panel viewer-panel" style={{ flex: 1 }}>
          <div className="panel-header">
            <span>Tree Viewer</span>
            {isValid && (
              <span className="panel-hint">Click a node to expand/collapse · Click a value to copy</span>
            )}
          </div>
          <div className="viewer-content">
            {isEmpty && (
              <div className="empty-state">
                <div className="empty-duck">🦆</div>
                <p>Paste JSON on the left to see the tree</p>
              </div>
            )}
            {!isEmpty && error && (
              <div className="error-box">
                <span className="error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {isValid && (
              <JsonTree
                data={parsedJson}
                expandTrigger={expandTrigger}
                collapseTrigger={collapseTrigger}
              />
            )}
          </div>
        </div>
      </main>

      {/* Status bar */}
      <footer className="status-bar">
        {error && !isEmpty ? (
          <span className="status status-error">⚠ Invalid JSON — {error}</span>
        ) : isValid ? (
          <span className="status status-ok">✓ Valid JSON</span>
        ) : (
          <span className="status status-idle">Ready · quack-json</span>
        )}
      </footer>
    </div>
  )
}
