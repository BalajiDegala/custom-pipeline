import React, { useState, useEffect } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ResultsModal = styled.div`
  width: 90vw;
  height: 90vh;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ResultsTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
`

const ResultsCount = styled.span`
  padding: 4px 12px;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`

const ResultsBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
`

const TableContainer = styled.div`
  width: 100%;
  overflow: auto;
  background: var(--md-sys-color-surface);
  border-radius: 8px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
    
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    
    th {
      background: var(--md-sys-color-surface-container-highest);
      font-weight: 600;
      position: sticky;
      top: 0;
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background: var(--md-sys-color-surface-container-high);
      }
      
      &.sortable::after {
        content: ' ⇅';
        opacity: 0.5;
      }
      
      &.sorted-asc::after {
        content: ' ↑';
        opacity: 1;
      }
      
      &.sorted-desc::after {
        content: ' ↓';
        opacity: 1;
      }
    }
    
    tr:hover td {
      background: var(--md-sys-color-surface-container);
    }
  }
`

const LoadingMessage = styled.div`
  padding: 60px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 16px;
`

const ErrorMessage = styled.div`
  padding: 24px;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: 8px;
  margin: 16px;
`

const ColumnOrderPanel = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const ColumnOrderTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--md-sys-color-on-surface);
`

const ColumnChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ColumnChip = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--md-sys-color-surface-container-highest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 20px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  
  &:hover {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  
  .grip {
    color: var(--md-sys-color-on-surface-variant);
    cursor: grab;
  }
`

interface Node {
  id: string
  type: string
  label: string
  config?: any
}

interface Edge {
  id: string
  source: string
  target: string
}

interface ResultsFullPageProps {
  resultsNodeId: string
  nodes: Node[]
  edges: Edge[]
  projectName: string
  onClose: () => void
  selectedColumns?: string[]
}

const ResultsFullPage: React.FC<ResultsFullPageProps> = ({
  resultsNodeId,
  nodes,
  edges,
  projectName,
  onClose,
  selectedColumns: initialSelectedColumns
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [showColumnOrder, setShowColumnOrder] = useState(false)

  const buildQueryFromChain = (): string => {
    const chain: Node[] = []
    const findChain = (targetId: string): void => {
      const incomingEdge = edges.find(e => e.target === targetId)
      if (incomingEdge) {
        const sourceNode = nodes.find(n => n.id === incomingEdge.source)
        if (sourceNode) {
          chain.unshift(sourceNode)
          findChain(sourceNode.id)
        }
      }
    }
    
    findChain(resultsNodeId)
    
    if (chain.length === 0) return ''

    // Find columns node for selected columns
    const columnsNode = nodes.find(n => n.type === 'columns')
    const selectedCols = columnsNode?.config?.selectedColumns || initialSelectedColumns || []

    let query = 'query FlowResults {\n'
    query += `  project(name: "${projectName}") {\n`
    query += `    name\n`
    query += `    code\n`
    
    const foldersNode = chain.find(n => n.type === 'folders')
    if (foldersNode) {
      const selectedFolders = foldersNode.config?.selectedFolders || []
      
      if (selectedFolders.length > 0) {
        query += `    folders(ids: [${selectedFolders.map((id: string) => `"${id}"`).join(', ')}], first: 100) {\n`
      } else {
        query += `    folders(first: 100) {\n`
      }
      
      query += `      edges {\n`
      query += `        node {\n`
      query += `          id\n`
      query += `          name\n`
      query += `          folderType\n`
      query += `          path\n`
      query += `          status\n`
      
      // Add tasks if in chain
      const tasksNode = chain.find(n => n.type === 'tasks')
      if (tasksNode) {
        query += `          tasks {\n`
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                taskType\n`
        query += `                status\n`
        query += `                assignees\n`
        query += `              }\n`
        query += `            }\n`
        query += `          }\n`
      }
      
      const productsNode = chain.find(n => n.type === 'products')
      if (productsNode) {
        const selectedProducts = productsNode.config?.selectedProducts || []
        
        if (selectedProducts.length > 0) {
          query += `          products(ids: [${selectedProducts.map((id: string) => `"${id}"`).join(', ')}], first: 100) {\n`
        } else {
          query += `          products(first: 100) {\n`
        }
        
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                productType\n`
        
        const versionsNode = chain.find(n => n.type === 'versions')
        if (versionsNode) {
          const selectedVersions = versionsNode.config?.selectedVersions || []
          
          if (selectedVersions.length > 0) {
            query += `                versions(ids: [${selectedVersions.map((id: string) => `"${id}"`).join(', ')}], first: 100) {\n`
          } else {
            query += `                versions(first: 100) {\n`
          }
          
          query += `                  edges {\n`
          query += `                    node {\n`
          query += `                      id\n`
          query += `                      version\n`
          query += `                      author\n`
          query += `                      status\n`
          query += `                      createdAt\n`
          query += `                    }\n`
          query += `                  }\n`
          query += `                }\n`
        }
        
        query += `              }\n`
        query += `            }\n`
        query += `          }\n`
      }
      
      query += `        }\n`
      query += `      }\n`
      query += `    }\n`
    }
    
    query += `  }\n`
    query += `}`
    
    return query
  }

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    
    try {
      const query = buildQueryFromChain()
      
      if (!query) {
        throw new Error('No valid query chain found. Connect Project → Folders → Results')
      }
      
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      const response = await fetch('/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      
      if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL query failed')
      
      const flattenedResults = flattenResults(data.data)
      setResults(flattenedResults)
      
      if (flattenedResults.length > 0) {
        const cols = Object.keys(flattenedResults[0])
        setColumns(cols)
        setColumnOrder(cols)
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const flattenResults = (data: any): any[] => {
    const rows: any[] = []
    
    const extractNodes = (edgesContainer: any): any[] => {
      if (!edgesContainer?.edges) return []
      return edgesContainer.edges.map((e: any) => e.node)
    }
    
    const flatten = (obj: any, prefix: string = '') => {
      if (Array.isArray(obj)) {
        obj.forEach(item => flatten(item, prefix))
      } else if (obj && typeof obj === 'object') {
        if (obj.project) {
          flatten(obj.project, prefix)
          return
        }
        
        if (obj.folders?.edges) {
          const folders = extractNodes(obj.folders)
          folders.forEach((folder: any) => {
            if (folder.tasks?.edges) {
              const tasks = extractNodes(folder.tasks)
              tasks.forEach((task: any) => {
                rows.push({
                  folderId: folder.id,
                  folderName: folder.name,
                  folderType: folder.folderType,
                  folderPath: folder.path,
                  folderStatus: folder.status,
                  taskId: task.id,
                  taskName: task.name,
                  taskType: task.taskType,
                  taskStatus: task.status,
                  assignees: task.assignees?.join(', ') || '',
                })
              })
            } else if (folder.products?.edges) {
              const products = extractNodes(folder.products)
              products.forEach((product: any) => {
                if (product.versions?.edges) {
                  const versions = extractNodes(product.versions)
                  versions.forEach((version: any) => {
                    rows.push({
                      folderId: folder.id,
                      folderName: folder.name,
                      folderType: folder.folderType,
                      folderPath: folder.path,
                      productId: product.id,
                      productName: product.name,
                      productType: product.productType,
                      versionId: version.id,
                      version: version.version,
                      versionAuthor: version.author,
                      versionStatus: version.status,
                      createdAt: version.createdAt,
                    })
                  })
                } else {
                  rows.push({
                    folderId: folder.id,
                    folderName: folder.name,
                    folderType: folder.folderType,
                    folderPath: folder.path,
                    productId: product.id,
                    productName: product.name,
                    productType: product.productType,
                  })
                }
              })
            } else {
              rows.push({
                id: folder.id,
                name: folder.name,
                folderType: folder.folderType,
                path: folder.path,
                status: folder.status,
              })
            }
          })
        }
      }
    }
    
    flatten(data)
    return rows
  }

  useEffect(() => {
    executeQuery()
  }, [])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedResults = React.useMemo(() => {
    if (!sortColumn) return results
    return [...results].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true })
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [results, sortColumn, sortDirection])

  const handleColumnDragStart = (column: string) => {
    setDraggedColumn(column)
  }

  const handleColumnDragOver = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumn) return
    
    const newOrder = [...columnOrder]
    const draggedIdx = newOrder.indexOf(draggedColumn)
    const targetIdx = newOrder.indexOf(targetColumn)
    newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, draggedColumn)
    setColumnOrder(newOrder)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
  }

  const exportCSV = () => {
    const orderedColumns = columnOrder.length > 0 ? columnOrder : columns
    const csvContent = [
      orderedColumns.join(','),
      ...sortedResults.map(row => 
        orderedColumns.map(col => {
          const val = row[col]
          const escaped = String(val ?? '').replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `flow_results_${projectName}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const orderedColumns = columnOrder.length > 0 ? columnOrder : columns

  return (
    <FullScreenOverlay onClick={onClose}>
      <ResultsModal onClick={e => e.stopPropagation()}>
        <ResultsHeader>
          <HeaderLeft>
            <ResultsTitle>Query Results</ResultsTitle>
            <ResultsCount>{results.length} rows</ResultsCount>
          </HeaderLeft>
          <HeaderActions>
            <Button onClick={() => setShowColumnOrder(!showColumnOrder)} variant="text">
              <Icon icon="view_column" /> Column Order
            </Button>
            <Button onClick={executeQuery} disabled={loading}>
              <Icon icon="refresh" /> {loading ? 'Running...' : 'Re-run'}
            </Button>
            <Button onClick={exportCSV} disabled={results.length === 0}>
              <Icon icon="download" /> Export CSV
            </Button>
            <Button onClick={onClose} variant="text">
              <Icon icon="close" /> Close
            </Button>
          </HeaderActions>
        </ResultsHeader>
        
        {showColumnOrder && (
          <ColumnOrderPanel>
            <ColumnOrderTitle>Drag to reorder columns (affects table and CSV export):</ColumnOrderTitle>
            <ColumnChips>
              {orderedColumns.map(col => (
                <ColumnChip
                  key={col}
                  $isDragging={draggedColumn === col}
                  draggable
                  onDragStart={() => handleColumnDragStart(col)}
                  onDragOver={(e) => handleColumnDragOver(e, col)}
                  onDragEnd={handleColumnDragEnd}
                >
                  <Icon icon="drag_indicator" className="grip" />
                  {col}
                </ColumnChip>
              ))}
            </ColumnChips>
          </ColumnOrderPanel>
        )}
        
        <ResultsBody>
          {loading && <LoadingMessage>Executing query...</LoadingMessage>}
          
          {error && <ErrorMessage><strong>Error:</strong> {error}</ErrorMessage>}
          
          {!loading && !error && results.length === 0 && (
            <LoadingMessage>No results found. Make sure your nodes are connected properly.</LoadingMessage>
          )}
          
          {!loading && !error && results.length > 0 && (
            <TableContainer>
              <table>
                <thead>
                  <tr>
                    {orderedColumns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className={`sortable ${sortColumn === col ? `sorted-${sortDirection}` : ''}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((row, idx) => (
                    <tr key={idx}>
                      {orderedColumns.map(col => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          )}
        </ResultsBody>
      </ResultsModal>
    </FullScreenOverlay>
  )
}

export default ResultsFullPage
