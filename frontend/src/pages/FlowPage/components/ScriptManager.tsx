import React, { useState, useEffect } from 'react'
import { Button, Icon, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Modal = styled.div`
  width: 500px;
  max-height: 80vh;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
`

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`

const Body = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`

const FormGroup = styled.div`
  margin-bottom: 20px;
`

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--md-sys-color-on-surface);
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  color: var(--md-sys-color-on-surface);
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
  }
`

const ScriptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`

const ScriptItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.$selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)'};
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
`

const ScriptInfo = styled.div`
  flex: 1;
  
  .name {
    font-weight: 500;
    font-size: 14px;
  }
  
  .date {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
    margin-top: 4px;
  }
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.$active ? 'var(--md-sys-color-primary-container)' : 'transparent'};
  border: none;
  border-radius: 8px;
  color: ${props => props.$active ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)'};
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
`

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

interface FlowScript {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  nodes: any[]
  edges: any[]
}

interface ScriptManagerProps {
  nodes: any[]
  edges: any[]
  projectName: string
  onLoad: (nodes: any[], edges: any[]) => void
  onClose: () => void
}

const STORAGE_KEY = 'ayon_flow_scripts'

const ScriptManager: React.FC<ScriptManagerProps> = ({
  nodes,
  edges,
  projectName,
  onLoad,
  onClose
}) => {
  const [tab, setTab] = useState<'save' | 'load'>('save')
  const [scripts, setScripts] = useState<FlowScript[]>([])
  const [selectedScript, setSelectedScript] = useState<string | null>(null)
  const [scriptName, setScriptName] = useState('')
  const [scriptDescription, setScriptDescription] = useState('')
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    loadScripts()
  }, [])

  const loadScripts = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const allScripts = JSON.parse(stored)
        setScripts(allScripts)
      }
    } catch (error) {
      console.error('Failed to load scripts:', error)
    }
  }

  // Check if name already exists (excluding current script if editing)
  const isNameDuplicate = (name: string): boolean => {
    const normalizedName = name.trim().toLowerCase()
    return scripts.some(s => 
      s.name.toLowerCase() === normalizedName && 
      s.id !== editingScriptId
    )
  }

  // Generate unique name suggestion
  const suggestUniqueName = (baseName: string): string => {
    let counter = 1
    let suggestedName = baseName
    while (isNameDuplicate(suggestedName)) {
      suggestedName = `${baseName} (${counter})`
      counter++
    }
    return suggestedName
  }

  const handleNameChange = (name: string) => {
    setScriptName(name)
    if (isNameDuplicate(name)) {
      const suggested = suggestUniqueName(name)
      setNameError(`Name already exists. Suggestion: "${suggested}"`)
    } else {
      setNameError(null)
    }
  }

  const saveScript = () => {
    if (!scriptName.trim()) {
      setNameError('Please enter a script name')
      return
    }

    if (isNameDuplicate(scriptName)) {
      const suggested = suggestUniqueName(scriptName)
      setNameError(`Name already exists. Use "${suggested}" instead?`)
      return
    }

    if (editingScriptId) {
      // Update existing script
      const updatedScripts = scripts.map(s => 
        s.id === editingScriptId 
          ? { ...s, name: scriptName.trim(), description: scriptDescription.trim(), updatedAt: new Date().toISOString(), nodes, edges }
          : s
      )
      setScripts(updatedScripts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts))
      alert(`Script "${scriptName}" updated successfully!`)
    } else {
      // Create new script
      const newScript: FlowScript = {
        id: `script-${Date.now()}`,
        name: scriptName.trim(),
        description: scriptDescription.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: nodes,
        edges: edges
      }

      const updatedScripts = [...scripts, newScript]
      setScripts(updatedScripts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts))
      alert(`Script "${scriptName}" saved successfully!`)
    }
    
    onClose()
  }

  const openScriptForEditing = (script: FlowScript) => {
    setEditingScriptId(script.id)
    setScriptName(script.name)
    setScriptDescription(script.description)
    setTab('save')
    onLoad(script.nodes, script.edges)
  }

  const loadScript = () => {
    const script = scripts.find(s => s.id === selectedScript)
    if (script) {
      onLoad(script.nodes, script.edges)
      onClose()
    }
  }

  const deleteScript = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this script?')) {
      const updatedScripts = scripts.filter(s => s.id !== id)
      setScripts(updatedScripts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts))
      if (selectedScript === id) setSelectedScript(null)
    }
  }

  const exportScript = () => {
    const script = scripts.find(s => s.id === selectedScript)
    if (!script) return
    
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${script.name.replace(/\s+/g, '_')}.json`
    link.click()
  }

  const importScript = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const script = JSON.parse(event.target?.result as string)
          script.id = `script-${Date.now()}`
          script.createdAt = new Date().toISOString()
          script.updatedAt = new Date().toISOString()
          
          const updatedScripts = [...scripts, script]
          setScripts(updatedScripts)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts))
          alert(`Script "${script.name}" imported successfully!`)
        } catch (error) {
          alert('Failed to import script. Invalid JSON format.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <Container onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Flow Scripts</Title>
          <Button variant="text" onClick={onClose}>
            <Icon icon="close" />
          </Button>
        </Header>
        
        <TabBar>
          <Tab $active={tab === 'save'} onClick={() => setTab('save')}>
            Save Current
          </Tab>
          <Tab $active={tab === 'load'} onClick={() => setTab('load')}>
            Load Script
          </Tab>
        </TabBar>
        
        <Body>
          {tab === 'save' ? (
            <>
              <FormGroup>
                <Label>Script Name * {editingScriptId && <span style={{ color: 'var(--md-sys-color-primary)', fontSize: '12px' }}>(Editing)</span>}</Label>
                <InputText
                  value={scriptName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                  placeholder="Enter a name for this flow..."
                  style={{ width: '100%', borderColor: nameError ? 'var(--md-sys-color-error)' : undefined }}
                />
                {nameError && (
                  <div style={{ 
                    color: 'var(--md-sys-color-error)', 
                    fontSize: '12px', 
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{nameError}</span>
                    {nameError.includes('Suggestion') && (
                      <Button 
                        variant="text" 
                        onClick={() => {
                          const match = nameError.match(/"([^"]+)"/)
                          if (match) {
                            setScriptName(match[1])
                            setNameError(null)
                          }
                        }}
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                      >
                        Use suggestion
                      </Button>
                    )}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={scriptDescription}
                  onChange={(e) => setScriptDescription(e.target.value)}
                  placeholder="Describe what this flow does..."
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Preview</Label>
                <div style={{ 
                  padding: '12px', 
                  background: 'var(--md-sys-color-surface)', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                  {nodes.length} nodes, {edges.length} connections
                  {editingScriptId && <span style={{ marginLeft: '8px', color: 'var(--md-sys-color-primary)' }}>• Editing existing script</span>}
                </div>
              </FormGroup>
              
              {editingScriptId && (
                <Button 
                  variant="text" 
                  onClick={() => {
                    setEditingScriptId(null)
                    setScriptName('')
                    setScriptDescription('')
                    setNameError(null)
                  }}
                  style={{ marginTop: '8px' }}
                >
                  <Icon icon="add" /> Save as New Script Instead
                </Button>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Button onClick={importScript} variant="text">
                  <Icon icon="upload" /> Import JSON
                </Button>
                {selectedScript && (
                  <>
                    <Button onClick={exportScript} variant="text">
                      <Icon icon="download" /> Export
                    </Button>
                    <Button onClick={() => {
                      const script = scripts.find(s => s.id === selectedScript)
                      if (script) openScriptForEditing(script)
                    }} variant="text">
                      <Icon icon="edit" /> Edit
                    </Button>
                  </>
                )}
              </div>
              
              {scripts.length === 0 ? (
                <EmptyState>
                  <Icon icon="folder_open" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <p>No saved scripts yet</p>
                  <p style={{ fontSize: '14px' }}>Save your current flow to reuse it later</p>
                </EmptyState>
              ) : (
                <ScriptList>
                  {scripts.map(script => (
                    <ScriptItem
                      key={script.id}
                      $selected={selectedScript === script.id}
                      onClick={() => setSelectedScript(script.id)}
                    >
                      <ScriptInfo>
                        <div className="name">{script.name}</div>
                        <div className="date">
                          {new Date(script.updatedAt).toLocaleDateString()} • 
                          {script.nodes.length} nodes
                        </div>
                      </ScriptInfo>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button 
                          variant="text" 
                          onClick={(e) => { e.stopPropagation(); openScriptForEditing(script) }}
                          style={{ padding: '4px' }}
                          title="Edit script"
                        >
                          <Icon icon="edit" />
                        </Button>
                        <Button 
                          variant="text" 
                          onClick={(e) => deleteScript(script.id, e)}
                          style={{ padding: '4px' }}
                          title="Delete script"
                        >
                          <Icon icon="delete" />
                        </Button>
                      </div>
                    </ScriptItem>
                  ))}
                </ScriptList>
              )}
            </>
          )}
        </Body>
        
        <Footer>
          <Button variant="text" onClick={onClose}>Cancel</Button>
          {tab === 'save' ? (
            <Button onClick={saveScript} disabled={!scriptName.trim() || !!nameError}>
              <Icon icon="save" /> {editingScriptId ? 'Update Script' : 'Save Script'}
            </Button>
          ) : (
            <Button onClick={loadScript} disabled={!selectedScript}>
              <Icon icon="folder_open" /> Load Script
            </Button>
          )}
        </Footer>
      </Modal>
    </Container>
  )
}

export default ScriptManager
