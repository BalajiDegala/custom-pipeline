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

const ColumnChip = styled.div<{ $isDragging?: boolean; $hidden?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.$hidden ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container-highest)'};
  border: 1px solid ${props => props.$hidden ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-outline-variant)'};
  border-radius: 20px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
  opacity: ${props => props.$isDragging ? 0.5 : props.$hidden ? 0.6 : 1};
  text-decoration: ${props => props.$hidden ? 'line-through' : 'none'};
  
  &:hover {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  
  .grip {
    color: var(--md-sys-color-on-surface-variant);
    cursor: grab;
  }
  
  .visibility-toggle {
    cursor: pointer;
    color: ${props => props.$hidden ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-primary)'};
    
    &:hover {
      color: var(--md-sys-color-primary);
    }
  }
`

// Hierarchical View Styled Components
const HierarchyContainer = styled.div`
  padding: 16px;
  overflow: auto;
  height: 100%;
`

const HierarchyNode = styled.div<{ $level: number; $type: string }>`
  margin-left: ${props => props.$level * 24}px;
  margin-bottom: 4px;
`

const HierarchyHeader = styled.div<{ $type: string; $expanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => {
    switch (props.$type) {
      case 'project': return 'var(--md-sys-color-primary-container)';
      case 'department': return 'var(--md-sys-color-secondary-container)';
      case 'artist': return 'var(--md-sys-color-tertiary-container)';
      case 'folder': return 'var(--md-sys-color-surface-container-high)';
      default: return 'var(--md-sys-color-surface-container)';
    }
  }};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }
  
  .expand-icon {
    transition: transform 0.2s;
    transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`

const HierarchyLabel = styled.span`
  font-weight: 500;
  flex: 1;
`

const HierarchyCount = styled.span`
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface);
  padding: 2px 8px;
  border-radius: 12px;
`

const HierarchyChildren = styled.div`
  margin-top: 4px;
  margin-left: 16px;
  border-left: 2px solid var(--md-sys-color-outline-variant);
  padding-left: 8px;
`

const ViewModeToggle = styled.div`
  display: flex;
  gap: 4px;
  background: var(--md-sys-color-surface-container);
  padding: 4px;
  border-radius: 8px;
`

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${props => props.$active ? 'var(--md-sys-color-primary)' : 'transparent'};
  color: ${props => props.$active ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.$active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)'};
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
  allProjects?: string[]
  onClose: () => void
  selectedColumns?: string[]
}

// Hierarchical result structure
interface HierarchicalNode {
  type: string
  name: string
  data: any
  children: HierarchicalNode[]
  expanded?: boolean
}

