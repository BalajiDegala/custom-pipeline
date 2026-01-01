import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const PopupContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 280px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: var(--md-sys-color-surface);
  border: none;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
  outline: none;
  
  &::placeholder {
    color: var(--md-sys-color-on-surface-variant);
  }
`

const NodeList = styled.div`
  overflow-y: auto;
  max-height: 320px;
`

const NodeItem = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: ${props => props.$selected ? 'var(--md-sys-color-primary-container)' : 'transparent'};
  border: none;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  .icon {
    font-size: 20px;
    color: var(--md-sys-color-primary);
  }
`

const NodeInfo = styled.div`
  flex: 1;
  
  .label {
    font-weight: 500;
    font-size: 14px;
  }
  
  .description {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
    margin-top: 2px;
  }
`

const Shortcut = styled.span`
  font-size: 11px;
  color: var(--md-sys-color-on-surface-variant);
  padding: 2px 6px;
  background: var(--md-sys-color-surface);
  border-radius: 4px;
`

interface NodeTemplate {
  type: string
  label: string
  icon: string
  description: string
  configurable: boolean
}

interface NodeSearchPopupProps {
  position: { x: number; y: number }
  onSelect: (template: NodeTemplate) => void
  onClose: () => void
}

export const nodeTemplates: NodeTemplate[] = [
  { type: 'project', label: 'Project', icon: 'folder_open', description: 'Project root', configurable: false },
  { type: 'folders', label: 'Folders', icon: 'folder', description: 'Asset/Shot folders', configurable: true },
  { type: 'products', label: 'Products', icon: 'inventory_2', description: 'Published products', configurable: true },
  { type: 'versions', label: 'Versions', icon: 'history', description: 'Product versions', configurable: true },
  { type: 'tasks', label: 'Tasks', icon: 'task', description: 'Work tasks', configurable: true },
  { type: 'representations', label: 'Representations', icon: 'description', description: 'File representations', configurable: false },
  { type: 'departments', label: 'Departments', icon: 'groups', description: 'Department filter', configurable: true },
  { type: 'artists', label: 'Artists', icon: 'person', description: 'Artist/User filter', configurable: true },
  { type: 'results', label: 'Results', icon: 'table_chart', description: 'Execute query', configurable: false },
]

const NodeSearchPopup: React.FC<NodeSearchPopupProps> = ({ position, onSelect, onClose }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredTemplates = nodeTemplates.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredTemplates.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredTemplates[selectedIndex]) {
      onSelect(filteredTemplates[selectedIndex])
    }
  }

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 300),
    y: Math.min(position.y, window.innerHeight - 420)
  }

  return (
    <PopupContainer ref={containerRef} $x={adjustedPosition.x} $y={adjustedPosition.y}>
      <SearchInput
        ref={inputRef}
        type="text"
        placeholder="Search nodes... (type to filter)"
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          setSelectedIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <NodeList>
        {filteredTemplates.map((template, index) => (
          <NodeItem
            key={template.type}
            $selected={index === selectedIndex}
            onClick={() => onSelect(template)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon icon={template.icon} />
            <NodeInfo>
              <div className="label">{template.label}</div>
              <div className="description">{template.description}</div>
            </NodeInfo>
            {template.configurable && <Shortcut>configurable</Shortcut>}
          </NodeItem>
        ))}
        {filteredTemplates.length === 0 && (
          <NodeItem as="div" style={{ cursor: 'default', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No nodes match "{search}"
          </NodeItem>
        )}
      </NodeList>
    </PopupContainer>
  )
}

export default NodeSearchPopup
