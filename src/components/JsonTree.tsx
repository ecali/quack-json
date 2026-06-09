import { useState, useEffect, useCallback } from 'react'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonArray
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[]

interface JsonNodeProps {
  data: JsonValue
  keyName?: string
  expandTrigger: number
  collapseTrigger: number
  depth: number
  isLast: boolean
}

const INDENT = 20 // px per depth level

function getTypeColor(value: JsonValue): string {
  if (value === null) return 'var(--json-null)'
  switch (typeof value) {
    case 'string': return 'var(--json-string)'
    case 'number': return 'var(--json-number)'
    case 'boolean': return 'var(--json-boolean)'
    default: return 'var(--json-bracket)'
  }
}

function renderPrimitive(value: JsonPrimitive): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

function previewComplex(value: JsonValue): string {
  if (Array.isArray(value)) {
    const len = value.length
    return `[${len} item${len !== 1 ? 's' : ''}]`
  }
  if (value !== null && typeof value === 'object') {
    const len = Object.keys(value).length
    return `{${len} key${len !== 1 ? 's' : ''}}`
  }
  return ''
}

const JsonNode = ({
  data,
  keyName,
  expandTrigger,
  collapseTrigger,
  depth,
  isLast,
}: JsonNodeProps) => {
  const isObject = data !== null && typeof data === 'object' && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const isComplex = isObject || isArray

  const [isExpanded, setIsExpanded] = useState(depth < 2)

  useEffect(() => {
    if (expandTrigger > 0) setIsExpanded(true)
  }, [expandTrigger])

  useEffect(() => {
    if (collapseTrigger > 0) setIsExpanded(false)
  }, [collapseTrigger])

  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  const entries: [string, JsonValue][] = isObject
    ? Object.entries(data as JsonObject)
    : isArray
    ? (data as JsonArray).map((v, i) => [String(i), v])
    : []

  const indentStyle = { paddingLeft: depth * INDENT }

  const copyValue = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text).catch(() => {})
  }, [data])

  // Primitive value
  if (!isComplex) {
    const color = getTypeColor(data)
    return (
      <div className="jn-line" style={indentStyle}>
        {keyName !== undefined && (
          <>
            <span className="jn-key">"{keyName}"</span>
            <span className="jn-punct">: </span>
          </>
        )}
        <span
          className="jn-value"
          style={{ color }}
          title="Click to copy"
          onClick={copyValue}
        >
          {renderPrimitive(data as JsonPrimitive)}
        </span>
        {!isLast && <span className="jn-punct">,</span>}
      </div>
    )
  }

  // Complex value (object or array)
  return (
    <div className="jn-node">
      {/* Opening line */}
      <div
        className="jn-line jn-expandable"
        style={indentStyle}
        onClick={() => setIsExpanded(v => !v)}
      >
        <span className="jn-arrow">{isExpanded ? '▼' : '▶'}</span>
        {keyName !== undefined && (
          <>
            <span className="jn-key">"{keyName}"</span>
            <span className="jn-punct">: </span>
          </>
        )}
        <span className="jn-bracket">{openBracket}</span>
        {!isExpanded && (
          <>
            <span className="jn-preview">{previewComplex(data)}</span>
            <span className="jn-bracket">{closeBracket}</span>
          </>
        )}
        {isExpanded && entries.length === 0 && (
          <span className="jn-bracket">{closeBracket}</span>
        )}
        {(!isExpanded || entries.length === 0) && !isLast && (
          <span className="jn-punct">,</span>
        )}
      </div>

      {/* Children */}
      {isExpanded && entries.length > 0 && (
        <>
          {entries.map(([key, value], index) => (
            <JsonNode
              key={key}
              data={value}
              keyName={isArray ? undefined : key}
              expandTrigger={expandTrigger}
              collapseTrigger={collapseTrigger}
              depth={depth + 1}
              isLast={index === entries.length - 1}
            />
          ))}
          {/* Array items: show index as comment for visibility */}
          {/* Closing bracket */}
          <div className="jn-line" style={indentStyle}>
            <span className="jn-arrow" style={{ visibility: 'hidden' }}>▼</span>
            <span className="jn-bracket">{closeBracket}</span>
            {!isLast && <span className="jn-punct">,</span>}
          </div>
        </>
      )}
    </div>
  )
}

interface JsonTreeProps {
  data: unknown
  expandTrigger: number
  collapseTrigger: number
}

export function JsonTree({ data, expandTrigger, collapseTrigger }: JsonTreeProps) {
  return (
    <div className="json-tree">
      <JsonNode
        data={data as JsonValue}
        expandTrigger={expandTrigger}
        collapseTrigger={collapseTrigger}
        depth={0}
        isLast={true}
      />
    </div>
  )
}
