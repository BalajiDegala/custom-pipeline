import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'

const Container = styled.div`
  display: flex;
  gap: 4px;
`

const DropdownContainer = styled.div`
  position: relative;
`

const DropdownMenu = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: ${props => props.$visible ? 'block' : 'none'};
  min-width: 280px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 8px 0;
  margin-top: 4px;
`

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  .icon {
    color: var(--md-sys-color-primary);
  }
  
  .description {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const MenuDivider = styled.div`
  height: 1px;
  background: var(--md-sys-color-outline-variant);
  margin: 8px 0;
`

const MenuHeader = styled.div`
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.5px;
`

const HiddenInput = styled.input`
  display: none;
`

// Modal for import preview
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ModalContent = styled.div`
  width: 90vw;
  max-width: 1200px;
  max-height: 80vh;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
`

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`

const ModalBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
`

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
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
  
  tr:hover td {
    background: var(--md-sys-color-surface-container-high);
  }
  
  .error {
    color: var(--md-sys-color-error);
    font-size: 12px;
  }
  
  .new {
    color: var(--md-sys-color-primary);
    font-weight: 500;
  }
  
  .exists {
    color: var(--md-sys-color-on-surface-variant);
  }
`

const Summary = styled.div`
  display: flex;
  gap: 24px;
  
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .count {
      font-size: 20px;
      font-weight: 600;
    }
    
    .label {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
  }
`

const ProgressBar = styled.div<{ $progress: number }>`
  height: 4px;
  background: var(--md-sys-color-surface-container-highest);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$progress}%;
    background: var(--md-sys-color-primary);
    transition: width 0.3s;
  }
`

interface CSVRow {
  sequence: string
  shot: string
  task: string
  taskType: string
  assignees?: string
  status?: string
  frameStart?: string
  frameEnd?: string
  description?: string
  [key: string]: string | undefined
}

interface ParsedEntity {
  type: 'sequence' | 'shot' | 'task'
  name: string
  parent?: string
  data: any
  status: 'new' | 'exists' | 'error'
  error?: string
}

interface CSVImportExportProps {
  projectName: string
  onRefresh?: () => void
}

