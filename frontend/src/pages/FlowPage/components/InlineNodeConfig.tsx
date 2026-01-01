import React, { useState, useEffect } from 'react'
import { Button, Icon, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const InlineConfigContainer = styled.div`
  position: absolute;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const ConfigHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const ConfigTitle = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
`

const SearchContainer = styled.div`
  padding: 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const OptionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 250px;
`

const OptionItem = styled.label<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  background: ${props => props.$selected ? 'var(--md-sys-color-primary-container)' : 'transparent'};
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--md-sys-color-primary);
  }
`

const OptionInfo = styled.div`
  flex: 1;
  overflow: hidden;
  
  .name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .meta {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const ConfigFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const EmptyState = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

const LoadingState = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

const SelectAllRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--md-sys-color-surface);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant);
`

interface FlowNode {
  id: string
  type: string
  label: string
  config?: any
  x: number
  y: number
  width: number
  height: number
}

interface FlowEdge {
  id: string
  source: string
  target: string
}

interface InlineNodeConfigProps {
  node: FlowNode
  projectName: string
  position: { x: number; y: number }
  onClose: () => void
  onSave: (nodeId: string, config: any) => void
  nodes?: FlowNode[]
  edges?: FlowEdge[]
}

const InlineNodeConfig: React.FC<InlineNodeConfigProps> = ({
  node,
  projectName,
  position,
  onClose,
  onSave,
  nodes = [],
  edges = []
}) => {
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>(node.config?.selectedItems || [])
  const [loading, setLoading] = useState(true)

  // Get upstream node selections for cascading filters
  const getUpstreamContext = () => {
    const context: {
      selectedDepartments?: string[]
      selectedArtists?: string[]
      selectedFolders?: string[]
      selectedTasks?: string[]
    } = {}
    
    // Find all nodes connected upstream of this node
    const findUpstream = (nodeId: string): FlowNode[] => {
      const incomingEdge = edges.find(e => e.target === nodeId)
      if (!incomingEdge) return []
      const sourceNode = nodes.find(n => n.id === incomingEdge.source)
      if (!sourceNode) return []
      return [sourceNode, ...findUpstream(sourceNode.id)]
    }
    
    const upstreamNodes = findUpstream(node.id)
    
    upstreamNodes.forEach(n => {
      if (n.type === 'departments' && n.config?.selectedDepartments?.length > 0) {
        context.selectedDepartments = n.config.selectedDepartments
      }
      if (n.type === 'artists' && n.config?.selectedArtists?.length > 0) {
        context.selectedArtists = n.config.selectedArtists
      }
      if (n.type === 'folders' && n.config?.selectedFolders?.length > 0) {
        context.selectedFolders = n.config.selectedFolders
      }
      if (n.type === 'tasks' && n.config?.selectedTasks?.length > 0) {
        context.selectedTasks = n.config.selectedTasks
      }
    })
    
    return context
  }

  useEffect(() => {
    fetchOptions()
  }, [node.type, projectName])

  useEffect(() => {
    // Restore selected items from node config
    if (node.config) {
      const configKey = getConfigKey(node.type)
      setSelected(node.config[configKey] || [])
    }
  }, [node.id, node.config])

  const getConfigKey = (type: string): string => {
    switch (type) {
      case 'project': return 'selectedProjects'
      case 'folders': return 'selectedFolders'
      case 'products': return 'selectedProducts'
      case 'versions': return 'selectedVersions'
      case 'tasks': return 'selectedTasks'
      case 'departments': return 'selectedDepartments'
      case 'artists': return 'selectedArtists'
      case 'columns': return 'selectedColumns'
      default: return 'selectedItems'
    }
  }

  const fetchOptions = async () => {
    setLoading(true)
    try {
      const upstreamContext = getUpstreamContext()
      const query = buildQuery(node.type, upstreamContext)
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      const response = await fetch('/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { projectName } })
      })
      
      const data = await response.json()
      const extractedOptions = extractOptions(data, node.type, upstreamContext)
      setOptions(extractedOptions)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildQuery = (type: string, context: ReturnType<typeof getUpstreamContext>): string => {
    switch (type) {
      case 'project':
        return `query GetProjects {
          projects(first: 100) {
            edges { node { name code active } }
          }
        }`
      case 'folders':
        return `query GetFolders($projectName: String!) {
          project(name: $projectName) {
            folders(first: 2000) {
              edges { node { id name folderType path } }
            }
          }
        }`
      case 'products':
        return `query GetProducts($projectName: String!) {
          project(name: $projectName) {
            products(first: 2000) {
              edges { node { id name productType } }
            }
          }
        }`
      case 'versions':
        return `query GetVersions($projectName: String!) {
          project(name: $projectName) {
            versions(first: 2000) {
              edges { node { id version author } }
            }
          }
        }`
      case 'tasks':
        // Tasks query with optional filters
        return `query GetTasks($projectName: String!) {
          project(name: $projectName) {
            tasks(first: 2000) {
              edges { node { id name taskType status assignees } }
            }
          }
        }`
      case 'artists':
        // Query users with projectName to filter by project access (avoids permission issues)
        return `query GetUsers($projectName: String!) {
          users(projectName: $projectName, first: 2000) {
            edges { node { name attrib { fullName } } }
          }
        }`
      case 'departments':
        // Departments are typically task types or custom attribute
        return `query GetTaskTypes($projectName: String!) {
          project(name: $projectName) {
            tasks(first: 2000) {
              edges { node { taskType } }
            }
          }
        }`
      case 'columns':
        // Return available column options
        return `query GetSchema { __type(name: "FolderNode") { fields { name } } }`
      default:
        return ''
    }
  }

  const extractOptions = (data: any, type: string, context: ReturnType<typeof getUpstreamContext>): any[] => {
    try {
      switch (type) {
        case 'project':
          return data?.data?.projects?.edges?.map((e: any) => ({
            id: e.node.name,
            name: e.node.name,
            meta: e.node.active ? `${e.node.code} • Active` : `${e.node.code} • Inactive`
          })) || []
        case 'folders':
          return data?.data?.project?.folders?.edges?.map((e: any) => ({
            id: e.node.id,
            name: e.node.name,
            meta: `${e.node.folderType} • ${e.node.path}`
          })) || []
        case 'products':
          return data?.data?.project?.products?.edges?.map((e: any) => ({
            id: e.node.id,
            name: e.node.name,
            meta: e.node.productType
          })) || []
        case 'versions':
          return data?.data?.project?.versions?.edges?.map((e: any) => ({
            id: e.node.id,
            name: `v${e.node.version}`,
            meta: e.node.author
          })) || []
        case 'tasks': {
          let tasks = data?.data?.project?.tasks?.edges?.map((e: any) => ({
            id: e.node.id,
            name: e.node.name,
            taskType: e.node.taskType,
            status: e.node.status,
            assignees: e.node.assignees || [],
            meta: `${e.node.taskType} • ${e.node.status}`
          })) || []
          
          // Filter by departments (task types) if selected upstream
          if (context.selectedDepartments?.length) {
            tasks = tasks.filter((t: any) => context.selectedDepartments!.includes(t.taskType))
          }
          
          // Filter by artists (assignees) if selected upstream
          if (context.selectedArtists?.length) {
            tasks = tasks.filter((t: any) => 
              t.assignees.some((a: string) => context.selectedArtists!.includes(a))
            )
          }
          
          return tasks
        }
        case 'artists': {
          let users = data?.data?.users?.edges?.map((e: any) => ({
            id: e.node.name,
            name: e.node.attrib?.fullName || e.node.name,
            meta: 'User'
          })) || []
          
          // If departments are selected upstream, we could filter users by tasks they're assigned to
          // This would require an additional query, so for now we show all users
          
          return users
        }
        case 'departments': {
          const taskTypes = new Set<string>()
          data?.data?.project?.tasks?.edges?.forEach((e: any) => {
            if (e.node.taskType) taskTypes.add(e.node.taskType)
          })
          return Array.from(taskTypes).map(t => ({ id: t, name: t, meta: 'Task Type' }))
        }
        case 'columns':
          return [
            { id: 'id', name: 'ID', meta: 'Entity ID' },
            { id: 'name', name: 'Name', meta: 'Entity name' },
            { id: 'folderType', name: 'Folder Type', meta: 'Type of folder' },
            { id: 'path', name: 'Path', meta: 'Folder path' },
            { id: 'status', name: 'Status', meta: 'Entity status' },
            { id: 'productName', name: 'Product Name', meta: 'Product name' },
            { id: 'productType', name: 'Product Type', meta: 'Type of product' },
            { id: 'version', name: 'Version', meta: 'Version number' },
            { id: 'author', name: 'Author', meta: 'Version author' },
            { id: 'createdAt', name: 'Created At', meta: 'Creation date' },
            { id: 'taskName', name: 'Task Name', meta: 'Task name' },
            { id: 'taskType', name: 'Task Type', meta: 'Type of task' },
            { id: 'assignees', name: 'Assignees', meta: 'Assigned users' },
          ]
        default:
          return []
      }
    } catch {
      return []
    }
  }

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase()) ||
    (opt.meta && opt.meta.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleOption = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelected(filteredOptions.map(o => o.id))
  const clearAll = () => setSelected([])
  
  // Select only active projects (for project node)
  const selectAllActive = () => {
    const activeProjects = options.filter(o => o.meta?.includes('Active'))
    setSelected(activeProjects.map(o => o.id))
  }

  const handleSave = () => {
    const configKey = getConfigKey(node.type)
    onSave(node.id, { [configKey]: selected })
    onClose()
  }

  // Adjust position to stay in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 340),
    y: Math.min(position.y, window.innerHeight - 420)
  }

  return (
    <InlineConfigContainer style={{ left: adjustedPosition.x, top: adjustedPosition.y }}>
      <ConfigHeader>
        <ConfigTitle>Configure {node.label}</ConfigTitle>
        <Button variant="text" onClick={onClose} style={{ padding: '4px' }}>
          <Icon icon="close" />
        </Button>
      </ConfigHeader>
      
      <SearchContainer>
        <InputText
          placeholder={`Search ${node.label.toLowerCase()}...`}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{ width: '100%' }}
        />
      </SearchContainer>
      
      {loading ? (
        <LoadingState>Loading options...</LoadingState>
      ) : options.length === 0 ? (
        <EmptyState>No {node.label.toLowerCase()} found</EmptyState>
      ) : (
        <>
          <SelectAllRow>
            <span>{selected.length} of {options.length} selected</span>
            <div>
              {node.type === 'project' && (
                <Button variant="text" onClick={selectAllActive} style={{ padding: '4px 8px', fontSize: '12px' }}>
                  Active
                </Button>
              )}
              <Button variant="text" onClick={selectAll} style={{ padding: '4px 8px', fontSize: '12px' }}>
                All
              </Button>
              <Button variant="text" onClick={clearAll} style={{ padding: '4px 8px', fontSize: '12px' }}>
                Clear
              </Button>
            </div>
          </SelectAllRow>
          
          <OptionsList>
            {filteredOptions.map(opt => (
              <OptionItem key={opt.id} $selected={selected.includes(opt.id)}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleOption(opt.id)}
                />
                <OptionInfo>
                  <div className="name">{opt.name}</div>
                  {opt.meta && <div className="meta">{opt.meta}</div>}
                </OptionInfo>
              </OptionItem>
            ))}
          </OptionsList>
        </>
      )}
      
      <ConfigFooter>
        <Button variant="text" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </ConfigFooter>
    </InlineConfigContainer>
  )
}

export default InlineNodeConfig