const ResultsFullPage: React.FC<ResultsFullPageProps> = ({
  resultsNodeId,
  nodes,
  edges,
  projectName,
  allProjects = [],
  onClose,
  selectedColumns: initialSelectedColumns
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [hierarchicalResults, setHierarchicalResults] = useState<HierarchicalNode[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('hierarchy')
  const [columns, setColumns] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [showColumnOrder, setShowColumnOrder] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{rowIdx: number, column: string} | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [statusOptions, setStatusOptions] = useState<{name: string, color: string, state: string}[]>([])
  const [availableUsers, setAvailableUsers] = useState<{name: string, fullName: string}[]>([])

  // Get all projects to query (from allProjects or fallback to projectName)
  const projectsToQuery = allProjects.length > 0 ? allProjects : [projectName]

  // Fetch project statuses and available users
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        
        const response = await fetch(`/api/projects/${projectName}`, { headers })
        if (response.ok) {
          const data = await response.json()
          const statuses = data.statuses || []
          setStatusOptions(statuses.map((s: any) => ({ 
            name: s.name, 
            color: s.color || '#888', 
            state: s.state || 'in_progress' 
          })))
        }
      } catch (e) {
        console.warn('Could not fetch project statuses:', e)
      }
    }
    
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        
        const response = await fetch('/api/users', { headers })
        if (response.ok) {
          const data = await response.json()
          setAvailableUsers(data.map((u: any) => ({ 
            name: u.name, 
            fullName: u.attrib?.fullName || u.name 
          })))
        }
      } catch (e) {
        console.warn('Could not fetch users:', e)
      }
    }
    
    if (projectName) {
      fetchStatuses()
      fetchUsers()
    }
  }, [projectName])

  const buildQueryFromChain = (forProject: string): string => {
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
    const _selectedCols = columnsNode?.config?.selectedColumns || initialSelectedColumns || []

    // Get filter configurations from chain nodes
    const departmentsNode = chain.find(n => n.type === 'departments')
    const artistsNode = chain.find(n => n.type === 'artists')
    const selectedDepartments = departmentsNode?.config?.selectedDepartments || []
    const selectedArtists = artistsNode?.config?.selectedArtists || []

    // Common attrib fields fragment
    const attribFields = `
              attrib {
                fps
                resolutionWidth
                resolutionHeight
                pixelAspect
                clipIn
                clipOut
                frameStart
                frameEnd
                handleStart
                handleEnd
                startDate
                endDate
                description
                priority
              }`

    let query = 'query FlowResults {\n'
    query += `  project(name: "${forProject}") {\n`
    query += `    name\n`
    query += `    code\n`
    
    const foldersNode = chain.find(n => n.type === 'folders')
    const tasksNode = chain.find(n => n.type === 'tasks')
    
    // Handle tasks at project level (without folders)
    if (tasksNode && !foldersNode) {
      // Build tasks query with filters
      const taskFilters: string[] = []
      if (selectedDepartments.length > 0) {
        taskFilters.push(`taskTypes: [${selectedDepartments.map((d: string) => `"${d}"`).join(', ')}]`)
      }
      if (selectedArtists.length > 0) {
        taskFilters.push(`assigneesAny: [${selectedArtists.map((a: string) => `"${a}"`).join(', ')}]`)
      }
      const selectedTasks = tasksNode.config?.selectedTasks || []
      if (selectedTasks.length > 0) {
        taskFilters.push(`ids: [${selectedTasks.map((id: string) => `"${id}"`).join(', ')}]`)
      }
      
      const filterStr = taskFilters.length > 0 ? `${taskFilters.join(', ')}, ` : ''
      query += `    tasks(${filterStr}first: 2000) {\n`
      query += `      edges {\n`
      query += `        node {\n`
      query += `          id\n`
      query += `          name\n`
      query += `          label\n`
      query += `          taskType\n`
      query += `          status\n`
      query += `          assignees\n`
      query += `          folderId\n`
      query += `          tags\n`
      query += `          active\n`
      query += `          createdAt\n`
      query += `          updatedAt\n`
      query += `          createdBy\n`
      query += `          updatedBy\n`
      query += attribFields
      query += `\n        }\n`
      query += `      }\n`
      query += `    }\n`
    }
    
    if (foldersNode) {
      const selectedFolders = foldersNode.config?.selectedFolders || []
      
      if (selectedFolders.length > 0) {
        query += `    folders(ids: [${selectedFolders.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
      } else {
        query += `    folders(first: 2000) {\n`
      }
      
      query += `      edges {\n`
      query += `        node {\n`
      query += `          id\n`
      query += `          name\n`
      query += `          label\n`
      query += `          folderType\n`
      query += `          path\n`
      query += `          status\n`
      query += `          tags\n`
      query += `          active\n`
      query += `          createdAt\n`
      query += `          updatedAt\n`
      query += `          createdBy\n`
      query += `          updatedBy\n`
      query += `          thumbnailId\n`
      query += attribFields
      
      // Add tasks if in chain (nested under folders)
      if (tasksNode) {
        // Build task filters
        const taskFilters: string[] = []
        if (selectedDepartments.length > 0) {
          taskFilters.push(`taskTypes: [${selectedDepartments.map((d: string) => `"${d}"`).join(', ')}]`)
        }
        if (selectedArtists.length > 0) {
          taskFilters.push(`assigneesAny: [${selectedArtists.map((a: string) => `"${a}"`).join(', ')}]`)
        }
        const selectedTasks = tasksNode.config?.selectedTasks || []
        if (selectedTasks.length > 0) {
          taskFilters.push(`ids: [${selectedTasks.map((id: string) => `"${id}"`).join(', ')}]`)
        }
        
        const filterStr = taskFilters.length > 0 ? `${taskFilters.join(', ')}, ` : ''
        query += `\n          tasks(${filterStr}first: 2000) {\n`
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                label\n`
        query += `                taskType\n`
        query += `                status\n`
        query += `                assignees\n`
        query += `                tags\n`
        query += `                active\n`
        query += `                createdAt\n`
        query += `                updatedAt\n`
        query += `                createdBy\n`
        query += `                updatedBy\n`
        query += `                attrib {\n`
        query += `                  fps\n`
        query += `                  resolutionWidth\n`
        query += `                  resolutionHeight\n`
        query += `                  pixelAspect\n`
        query += `                  clipIn\n`
        query += `                  clipOut\n`
        query += `                  frameStart\n`
        query += `                  frameEnd\n`
        query += `                  startDate\n`
        query += `                  endDate\n`
        query += `                  description\n`
        query += `                  priority\n`
        query += `                }\n`
        query += `              }\n`
        query += `            }\n`
        query += `          }\n`
      }
      
      const productsNode = chain.find(n => n.type === 'products')
      if (productsNode) {
        const selectedProducts = productsNode.config?.selectedProducts || []
        
        if (selectedProducts.length > 0) {
          query += `          products(ids: [${selectedProducts.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
        } else {
          query += `          products(first: 2000) {\n`
        }
        
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                productType\n`
        query += `                status\n`
        query += `                tags\n`
        query += `                active\n`
        query += `                createdAt\n`
        query += `                updatedAt\n`
        
        const versionsNode = chain.find(n => n.type === 'versions')
        if (versionsNode) {
          const selectedVersions = versionsNode.config?.selectedVersions || []
          
          if (selectedVersions.length > 0) {
            query += `                versions(ids: [${selectedVersions.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
          } else {
            query += `                versions(first: 2000) {\n`
          }
          
          query += `                  edges {\n`
          query += `                    node {\n`
          query += `                      id\n`
          query += `                      version\n`
          query += `                      author\n`
          query += `                      status\n`
          query += `                      tags\n`
          query += `                      active\n`
          query += `                      createdAt\n`
          query += `                      updatedAt\n`
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
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      // Query all selected projects
      const allFlattenedResults: any[] = []
      
      for (const proj of projectsToQuery) {
        const query = buildQueryFromChain(proj)
        
        if (!query) {
          continue // Skip if no valid query for this project
        }
        
        const response = await fetch('/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query })
        })
        
        if (!response.ok) {
          console.warn(`HTTP error for project ${proj}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.errors) {
          console.warn(`GraphQL error for project ${proj}:`, data.errors[0]?.message)
          continue
        }
        
        const flattenedResults = flattenResults(data.data, proj)
        allFlattenedResults.push(...flattenedResults)
      }
      
      if (allFlattenedResults.length === 0) {
        throw new Error('No results found. Connect Project → Tasks or Project → Folders → Results')
      }
      
      setResults(allFlattenedResults)
      
      // Build hierarchical results based on the node chain
      const hierarchical = buildHierarchicalResults(allFlattenedResults)
      setHierarchicalResults(hierarchical)
      
      // Expand ALL nodes by default for easier viewing
      if (hierarchical.length > 0) {
        const initialExpanded = new Set<string>()
        const expandAll = (nodes: HierarchicalNode[], parentPath: string = '') => {
          nodes.forEach(node => {
            const path = parentPath ? `${parentPath}/${node.name}` : node.name
            initialExpanded.add(path)
            if (node.children && node.children.length > 0) {
              expandAll(node.children, path)
            }
          })
        }
        expandAll(hierarchical)
        setExpandedNodes(initialExpanded)
      }
      
      if (allFlattenedResults.length > 0) {
        // Get all columns, but hide internal ones (starting with _) by default
        const allCols = Object.keys(allFlattenedResults[0])
        const visibleCols = allCols.filter(col => !col.startsWith('_'))
        const internalCols = allCols.filter(col => col.startsWith('_'))
        
        setColumns(allCols)
        setColumnOrder(visibleCols)
        setHiddenColumns(new Set(internalCols))
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const flattenResults = (data: any, forProject: string): any[] => {
    const rows: any[] = []
    
    const extractNodes = (edgesContainer: any): any[] => {
      if (!edgesContainer?.edges) return []
      return edgesContainer.edges.map((e: any) => e.node)
    }
    
    // Helper to flatten attrib fields
    const flattenAttrib = (attrib: any, prefix: string = '') => {
      if (!attrib) return {}
      const result: any = {}
      Object.entries(attrib).forEach(([key, value]) => {
        if (key !== '__typename' && value !== null && value !== undefined) {
          result[prefix + key] = value
        }
      })
      return result
    }
    
    // Use the project passed to this function
    const currentProjectName = forProject || projectName || 'Unknown'
    
    const flatten = (obj: any, _prefix: string = '') => {
      if (Array.isArray(obj)) {
        obj.forEach(item => flatten(item, _prefix))
      } else if (obj && typeof obj === 'object') {
        // Skip the project wrapper, go directly to its contents
        if (obj.project) {
          const projectData = obj.project
          // Process tasks at project level
          if (projectData.tasks?.edges) {
            const tasks = extractNodes(projectData.tasks)
            tasks.forEach((task: any) => {
              rows.push({
                _entityType: 'task',
                _entityId: task.id,
                _projectName: currentProjectName,
                projectName: currentProjectName,
                id: task.id,
                name: task.name || '',
                label: task.label || '',
                taskType: task.taskType || '',
                status: task.status || '',
                assignees: task.assignees?.join(', ') || '',
                folderId: task.folderId || '',
                tags: task.tags?.join(', ') || '',
                active: task.active,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                createdBy: task.createdBy || '',
                updatedBy: task.updatedBy || '',
                ...flattenAttrib(task.attrib),
              })
            })
          }
          // Process folders
          if (projectData.folders?.edges) {
            const folders = extractNodes(projectData.folders)
            folders.forEach((folder: any) => {
              const folderAttrib = flattenAttrib(folder.attrib, 'folder_')
              
              if (folder.tasks?.edges) {
                // Folder has tasks - create task rows
                const tasks = extractNodes(folder.tasks)
                tasks.forEach((task: any) => {
                  rows.push({
                    _entityType: 'task',
                    _entityId: task.id,
                    _folderId: folder.id,
                    _projectName: currentProjectName,
                    projectName: currentProjectName,
                    folderId: folder.id,
                    folderName: folder.name,
                    folderPath: folder.path,
                    folderType: folder.folderType,
                    folderStatus: folder.status,
                    id: task.id,
                    name: task.name || '',
                    label: task.label || '',
                    taskType: task.taskType || '',
                    status: task.status || '',
                    assignees: task.assignees?.join(', ') || '',
                    tags: task.tags?.join(', ') || '',
                    active: task.active,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    createdBy: task.createdBy || '',
                    updatedBy: task.updatedBy || '',
                    ...flattenAttrib(task.attrib, 'task_'),
                    ...folderAttrib,
                  })
                })
              } else if (folder.products?.edges) {
                // Folder has products
                const products = extractNodes(folder.products)
                products.forEach((product: any) => {
                  if (product.versions?.edges) {
                    const versions = extractNodes(product.versions)
                    versions.forEach((version: any) => {
                      rows.push({
                        _entityType: 'version',
                        _entityId: version.id,
                        _folderId: folder.id,
                        _productId: product.id,
                        _projectName: currentProjectName,
                        projectName: currentProjectName,
                        folderId: folder.id,
                        folderName: folder.name,
                        folderPath: folder.path,
                        folderType: folder.folderType,
                        folderStatus: folder.status,
                        productId: product.id,
                        productName: product.name,
                        productType: product.productType,
                        productStatus: product.status || '',
                        id: version.id,
                        name: `v${version.version}`,
                        version: version.version,
                        versionAuthor: version.author,
                        status: version.status,
                        tags: version.tags?.join(', ') || '',
                        active: version.active,
                        createdAt: version.createdAt,
                        updatedAt: version.updatedAt,
                        ...folderAttrib,
                      })
                    })
                  } else {
                    rows.push({
                      _entityType: 'product',
                      _entityId: product.id,
                      _folderId: folder.id,
                      _projectName: currentProjectName,
                      projectName: currentProjectName,
                      folderId: folder.id,
                      folderName: folder.name,
                      folderPath: folder.path,
                      folderType: folder.folderType,
                      folderStatus: folder.status,
                      id: product.id,
                      name: product.name,
                      productType: product.productType,
                      status: product.status || '',
                      tags: product.tags?.join(', ') || '',
                      active: product.active,
                      createdAt: product.createdAt,
                      updatedAt: product.updatedAt,
                      ...folderAttrib,
                    })
                  }
                })
              } else {
                // Just folders, no nested entities
                rows.push({
                  _entityType: 'folder',
                  _entityId: folder.id,
                  _projectName: currentProjectName,
                  projectName: currentProjectName,
                  id: folder.id,
                  name: folder.name,
                  label: folder.label || '',
                  folderType: folder.folderType,
                  path: folder.path,
                  status: folder.status,
                  tags: folder.tags?.join(', ') || '',
                  active: folder.active,
                  createdAt: folder.createdAt,
                  updatedAt: folder.updatedAt,
                  createdBy: folder.createdBy || '',
                  updatedBy: folder.updatedBy || '',
                  thumbnailId: folder.thumbnailId || '',
                  ...flattenAttrib(folder.attrib),
                })
              }
            })
          }
          return
        }
      }
    }
    
    flatten(data)
    return rows
  }

  // Build hierarchical results - DYNAMIC based on nodes in the flow
  const buildHierarchicalResults = (flatResults: any[]): HierarchicalNode[] => {
    if (flatResults.length === 0) return []
    
    // Find what nodes are in the chain to determine hierarchy levels
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
    
    // Check which nodes are in the flow
    const hasDepartmentsNode = chain.some(n => n.type === 'departments')
    const hasArtistsNode = chain.some(n => n.type === 'artists')
    
    // Group by project first (always)
    const projectGroups = new Map<string, any[]>()
    flatResults.forEach(item => {
      const projectKey = item.projectName || item._projectName || projectName || 'Unknown'
      if (!projectGroups.has(projectKey)) {
        projectGroups.set(projectKey, [])
      }
      projectGroups.get(projectKey)!.push(item)
    })
    
    const projectNodes: HierarchicalNode[] = []
    
    projectGroups.forEach((projectItems, projectKey) => {
      // If no departments or artists node, show data directly under project
      if (!hasDepartmentsNode && !hasArtistsNode) {
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: projectItems,
          children: [],
          expanded: true,
        })
        return
      }
      
      // If only artists node (no departments), group by artist under project
      if (!hasDepartmentsNode && hasArtistsNode) {
        const artistGroups = new Map<string, any[]>()
        projectItems.forEach(item => {
          const artistKey = item.assignees || 'Unassigned'
          if (!artistGroups.has(artistKey)) {
            artistGroups.set(artistKey, [])
          }
          artistGroups.get(artistKey)!.push(item)
        })
        
        const artistNodes: HierarchicalNode[] = []
        artistGroups.forEach((artistItems, artistKey) => {
          artistNodes.push({
            type: 'artist',
            name: artistKey,
            data: artistItems,
            children: [],
            expanded: true,
          })
        })
        
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: null,
          children: artistNodes,
          expanded: true,
        })
        return
      }
      
      // If only departments node (no artists), group by department under project
      if (hasDepartmentsNode && !hasArtistsNode) {
        const deptGroups = new Map<string, any[]>()
        projectItems.forEach(item => {
          const deptKey = item.taskType || item.folderType || 'General'
          if (!deptGroups.has(deptKey)) {
            deptGroups.set(deptKey, [])
          }
          deptGroups.get(deptKey)!.push(item)
        })
        
        const deptNodes: HierarchicalNode[] = []
        deptGroups.forEach((deptItems, deptKey) => {
          deptNodes.push({
            type: 'department',
            name: deptKey,
            data: deptItems,
            children: [],
            expanded: true,
          })
        })
        
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: null,
          children: deptNodes,
          expanded: true,
        })
        return
      }
      
      // Both departments and artists nodes: Project → Department → Artist
      const deptGroups = new Map<string, any[]>()
      projectItems.forEach(item => {
        const deptKey = item.taskType || item.folderType || 'General'
        if (!deptGroups.has(deptKey)) {
          deptGroups.set(deptKey, [])
        }
        deptGroups.get(deptKey)!.push(item)
      })
      
      const deptNodes: HierarchicalNode[] = []
      
      deptGroups.forEach((deptItems, deptKey) => {
        // Group by artist (assignees)
        const artistGroups = new Map<string, any[]>()
        deptItems.forEach(item => {
          const artistKey = item.assignees || 'Unassigned'
          if (!artistGroups.has(artistKey)) {
            artistGroups.set(artistKey, [])
          }
          artistGroups.get(artistKey)!.push(item)
        })
        
        const artistNodes: HierarchicalNode[] = []
        
        artistGroups.forEach((artistItems, artistKey) => {
          artistNodes.push({
            type: 'artist',
            name: artistKey,
            data: artistItems,
            children: [],
            expanded: true,
          })
        })
        
        deptNodes.push({
          type: 'department',
          name: deptKey,
          data: null,
          children: artistNodes,
          expanded: true,
        })
      })
      
      projectNodes.push({
        type: 'project',
        name: projectKey,
        data: null,
        children: deptNodes,
        expanded: true,
      })
    })
    
    return projectNodes
  }

  // Toggle node expansion
  const toggleNodeExpansion = (nodePath: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodePath)) {
        newSet.delete(nodePath)
      } else {
        newSet.add(nodePath)
      }
      return newSet
    })
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

  // Editable columns mapping - which columns can be edited and their entity field
  const editableColumns: Record<string, { entityType: string, field: string, isAttrib?: boolean, isArray?: boolean }> = {
    status: { entityType: 'folder', field: 'status' },
    folderStatus: { entityType: 'folder', field: 'status' },
    taskStatus: { entityType: 'task', field: 'status' },
    name: { entityType: 'folder', field: 'name' },
    folderName: { entityType: 'folder', field: 'name' },
    taskName: { entityType: 'task', field: 'name' },
    label: { entityType: 'folder', field: 'label' },
    folderLabel: { entityType: 'folder', field: 'label' },
    taskLabel: { entityType: 'task', field: 'label' },
    assignees: { entityType: 'task', field: 'assignees', isArray: true },
    priority: { entityType: 'folder', field: 'priority', isAttrib: true },
    fps: { entityType: 'folder', field: 'fps', isAttrib: true },
    resolutionWidth: { entityType: 'folder', field: 'resolutionWidth', isAttrib: true },
    resolutionHeight: { entityType: 'folder', field: 'resolutionHeight', isAttrib: true },
    frameStart: { entityType: 'folder', field: 'frameStart', isAttrib: true },
    frameEnd: { entityType: 'folder', field: 'frameEnd', isAttrib: true },
    clipIn: { entityType: 'folder', field: 'clipIn', isAttrib: true },
    clipOut: { entityType: 'folder', field: 'clipOut', isAttrib: true },
    description: { entityType: 'folder', field: 'description', isAttrib: true },
    folder_priority: { entityType: 'folder', field: 'priority', isAttrib: true },
    folder_fps: { entityType: 'folder', field: 'fps', isAttrib: true },
    task_priority: { entityType: 'task', field: 'priority', isAttrib: true },
    task_fps: { entityType: 'task', field: 'fps', isAttrib: true },
  }

  const isColumnEditable = (column: string): boolean => {
    // Don't allow editing internal fields or IDs
    if (column.startsWith('_') || column.endsWith('Id') || column === 'id') return false
    if (column.includes('createdAt') || column.includes('updatedAt')) return false
    if (column.includes('createdBy') || column.includes('updatedBy')) return false
    // Allow assignees editing
    if (column === 'assignees') return true
    return column in editableColumns || column.includes('status') || column.includes('Name') || column.includes('priority')
  }

  const isStatusColumn = (column: string): boolean => {
    return column.toLowerCase().includes('status')
  }

  const isAssigneesColumn = (column: string): boolean => {
    return column === 'assignees'
  }

  // Single click to start editing (CSV-like behavior)
  const handleCellClick = (rowIdx: number, column: string, currentValue: any) => {
    if (!isColumnEditable(column)) return
    setEditingCell({ rowIdx, column })
    setEditValue(String(currentValue ?? ''))
  }

  const handleCellEditSave = async () => {
    if (!editingCell) return
    
    const row = sortedResults[editingCell.rowIdx]
    const column = editingCell.column
    
    // Determine entity type and ID
    let entityType = row._entityType || 'folder'
    let entityId = row._entityId || row.id
    
    // Special handling for prefixed columns and assignees
    if (column === 'assignees' || column.startsWith('task')) {
      entityType = 'task'
      entityId = row.taskId || row._entityId || row.id
    } else if (column.startsWith('folder')) {
      entityType = 'folder'
      entityId = row.folderId || row._folderId || row._entityId
    } else if (column.startsWith('product')) {
      entityType = 'product'
      entityId = row.productId || row._productId
    } else if (column.startsWith('version')) {
      entityType = 'version'
      entityId = row.versionId
    }
    
    // Get the correct project for this row
    const rowProject = row._projectName || row.projectName || projectName
    
    if (!entityId) {
      alert('Cannot determine entity ID for update')
      setEditingCell(null)
      return
    }
    
    setSaving(true)
    try {
      // Determine the actual field name
      let fieldName = column
      let isAttrib = false
      let isArray = false
      
      if (editableColumns[column]) {
        fieldName = editableColumns[column].field
        isAttrib = editableColumns[column].isAttrib || false
        isArray = editableColumns[column].isArray || false
      } else if (column.includes('Status')) {
        fieldName = 'status'
      } else if (column.includes('Name') && !column.includes('folder')) {
        fieldName = 'name'
      }
      
      // Build the PATCH request body
      let body: any = {}
      let valueToSave: any = editValue
      
      // Handle array fields like assignees
      if (isArray) {
        // Split by comma and trim whitespace
        valueToSave = editValue.split(',').map(v => v.trim()).filter(v => v.length > 0)
      }
      
      if (isAttrib) {
        body = { attrib: { [fieldName]: valueToSave } }
      } else {
        body = { [fieldName]: valueToSave }
      }
      
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      // Use the REST API to update the entity with correct project
      const endpoint = `/api/projects/${rowProject}/${entityType}s/${entityId}`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to update: ${response.status}`)
      }
      
      // Update local state
      const updatedResults = [...results]
      const originalIdx = results.findIndex(r => 
        (r._entityId === entityId) || (r.id === entityId) || 
        (r.taskId === entityId) || (r.folderId === entityId)
      )
      if (originalIdx >= 0) {
        updatedResults[originalIdx] = { ...updatedResults[originalIdx], [column]: editValue }
        setResults(updatedResults)
      }
      
      setEditingCell(null)
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCellEditCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellEditSave()
    } else if (e.key === 'Escape') {
      handleCellEditCancel()
    }
  }

  const exportCSV = () => {
    const orderedCols = columnOrder.length > 0 ? columnOrder : columns
    const exportCols = orderedCols.filter(col => !hiddenColumns.has(col))
    const csvContent = [
      exportCols.join(','),
      ...sortedResults.map(row => 
        exportCols.map(col => {
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

  const openInNewTab = () => {
    // Create a new window with the results
    const newWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!newWindow) {
      alert('Popup blocked! Please allow popups for this site.')
      return
    }

    const orderedCols = columnOrder.length > 0 ? columnOrder : columns
    const exportCols = orderedCols.filter(col => !hiddenColumns.has(col))
    
    // Build HTML content for the new window
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Flow Results - ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px 24px;
      background: #252542;
      border-radius: 8px;
    }
    .title { font-size: 24px; font-weight: 600; }
    .count {
      padding: 4px 12px;
      background: #3a3a5c;
      border-radius: 16px;
      font-size: 14px;
      margin-left: 16px;
    }
    .btn {
      padding: 8px 16px;
      background: #4a4a7c;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
    }
    .btn:hover { background: #5a5a9c; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #252542;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #3a3a5c;
    }
    th {
      background: #1a1a2e;
      font-weight: 600;
      cursor: pointer;
      position: sticky;
      top: 0;
    }
    th:hover { background: #2a2a4e; }
    tr:hover td { background: #2a2a4e; }
    .container { overflow: auto; max-height: calc(100vh - 120px); }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="title">Flow Results</span>
      <span class="count">${sortedResults.length} rows</span>
    </div>
    <div>
      <button class="btn" onclick="exportCSV()">Export CSV</button>
      <button class="btn" onclick="window.print()">Print</button>
    </div>
  </div>
  <div class="container">
    <table>
      <thead>
        <tr>
          ${exportCols.map(col => `<th>${col}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${sortedResults.map(row => `
          <tr>
            ${exportCols.map(col => `<td>${row[col] ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <script>
    const data = ${JSON.stringify(sortedResults)};
    const columns = ${JSON.stringify(exportCols)};
    
    function exportCSV() {
      const csvContent = [
        columns.join(','),
        ...data.map(row => 
          columns.map(col => {
            const val = row[col];
            const escaped = String(val ?? '').replace(/"/g, '""');
            return '"' + escaped + '"';
          }).join(',')
        )
      ].join('\\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'flow_results_${projectName}_${new Date().toISOString().slice(0, 10)}.csv';
      link.click();
    }
  </script>
</body>
</html>
    `
    
    newWindow.document.write(htmlContent)
    newWindow.document.close()
  }

  const toggleColumnVisibility = (col: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(col)) {
        newSet.delete(col)
      } else {
        newSet.add(col)
      }
      return newSet
    })
  }

  const orderedColumns = columnOrder.length > 0 ? columnOrder : columns
  const visibleColumns = orderedColumns.filter(col => !hiddenColumns.has(col))

  // Hierarchy node component for rendering tree structure
  const HierarchyNodeComponent = ({ 
    node, 
    path, 
    level,
    expandedNodes,
    toggleNodeExpansion,
    visibleColumns
  }: { 
    node: HierarchicalNode
    path: string
    level: number
    expandedNodes: Set<string>
    toggleNodeExpansion: (path: string) => void
    visibleColumns: string[]
  }) => {
    const isExpanded = expandedNodes.has(path)
    const hasChildren = node.children && node.children.length > 0
    const isLeafWithData = Array.isArray(node.data) && node.data.length > 0
    const itemCount = isLeafWithData 
      ? (node.data as any[]).length 
      : hasChildren 
        ? node.children.length 
        : 0
    
    // Type icons only (no labels)
    const typeIcons: Record<string, string> = {
      project: '📁',
      department: '🏢',
      artist: '👤',
      folder: '📂',
      task: '✓',
      product: '📦',
      version: '🔢',
      results: '📊',
    }
    
    // Type colors
    const typeColors: Record<string, string> = {
      project: '#4CAF50',
      department: '#2196F3',
      artist: '#9C27B0',
      folder: '#FF9800',
      task: '#00BCD4',
      product: '#E91E63',
      version: '#607D8B',
      results: '#795548',
    }

    return (
      <HierarchyNode $level={level}>
        <HierarchyHeader 
          onClick={() => (hasChildren || isLeafWithData) && toggleNodeExpansion(path)}
          style={{ cursor: (hasChildren || isLeafWithData) ? 'pointer' : 'default' }}
        >
          {(hasChildren || isLeafWithData) && (
            <Icon 
              icon={isExpanded ? 'expand_more' : 'chevron_right'} 
              style={{ marginRight: 8, opacity: 0.7 }}
            />
          )}
          <span style={{ marginRight: 6 }}>{typeIcons[node.type] || '•'}</span>
          <HierarchyLabel style={{ color: typeColors[node.type] || '#999', fontWeight: 600 }}>
            {node.name}
          </HierarchyLabel>
          {itemCount > 0 && (
            <HierarchyCount>
              {itemCount}
            </HierarchyCount>
          )}
        </HierarchyHeader>
        
        {isExpanded && isLeafWithData && (
          <HierarchyChildren>
            <TableContainer style={{ margin: '8px 0', marginLeft: 24 }}>
              <table>
                <thead>
                  <tr>
                    {visibleColumns.slice(0, 8).map(col => (
                      <th key={col} style={{ fontSize: 11, padding: '6px 8px' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(node.data as any[]).map((item, itemIdx) => (
                    <tr key={itemIdx}>
                      {visibleColumns.slice(0, 8).map(col => (
                        <td key={col} style={{ fontSize: 12, padding: '4px 8px' }}>
                          {item[col] !== undefined ? String(item[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          </HierarchyChildren>
        )}
        
        {isExpanded && hasChildren && !isLeafWithData && (
          <HierarchyChildren>
            {node.children.map((child, childIdx) => (
              <HierarchyNodeComponent
                key={`${child.type}-${child.name}-${childIdx}`}
                node={child}
                path={`${path}/${child.name}`}
                level={level + 1}
                expandedNodes={expandedNodes}
                toggleNodeExpansion={toggleNodeExpansion}
                visibleColumns={visibleColumns}
              />
            ))}
          </HierarchyChildren>
        )}
      </HierarchyNode>
    )
  }

  return (
    <FullScreenOverlay onClick={onClose}>
      <ResultsModal onClick={e => e.stopPropagation()}>
        <ResultsHeader>
          <HeaderLeft>
            <ResultsTitle>Query Results</ResultsTitle>
            <ResultsCount>{results.length} rows</ResultsCount>
            <ViewModeToggle>
              <ViewModeButton 
                $active={viewMode === 'table'} 
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <Icon icon="table_rows" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'hierarchy'} 
                onClick={() => setViewMode('hierarchy')}
                title="Hierarchy View"
              >
                <Icon icon="account_tree" />
              </ViewModeButton>
            </ViewModeToggle>
          </HeaderLeft>
          <HeaderActions>
            <Button onClick={() => setShowColumnOrder(!showColumnOrder)} variant="text">
              <Icon icon="view_column" /> Column Order
            </Button>
            <Button onClick={openInNewTab} disabled={results.length === 0} variant="text">
              <Icon icon="open_in_new" /> Open in New Tab
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
            <ColumnOrderTitle>Drag to reorder, click eye to toggle visibility (affects table and CSV export):</ColumnOrderTitle>
            <ColumnChips>
              {orderedColumns.map(col => (
                <ColumnChip
                  key={col}
                  $isDragging={draggedColumn === col}
                  $hidden={hiddenColumns.has(col)}
                  draggable
                  onDragStart={() => handleColumnDragStart(col)}
                  onDragOver={(e) => handleColumnDragOver(e, col)}
                  onDragEnd={handleColumnDragEnd}
                >
                  <Icon icon="drag_indicator" className="grip" />
                  {col}
                  <Icon 
                    icon={hiddenColumns.has(col) ? "visibility_off" : "visibility"} 
                    className="visibility-toggle"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      toggleColumnVisibility(col)
                    }}
                  />
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
          
          {!loading && !error && results.length > 0 && viewMode === 'hierarchy' && (
            <HierarchyContainer>
              {hierarchicalResults.length > 0 ? (
                hierarchicalResults.map((node, idx) => (
                  <HierarchyNodeComponent
                    key={`${node.type}-${node.name}-${idx}`}
                    node={node}
                    path={node.name}
                    level={0}
                    expandedNodes={expandedNodes}
                    toggleNodeExpansion={toggleNodeExpansion}
                    visibleColumns={visibleColumns}
                  />
                ))
              ) : (
                <LoadingMessage>Building hierarchy...</LoadingMessage>
              )}
            </HierarchyContainer>
          )}
          
          {!loading && !error && results.length > 0 && viewMode === 'table' && (
            <TableContainer>
              <table>
                <thead>
                  <tr>
                    {visibleColumns.map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className={`sortable ${sortColumn === col ? `sorted-${sortDirection}` : ''}`}
                        title={isColumnEditable(col) ? 'Click cells to edit' : ''}
                      >
                        {col}
                        {isColumnEditable(col) && <span style={{ marginLeft: 4, opacity: 0.5, fontSize: 10 }}>✎</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((row, idx) => (
                    <tr key={idx}>
                      {visibleColumns.map(col => (
                        <td 
                          key={col}
                          onClick={() => handleCellClick(idx, col, row[col])}
                          style={{ 
                            cursor: isColumnEditable(col) ? 'text' : 'default',
                            backgroundColor: editingCell?.rowIdx === idx && editingCell?.column === col 
                              ? 'var(--md-sys-color-primary-container)' 
                              : undefined
                          }}
                        >
                          {editingCell?.rowIdx === idx && editingCell?.column === col ? (
                            isStatusColumn(col) && statusOptions.length > 0 ? (
                              <select
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value)
                                  // Auto-save on select change
                                  setTimeout(() => handleCellEditSave(), 100)
                                }}
                                onBlur={handleCellEditSave}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              >
                                {statusOptions.map(s => (
                                  <option key={s.name} value={s.name} style={{ color: s.color }}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            ) : isAssigneesColumn(col) && availableUsers.length > 0 ? (
                              <select
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value)
                                  // Auto-save on select change
                                  setTimeout(() => handleCellEditSave(), 100)
                                }}
                                onBlur={handleCellEditSave}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              >
                                <option value="">Unassigned</option>
                                {availableUsers.map(u => (
                                  <option key={u.name} value={u.name}>
                                    {u.fullName || u.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={handleCellEditSave}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              />
                            )
                          ) : (
                            <span title={isColumnEditable(col) ? 'Click to edit' : ''}>
                              {isStatusColumn(col) ? (
                                <span style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: statusOptions.find(s => s.name === row[col])?.color || 'var(--md-sys-color-surface-variant)',
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}>
                                  {row[col]}
                                </span>
                              ) : (
                                row[col]
                              )}
                            </span>
                          )}
                        </td>
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
