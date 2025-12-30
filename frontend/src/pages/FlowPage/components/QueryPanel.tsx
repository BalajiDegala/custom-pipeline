import React, { useState } from 'react'
import { Button, Panel } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const QueryContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const QueryHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  
  h3 {
    margin: 0 0 8px 0;
    color: var(--md-sys-color-on-surface);
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 14px;
  }
`

const QueryEditor = styled.textarea`
  flex: 1;
  padding: 16px;
  border: none;
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  outline: none;
  
  &:focus {
    background-color: var(--md-sys-color-surface-container-high);
  }
`

const QueryActions = styled.div`
  padding: 16px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  gap: 12px;
  align-items: center;
`

const ResultContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--md-sys-color-surface-container);
  overflow: hidden;
`

const ResultTabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-highest);
`

const ResultTab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${props => props.active ? 'var(--md-sys-color-primary-container)' : 'transparent'};
  color: ${props => props.active ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)'};
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
`

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    
    th {
      background-color: var(--md-sys-color-surface-container-highest);
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      position: sticky;
      top: 0;
    }
    
    td {
      color: var(--md-sys-color-on-surface-variant);
    }
    
    tr:hover {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }
`

const JsonContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow: auto;
  
  pre {
    margin: 0;
    font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface);
    white-space: pre-wrap;
    word-break: break-word;
  }
`

const StatusIndicator = styled.span<{ status: 'idle' | 'loading' | 'success' | 'error' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  ${({ status }) => {
    switch (status) {
      case 'loading':
        return `
          background-color: var(--md-sys-color-tertiary-container);
          color: var(--md-sys-color-on-tertiary-container);
        `
      case 'success':
        return `
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
        `
      case 'error':
        return `
          background-color: var(--md-sys-color-error-container);
          color: var(--md-sys-color-on-error-container);
        `
      default:
        return `
          background-color: var(--md-sys-color-surface-container-highest);
          color: var(--md-sys-color-on-surface-variant);
        `
    }
  }}
`

interface QueryPanelProps {
  query: string
  variables?: Record<string, any>
  projectName?: string
}

const QueryPanel: React.FC<QueryPanelProps> = ({ 
  query, 
  variables = {}, 
  projectName 
}) => {
  const [editableQuery, setEditableQuery] = useState(query)
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table')

  // Update editable query when prop changes
  React.useEffect(() => {
    setEditableQuery(query)
  }, [query])

  const renderDataTable = (data: any) => {
    if (!data || typeof data !== 'object') return null

    // Extract the first data property that contains an array
    const dataKey = Object.keys(data).find(key => Array.isArray(data[key]))
    if (!dataKey || !data[dataKey] || data[dataKey].length === 0) {
      return <div style={{ padding: '16px', textAlign: 'center' }}>No tabular data found</div>
    }

    const items = data[dataKey]
    const headers = Object.keys(items[0] || {})

    return (
      <TableContainer>
        <table>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header}>
                    {typeof item[header] === 'object' 
                      ? JSON.stringify(item[header]) 
                      : String(item[header] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    )
  }

  const executeQuery = async () => {
    if (!editableQuery.trim()) {
      setError('Query is empty')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)
    setResult(null)

    try {
      // Use the AYON GraphQL endpoint
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: editableQuery,
          variables: {
            projectName: projectName || 'demo_Commercial',
            ...variables
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        setError(data.errors.map((e: any) => e.message).join(', '))
        setStatus('error')
        return
      }
      
      setResult(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setStatus('error')
    }
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(editableQuery)
  }

  const clearQuery = () => {
    setEditableQuery('')
    setResult(null)
    setStatus('idle')
    setError(null)
  }

  return (
    <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <QueryHeader>
        <h3>GraphQL Query</h3>
        <p>Generated from your flow connections</p>
      </QueryHeader>
      
      <QueryContainer>
        <QueryEditor
          value={editableQuery}
          onChange={(e) => setEditableQuery(e.target.value)}
          placeholder="Connect nodes in the graph to generate a GraphQL query..."
        />
        
        <QueryActions>
          <Button
            onClick={executeQuery}
            disabled={!editableQuery.trim() || status === 'loading'}
            variant="filled"
          >
            {status === 'loading' ? 'Executing...' : 'Execute'}
          </Button>
          
          <Button onClick={copyQuery} variant="text">
            Copy
          </Button>
          
          <Button onClick={clearQuery} variant="text">
            Clear
          </Button>
          
          <StatusIndicator status={status}>
            {status === 'idle' && 'Ready'}
            {status === 'loading' && 'Loading...'}
            {status === 'success' && 'Success'}
            {status === 'error' && 'Error'}
          </StatusIndicator>
        </QueryActions>
        
        {(result || error) && (
          <ResultContainer>
            <ResultTabs>
              <ResultTab 
                active={viewMode === 'table'} 
                onClick={() => setViewMode('table')}
              >
                Table View
              </ResultTab>
              <ResultTab 
                active={viewMode === 'json'} 
                onClick={() => setViewMode('json')}
              >
                JSON View
              </ResultTab>
            </ResultTabs>
            
            {error && (
              <JsonContainer>
                <pre style={{ color: 'var(--md-sys-color-error)' }}>
                  Error: {error}
                </pre>
              </JsonContainer>
            )}
            
            {result && viewMode === 'table' && renderDataTable(result.data)}
            
            {result && viewMode === 'json' && (
              <JsonContainer>
                <pre>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </JsonContainer>
            )}
          </ResultContainer>
        )}
      </QueryContainer>
    </Panel>
  )
}

export default QueryPanel