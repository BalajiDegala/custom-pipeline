import React, { useState, useEffect } from 'react'
import { Button, DataTable } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const ResultsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  max-height: 40%;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const ResultsTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
`

const ResultsBody = styled.div`
  flex: 1;
  overflow: auto;
  background: var(--md-sys-color-surface);
  border-radius: 4px;
  padding: 12px;
`

const TableContainer = styled.div`
  width: 100%;
  overflow: auto;
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    
    th {
      background: var(--md-sys-color-surface-container-highest);
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    
    tr:hover {
      background: var(--md-sys-color-surface-container);
    }
  }
`

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

const ErrorMessage = styled.div`
  padding: 20px;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: 4px;
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

interface ResultsNodeProps {
  resultsNodeId: string
  nodes: Node[]
  edges: Edge[]
  projectName: string
  onClose: () => void
}

const ResultsNode: React.FC<ResultsNodeProps> = ({
  resultsNodeId,
  nodes,
  edges,
  projectName,
  onClose
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])

  const buildQueryFromChain = (): string => {
    // Find the chain leading to the Results node
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
    
    if (chain.length === 0) {
      return ''
    }

    // Build GraphQL query from chain
    let query = 'query FlowResults {\n'
    
    // Start with project
    query += `  project(name: "${projectName}") {\n`
    query += `    name\n`
    query += `    code\n`
    
    // Add folders if in chain
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
      
      // Add products if in chain
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
        
        // Add versions if in chain
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
      console.log('Executing query:', query)
      
      if (!query) {
        throw new Error('No valid query chain found. Connect Project → Folders → Products → Results')
      }
      
      // Get auth token from localStorage
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      
      const response = await fetch('/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Query response data:', data)
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL query failed')
      }
      
      // Flatten the nested results into table rows
      const flattenedResults = flattenResults(data.data)
      console.log('Setting results:', flattenedResults)
      setResults(flattenedResults)
      
      // Extract column names
      if (flattenedResults.length > 0) {
        setColumns(Object.keys(flattenedResults[0]))
      }
      
    } catch (err: any) {
      console.error('Query execution error:', err)
      setError(err.message || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const flattenResults = (data: any): any[] => {
    const rows: any[] = []
    
    // Helper to extract nodes from edges structure
    const extractNodes = (edgesContainer: any): any[] => {
      if (!edgesContainer?.edges) return []
      return edgesContainer.edges.map((e: any) => e.node)
    }
    
    const flatten = (obj: any, prefix: string = '') => {
      if (Array.isArray(obj)) {
        obj.forEach(item => flatten(item, prefix))
      } else if (obj && typeof obj === 'object') {
        // Handle project level
        if (obj.project) {
          flatten(obj.project, prefix)
          return
        }
        
        // Check for known list fields with edges structure
        if (obj.folders?.edges) {
          const folders = extractNodes(obj.folders)
          console.log('Flattening folders:', folders)
          folders.forEach((folder: any) => {
            if (folder.products?.edges) {
              const products = extractNodes(folder.products)
              products.forEach((product: any) => {
                if (product.versions?.edges) {
                  const versions = extractNodes(product.versions)
                  versions.forEach((version: any) => {
                    rows.push({
                      folderName: folder.name,
                      folderType: folder.folderType,
                      folderPath: folder.path,
                      productName: product.name,
                      productType: product.productType,
                      version: version.version,
                      versionAuthor: version.author,
                    })
                  })
                } else {
                  rows.push({
                    folderName: folder.name,
                    folderType: folder.folderType,
                    folderPath: folder.path,
                    productName: product.name,
                    productType: product.productType,
                  })
                }
              })
            } else {
              // No products - just show folder info
              rows.push({
                id: folder.id,
                name: folder.name,
                folderType: folder.folderType,
                path: folder.path,
              })
            }
          })
        } else if (obj.products?.edges) {
          const products = extractNodes(obj.products)
          products.forEach((product: any) => {
            rows.push({
              productName: product.name,
              productType: product.productType,
            })
          })
        }
      }
    }
    
    flatten(data)
    console.log('Flattened results:', rows)
    return rows
  }

  useEffect(() => {
    // Auto-execute when component mounts
    executeQuery()
  }, [])

  return (
    <ResultsContainer>
      <ResultsHeader>
        <ResultsTitle>Query Results ({results.length} rows)</ResultsTitle>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={executeQuery} disabled={loading}>
            {loading ? 'Running...' : 'Re-run Query'}
          </Button>
          <Button onClick={onClose} variant="text">
            Close
          </Button>
        </div>
      </ResultsHeader>
      
      <ResultsBody>
        {loading && <LoadingMessage>Executing query...</LoadingMessage>}
        
        {error && (
          <ErrorMessage>
            <strong>Error:</strong> {error}
          </ErrorMessage>
        )}
        
        {!loading && !error && results.length === 0 && (
          <LoadingMessage>No results found</LoadingMessage>
        )}
        
        {!loading && !error && results.length > 0 && (
          <TableContainer>
            <table>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </ResultsBody>
    </ResultsContainer>
  )
}

export default ResultsNode