const CSVImportExport: React.FC<CSVImportExportProps> = ({ projectName, onRefresh }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedEntity[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to strip quotes from CSV values
  const stripQuotes = (value: string): string => {
    if (!value) return ''
    let v = value.trim()
    // Remove surrounding quotes (both single and double)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    // Handle escaped quotes inside
    v = v.replace(/""/g, '"')
    return v.trim()
  }

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    
    // Parse CSV properly handling quoted values
    const parseLine = (line: string): string[] => {
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"' && !inQuotes) {
          inQuotes = true
        } else if (char === '"' && inQuotes) {
          // Check for escaped quote
          if (line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else if (char === ',' && !inQuotes) {
          values.push(stripQuotes(current))
          current = ''
        } else {
          current += char
        }
      }
      values.push(stripQuotes(current))
      return values
    }
    
    // Header mapping: lowercase header -> CSVRow property name
    const headerMap: { [key: string]: keyof CSVRow } = {
      'sequence': 'sequence',
      'shot': 'shot',
      'task': 'task',
      'tasktype': 'taskType',
      'task_type': 'taskType',
      'assignees': 'assignees',
      'status': 'status',
      'framestart': 'frameStart',
      'frame_start': 'frameStart',
      'frameend': 'frameEnd',
      'frame_end': 'frameEnd',
      'description': 'description',
    }
    
    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().trim())
    const rows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue // Skip empty lines
      
      const values = parseLine(lines[i])
      const row: CSVRow = {
        sequence: '',
        shot: '',
        task: '',
        taskType: '',
      }
      
      rawHeaders.forEach((header, idx) => {
        if (values[idx] !== undefined) {
          // Map the lowercase header to the proper CSVRow property
          const mappedKey = headerMap[header] || header
          row[mappedKey] = values[idx]
        }
      })
      
      if (row.sequence || row.shot || row.task) {
        rows.push(row)
      }
    }
    
    return rows
  }

  const processCSVData = (rows: CSVRow[]): ParsedEntity[] => {
    const entities: ParsedEntity[] = []
    const seenSequences = new Set<string>()
    const seenShots = new Set<string>()
    
    rows.forEach(row => {
      // Add sequence if not seen
      if (row.sequence && !seenSequences.has(row.sequence)) {
        seenSequences.add(row.sequence)
        entities.push({
          type: 'sequence',
          name: row.sequence,
          data: {
            name: row.sequence,
            folderType: 'Sequence',
          },
          status: 'new',
        })
      }
      
      // Add shot if not seen
      const shotKey = `${row.sequence}/${row.shot}`
      if (row.shot && !seenShots.has(shotKey)) {
        seenShots.add(shotKey)
        entities.push({
          type: 'shot',
          name: row.shot,
          parent: row.sequence,
          data: {
            name: row.shot,
            folderType: 'Shot',
            attrib: {
              frameStart: row.frameStart ? parseInt(row.frameStart) : undefined,
              frameEnd: row.frameEnd ? parseInt(row.frameEnd) : undefined,
              description: row.description || undefined,
            },
          },
          status: 'new',
        })
      }
      
      // Add task
      if (row.task) {
        const taskType = row.taskType?.trim()
        if (!taskType) {
          console.warn(`Task "${row.task}" is missing taskType, will use default`)
        }
        entities.push({
          type: 'task',
          name: row.task,
          parent: shotKey,
          data: {
            name: row.task,
            taskType: taskType || 'Generic', // Use a default task type if not specified
            assignees: row.assignees ? row.assignees.split(';').map(a => a.trim()) : [],
            status: row.status || undefined,
          },
          status: 'new',
        })
      }
    })
    
    return entities
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const text = await file.text()
    const rows = parseCSV(text)
    const entities = processCSVData(rows)
    
    setParsedData(entities)
    setShowImportModal(true)
    setShowDropdown(false)
    setImportResult(null)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const executeImport = async () => {
    if (!projectName || parsedData.length === 0) return
    
    setImporting(true)
    setImportProgress(0)
    
    const accessToken = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    
    // Group entities by type for ordered creation
    const sequences = parsedData.filter((e: ParsedEntity) => e.type === 'sequence')
    const shots = parsedData.filter((e: ParsedEntity) => e.type === 'shot')
    const tasks = parsedData.filter((e: ParsedEntity) => e.type === 'task')
    
    const totalOps = sequences.length + shots.length + tasks.length
    let completed = 0
    let success = 0
    let failed = 0
    
    // Map to track created/found entity IDs
    const createdIds: Record<string, string> = {}
    
    // Map to track existing tasks: key = folderId/taskName, value = taskId
    const existingTasks: Record<string, string> = {}
    
    // First, fetch existing folders AND tasks to find parent IDs and existing tasks
    try {
      const existingQuery = `
        query GetFoldersAndTasks($projectName: String!) {
          project(name: $projectName) {
            folders {
              edges {
                node {
                  id
                  name
                  folderType
                  parentId
                }
              }
            }
            tasks {
              edges {
                node {
                  id
                  name
                  taskType
                  folderId
                  status
                  assignees
                }
              }
            }
          }
        }
      `
      const existingResp = await fetch('/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: existingQuery,
          variables: { projectName }
        })
      })
      
      if (existingResp.ok) {
        const existingData = await existingResp.json()
        const existingFolders = existingData.data?.project?.folders?.edges?.map((e: any) => e.node) || []
        const existingTasksList = existingData.data?.project?.tasks?.edges?.map((e: any) => e.node) || []
        
        // Build map of existing folders
        existingFolders.forEach((f: any) => {
          createdIds[f.name] = f.id
          // Also map by path for shots
          if (f.parentId) {
            const parent = existingFolders.find((p: any) => p.id === f.parentId)
            if (parent) {
              createdIds[`${parent.name}/${f.name}`] = f.id
            }
          }
        })
        
        // Build map of existing tasks: folderId/taskName -> taskId
        existingTasksList.forEach((t: any) => {
          const taskKey = `${t.folderId}/${t.name}`
          existingTasks[taskKey] = t.id
        })
        
        console.log('Existing folders:', Object.keys(createdIds).length)
        console.log('Existing tasks:', Object.keys(existingTasks).length)
      }
    } catch (err) {
      console.error('Failed to fetch existing folders/tasks:', err)
    }
    
    // Step 1: Create sequences (top-level folders)
    for (const seq of sequences) {
      try {
        // Check if already exists
        if (createdIds[seq.name]) {
          success++ // Count as success since it exists
          completed++
          setImportProgress(Math.round((completed / totalOps) * 100))
          continue
        }
        
        const response = await fetch(`/api/projects/${projectName}/folders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: seq.data.name,
            folderType: 'Sequence',
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          createdIds[seq.name] = data.id
          success++
        } else {
          const errorText = await response.text()
          console.error(`Failed to create sequence ${seq.name}:`, response.status, errorText)
          failed++
        }
      } catch (err) {
        console.error(`Error creating sequence ${seq.name}:`, err)
        failed++
      }
      
      completed++
      setImportProgress(Math.round((completed / totalOps) * 100))
    }
    
    // Step 2: Create shots under sequences
    for (const shot of shots) {
      try {
        const shotKey = `${shot.parent}/${shot.name}`
        
        // Check if already exists
        if (createdIds[shotKey]) {
          success++
          completed++
          setImportProgress(Math.round((completed / totalOps) * 100))
          continue
        }
        
        const parentId = createdIds[shot.parent || '']
        if (!parentId) {
          console.error(`Parent sequence not found for shot ${shot.name}: ${shot.parent}`)
          failed++
          completed++
          setImportProgress(Math.round((completed / totalOps) * 100))
          continue
        }
        
        // Clean up attrib - remove undefined values
        const attrib: Record<string, any> = {}
        if (shot.data.attrib?.frameStart !== undefined) attrib.frameStart = shot.data.attrib.frameStart
        if (shot.data.attrib?.frameEnd !== undefined) attrib.frameEnd = shot.data.attrib.frameEnd
        if (shot.data.attrib?.description) attrib.description = shot.data.attrib.description
        
        const response = await fetch(`/api/projects/${projectName}/folders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: shot.data.name,
            folderType: 'Shot',
            parentId,
            ...(Object.keys(attrib).length > 0 ? { attrib } : {}),
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          createdIds[shotKey] = data.id
          success++
        } else {
          const errorText = await response.text()
          console.error(`Failed to create shot ${shot.name}:`, response.status, errorText)
          failed++
        }
      } catch (err) {
        console.error(`Error creating shot ${shot.name}:`, err)
        failed++
      }
      
      completed++
      setImportProgress(Math.round((completed / totalOps) * 100))
    }
    
    // Step 3: Create or update tasks on shots
    for (const task of tasks) {
      try {
        const folderId = createdIds[task.parent || '']
        if (!folderId) {
          console.error(`Parent folder not found for task ${task.name}: ${task.parent}`)
          failed++
          completed++
          setImportProgress(Math.round((completed / totalOps) * 100))
          continue
        }
        
        // Check if task already exists
        const taskKey = `${folderId}/${task.data.name}`
        const existingTaskId = existingTasks[taskKey]
        
        // Build task data, only include fields that have values
        const taskData: Record<string, any> = {
          name: task.data.name,
          taskType: task.data.taskType || task.data.name, // Fallback to name if no taskType
          folderId,
        }
        
        if (task.data.assignees && task.data.assignees.length > 0) {
          taskData.assignees = task.data.assignees
        }
        
        // Don't send status if empty - let the API use default
        if (task.data.status && task.data.status.trim()) {
          taskData.status = task.data.status
        }
        
        let response: Response
        
        if (existingTaskId) {
          // Task exists - use PATCH to update
          console.log(`Updating existing task: ${task.data.name} (${existingTaskId})`)
          response = await fetch(`/api/projects/${projectName}/tasks/${existingTaskId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(taskData),
          })
        } else {
          // Task doesn't exist - use POST to create
          console.log(`Creating new task: ${task.data.name}`)
          response = await fetch(`/api/projects/${projectName}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(taskData),
          })
        }
        
        if (response.ok) {
          success++
        } else {
          const errorText = await response.text()
          console.error(`Failed to ${existingTaskId ? 'update' : 'create'} task ${task.name}:`, response.status, errorText)
          failed++
        }
      } catch (err) {
        console.error(`Error processing task ${task.name}:`, err)
        failed++
      }
      
      completed++
      setImportProgress(Math.round((completed / totalOps) * 100))
    }
    
    setImporting(false)
    setImportResult({ success, failed })
    
    // Refresh the overview if provided
    if (onRefresh && success > 0) {
      onRefresh()
    }
  }

  const exportCurrentView = async () => {
    setShowDropdown(false)
    
    const accessToken = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    
    try {
      // Use GraphQL to fetch folders and tasks
      const query = `
        query GetProjectData($projectName: String!) {
          project(name: $projectName) {
            folders {
              edges {
                node {
                  id
                  name
                  folderType
                  parentId
                  attrib {
                    frameStart
                    frameEnd
                    description
                  }
                }
              }
            }
            tasks {
              edges {
                node {
                  id
                  name
                  taskType
                  status
                  assignees
                  folderId
                  attrib {
                    frameStart
                    frameEnd
                    description
                  }
                }
              }
            }
          }
        }
      `
      
      const graphqlResp = await fetch('/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables: { projectName }
        })
      })
      
      if (!graphqlResp.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const result = await graphqlResp.json()
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors)
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }
      
      const folders = result.data?.project?.folders?.edges?.map((e: any) => e.node) || []
      const tasks = result.data?.project?.tasks?.edges?.map((e: any) => e.node) || []
      
      // Build hierarchy
      const folderMap: Record<string, any> = {}
      folders.forEach((f: any) => {
        folderMap[f.id] = f
      })
      
      // Generate CSV rows
      const csvRows: string[] = ['sequence,shot,task,taskType,assignees,status,frameStart,frameEnd,description']
      
      if (tasks.length === 0) {
        alert('No tasks found to export')
        return
      }
      
      tasks.forEach((task: any) => {
        const shot = folderMap[task.folderId]
        if (!shot) return
        
        const sequence = shot.parentId ? folderMap[shot.parentId] : null
        
        csvRows.push([
          sequence?.name || '',
          shot.name || '',
          task.name || '',
          task.taskType || '',
          (task.assignees || []).join(';'),
          task.status || '',
          task.attrib?.frameStart || shot.attrib?.frameStart || '',
          task.attrib?.frameEnd || shot.attrib?.frameEnd || '',
          task.attrib?.description || shot.attrib?.description || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      })
      
      // Download
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${projectName}_overview_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  const downloadTemplate = () => {
    setShowDropdown(false)
    
    const template = `sequence,shot,task,taskType,assignees,status,frameStart,frameEnd,description
sq01,sh001,animation,Animation,artist1,In progress,1001,1100,Main character animation
sq01,sh001,compositing,Compositing,,Not started,1001,1100,Final composite
sq01,sh002,animation,Animation,artist2,Not started,1001,1050,Background elements
sq01,sh002,lighting,Lighting,,Not started,1001,1050,Environment lighting
sq02,sh001,layout,Layout,artist1,In progress,1001,1200,Wide establishing shot
sq02,sh001,animation,Animation,,Not started,1001,1200,Crowd animation
sq02,sh002,fx,FX,,Not started,1001,1150,Explosion effect`
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ayon_import_template.csv'
    link.click()
  }

  const stats = {
    sequences: parsedData.filter((e: ParsedEntity) => e.type === 'sequence').length,
    shots: parsedData.filter((e: ParsedEntity) => e.type === 'shot').length,
    tasks: parsedData.filter((e: ParsedEntity) => e.type === 'task').length,
  }

  return (
    <>
      <Container>
        <DropdownContainer ref={dropdownRef}>
          <Button 
            icon="table_view" 
            onClick={() => setShowDropdown(!showDropdown)}
            data-tooltip="CSV Import/Export"
          >
            CSV
          </Button>
          
          <DropdownMenu $visible={showDropdown}>
            <MenuHeader>Import</MenuHeader>
            <MenuItem onClick={() => fileInputRef.current?.click()}>
              <Icon icon="upload_file" className="icon" />
              <div>
                <div>Import from CSV</div>
                <div className="description">Create sequences, shots & tasks</div>
              </div>
            </MenuItem>
            <MenuItem onClick={downloadTemplate}>
              <Icon icon="description" className="icon" />
              <div>
                <div>Download Template</div>
                <div className="description">Get CSV template with examples</div>
              </div>
            </MenuItem>
            
            <MenuDivider />
            
            <MenuHeader>Export</MenuHeader>
            <MenuItem onClick={exportCurrentView}>
              <Icon icon="download" className="icon" />
              <div>
                <div>Export Current View</div>
                <div className="description">Download all tasks as CSV</div>
              </div>
            </MenuItem>
          </DropdownMenu>
        </DropdownContainer>
        
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
        />
      </Container>
      
      {showImportModal && (
        <ModalOverlay onClick={() => !importing && setShowImportModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {importResult ? 'Import Complete' : 'Preview Import'}
              </ModalTitle>
              <Button 
                icon="close" 
                variant="text" 
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              />
            </ModalHeader>
            
            <ModalBody>
              {importing && (
                <div style={{ marginBottom: 16 }}>
                  <div>Importing... {importProgress}%</div>
                  <ProgressBar $progress={importProgress} />
                </div>
              )}
              
              {importResult && (
                <div style={{ 
                  padding: 16, 
                  background: 'var(--md-sys-color-surface-container-highest)',
                  borderRadius: 8,
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    Import completed!
                  </div>
                  <div>
                    ✅ {importResult.success} entities created successfully
                    {importResult.failed > 0 && (
                      <span style={{ color: 'var(--md-sys-color-error)', marginLeft: 16 }}>
                        ❌ {importResult.failed} failed
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <PreviewTable>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Parent</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((entity, idx) => (
                    <tr key={idx}>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4,
                          fontSize: 12,
                          background: entity.type === 'sequence' 
                            ? 'var(--md-sys-color-primary-container)' 
                            : entity.type === 'shot'
                              ? 'var(--md-sys-color-secondary-container)'
                              : 'var(--md-sys-color-tertiary-container)',
                        }}>
                          {entity.type}
                        </span>
                      </td>
                      <td className={entity.status}>{entity.name}</td>
                      <td>{entity.parent || '-'}</td>
                      <td>
                        {entity.type === 'task' && (
                          <span>
                            {entity.data.taskType}
                            {entity.data.assignees?.length > 0 && (
                              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                                → {entity.data.assignees.join(', ')}
                              </span>
                            )}
                          </span>
                        )}
                        {entity.type === 'shot' && entity.data.attrib?.frameStart && (
                          <span>
                            Frames: {entity.data.attrib.frameStart}-{entity.data.attrib.frameEnd}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </PreviewTable>
            </ModalBody>
            
            <ModalFooter>
              <Summary>
                <div className="stat">
                  <span className="count">{stats.sequences}</span>
                  <span className="label">Sequences</span>
                </div>
                <div className="stat">
                  <span className="count">{stats.shots}</span>
                  <span className="label">Shots</span>
                </div>
                <div className="stat">
                  <span className="count">{stats.tasks}</span>
                  <span className="label">Tasks</span>
                </div>
              </Summary>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <Button 
                  variant="text" 
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  {importResult ? 'Close' : 'Cancel'}
                </Button>
                {!importResult && (
                  <Button 
                    variant="filled"
                    icon="upload"
                    onClick={executeImport}
                    disabled={importing || parsedData.length === 0}
                  >
                    {importing ? 'Importing...' : `Import ${parsedData.length} Entities`}
                  </Button>
                )}
              </div>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  )
}

export default CSVImportExport
