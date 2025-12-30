import React from 'react'
import { Handle, Position } from 'reactflow'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const NodeContainer = styled.div`
  background: var(--md-sys-color-surface-container-highest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  padding: 12px;
  min-width: 140px;
  color: var(--md-sys-color-on-surface);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &.selected {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 1px var(--md-sys-color-primary);
  }
`

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
`

const NodeDescription = styled.div`
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.3;
`

const NodeType = styled.div`
  font-size: 10px;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-top: 4px;
`

interface CustomNodeProps {
  data: {
    label: string
    nodeType: string
    icon: string
    description: string
  }
  selected?: boolean
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  const { label, nodeType, icon, description } = data
  
  return (
    <NodeContainer className={selected ? 'selected' : ''}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--md-sys-color-primary)' }}
      />
      
      <NodeHeader>
        <Icon icon={icon} style={{ fontSize: '16px' }} />
        {label}
      </NodeHeader>
      
      <NodeDescription>{description}</NodeDescription>
      <NodeType>{nodeType}</NodeType>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--md-sys-color-primary)' }}
      />
    </NodeContainer>
  )
}

export default CustomNode