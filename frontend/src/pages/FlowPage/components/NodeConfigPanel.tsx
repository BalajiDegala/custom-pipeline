import React, { useState, useEffect } from 'react'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const PanelContainer = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  width: 320px;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  font-size: 20px;
  padding: 4px 8px;
  
  &:hover {
    color: var(--md-sys-color-on-surface);
  }
`

const ConfigSection = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 8px;
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 4px;
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
  }
`

const MultiSelect = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 4px;
  background: var(--md-sys-color-surface);
`

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  input {
    margin-right: 8px;
  }
`

interface NodeConfig {
  selectedFolders?: string[]
  selectedProducts?: string[]
  selectedVersions?: string[]
  filterCriteria?: Record<string, any>
}

interface NodeConfigPanelProps {
  node: {
    id: string
    type: string
    label: string
    config?: NodeConfig
  }
  projectName: string
  onClose: () => void
  onSave: (nodeId: string, config: NodeConfig) => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  projectName,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<NodeConfig>(node.config || {})
  const [availableOptions, setAvailableOptions] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available options based on node type
    fetchAvailableOptions()
  }, [node.type, projectName])

  const fetchAvailableOptions = async () => {
    setLoading(true)
    try {
      // Fetch data from AYON GraphQL based on node type
      const query = buildFetchQuery(node.type)
      
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
        body: JSON.stringify({
          query,
          variables: { projectName }
        })
      })

      const data = await response.json()
      console.log('GraphQL response:', data)
      const options = extractOptionsFromResponse(data, node.type)
      setAvailableOptions(options)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildFetchQuery = (nodeType: string): string => {
    switch (nodeType) {
      case 'folders':
        return `
          query GetFolders($projectName: String!) {
            project(name: $projectName) {
              folders(first: 100) {
                edges {
                  node {
                    id
                    name
                    folderType
                    path
                  }
                }
              }
            }
          }
        `
      case 'products':
        return `
          query GetProducts($projectName: String!) {
            project(name: $projectName) {
              products(first: 100) {
                edges {
                  node {
                    id
                    name
                    productType
                  }
                }
              }
            }
          }
        `
      case 'versions':
        return `
          query GetVersions($projectName: String!) {
            project(name: $projectName) {
              versions(first: 100) {
                edges {
                  node {
                    id
                    version
                    productId
                  }
                }
              }
            }
          }
        `
      default:
        return ''
    }
  }

  const extractOptionsFromResponse = (data: any, nodeType: string): Record<string, any[]> => {
    const project = data?.data?.project
    if (!project) return {}

    switch (nodeType) {
      case 'folders':
        return { folders: project.folders?.edges?.map((e: any) => e.node) || [] }
      case 'products':
        return { products: project.products?.edges?.map((e: any) => e.node) || [] }
      case 'versions':
        return { versions: project.versions?.edges?.map((e: any) => e.node) || [] }
      default:
        return {}
    }
  }

  const handleMultiSelectChange = (category: string, itemId: string, checked: boolean) => {
    const currentSelection = config[`selected${category.charAt(0).toUpperCase() + category.slice(1)}`] || []
    const newSelection = checked
      ? [...currentSelection, itemId]
      : currentSelection.filter(id => id !== itemId)
    
    setConfig({
      ...config,
      [`selected${category.charAt(0).toUpperCase() + category.slice(1)}`]: newSelection
    })
  }

  const handleSave = () => {
    onSave(node.id, config)
    onClose()
  }

  const renderConfigFields = () => {
    if (loading) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading options...</div>
    }

    switch (node.type) {
      case 'folders':
        return (
          <ConfigSection>
            <Label>Select Folders</Label>
            <MultiSelect>
              {availableOptions.folders?.map((folder: any) => (
                <CheckboxItem key={folder.id}>
                  <input
                    type="checkbox"
                    checked={(config.selectedFolders || []).includes(folder.id)}
                    onChange={(e) => handleMultiSelectChange('folders', folder.id, e.target.checked)}
                  />
                  <span>{folder.path || folder.name} ({folder.folderType})</span>
                </CheckboxItem>
              ))}
            </MultiSelect>
          </ConfigSection>
        )

      case 'products':
        return (
          <ConfigSection>
            <Label>Select Products</Label>
            <MultiSelect>
              {availableOptions.products?.map((product: any) => (
                <CheckboxItem key={product.id}>
                  <input
                    type="checkbox"
                    checked={(config.selectedProducts || []).includes(product.id)}
                    onChange={(e) => handleMultiSelectChange('products', product.id, e.target.checked)}
                  />
                  <span>{product.name} ({product.productType})</span>
                </CheckboxItem>
              ))}
            </MultiSelect>
          </ConfigSection>
        )

      case 'versions':
        return (
          <ConfigSection>
            <Label>Select Versions</Label>
            <MultiSelect>
              {availableOptions.versions?.map((version: any) => (
                <CheckboxItem key={version.id}>
                  <input
                    type="checkbox"
                    checked={(config.selectedVersions || []).includes(version.id)}
                    onChange={(e) => handleMultiSelectChange('versions', version.id, e.target.checked)}
                  />
                  <span>Version {version.version}</span>
                </CheckboxItem>
              ))}
            </MultiSelect>
          </ConfigSection>
        )

      default:
        return <div>No configuration available for this node type</div>
    }
  }

  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Configure {node.label}</PanelTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </PanelHeader>
      
      {renderConfigFields()}
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <Button onClick={handleSave} style={{ flex: 1 }}>
          Save Configuration
        </Button>
        <Button onClick={onClose} variant="text" style={{ flex: 1 }}>
          Cancel
        </Button>
      </div>
    </PanelContainer>
  )
}

export default NodeConfigPanel
