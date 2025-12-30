import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from '../FlowPage.styled'

interface Node {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: string
  label: string
  icon: string
  description: string
}

interface Edge {
  id: string
  source: string
  target: string
}

interface NodeGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  projectName?: string
  onNodeDoubleClick?: (node: Node) => void
}

const NodeGraph: React.FC<NodeGraphProps> = ({
  nodes: externalNodes,
  edges: externalEdges,
  onNodesChange: onExternalNodesChange,
  onEdgesChange: onExternalEdgesChange,
  onNodeDoubleClick,
}: NodeGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>(externalNodes.length > 0 ? externalNodes : [
    {
      id: 'project-1',
      x: 50,
      y: 50,
      width: 140,
      height: 80,
      type: 'project',
      label: 'Project',
      icon: 'folder_open',
      description: 'Root project node'
    }
  ])
  const [edges, setEdges] = useState<Edge[]>(externalEdges)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectingMouse, setConnectingMouse] = useState<{ x: number; y: number } | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [lastClickedNode, setLastClickedNode] = useState<string | null>(null)

  const nodeTemplates = [
    { type: 'project', label: 'Project', icon: 'folder_open', description: 'Project root', configurable: false },
    { type: 'folders', label: 'Folders', icon: 'folder', description: 'Asset/Shot folders', configurable: true },
    { type: 'products', label: 'Products', icon: 'inventory_2', description: 'Published products', configurable: true },
    { type: 'versions', label: 'Versions', icon: 'history', description: 'Product versions', configurable: true },
    { type: 'tasks', label: 'Tasks', icon: 'task', description: 'Work tasks', configurable: false },
    { type: 'representations', label: 'Representations', icon: 'description', description: 'File representations', configurable: false },
    { type: 'results', label: 'Results', icon: 'table_chart', description: 'Execute query and show results', configurable: false },
  ]

  const addNode = (nodeTemplate: any) => {
    const newNode: Node = {
      id: `${nodeTemplate.type}-${Date.now()}`,
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      width: 140,
      height: 80,
      type: nodeTemplate.type,
      label: nodeTemplate.label,
      icon: nodeTemplate.icon,
      description: nodeTemplate.description,
    }
    
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    onExternalNodesChange(newNodes)
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with light background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2
    edges.forEach((edge: Edge) => {
      const sourceNode = nodes.find((n: Node) => n.id === edge.source)
      const targetNode = nodes.find((n: Node) => n.id === edge.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x + sourceNode.width / 2, sourceNode.y + sourceNode.height)
        ctx.lineTo(targetNode.x + targetNode.width / 2, targetNode.y)
        ctx.stroke()
        
        // Draw arrow
        const angle = Math.atan2(targetNode.y - (sourceNode.y + sourceNode.height), 
                                targetNode.x + targetNode.width / 2 - (sourceNode.x + sourceNode.width / 2))
        ctx.save()
        ctx.translate(targetNode.x + targetNode.width / 2, targetNode.y)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-10, -5)
        ctx.lineTo(-10, 5)
        ctx.closePath()
        ctx.fillStyle = '#666666'
        ctx.fill()
        ctx.restore()
      }
    })

    // Draw nodes
  nodes.forEach((node: Node) => {
      // Highlight node if it's the connection source
      const isConnectingSource = connecting === node.id
      const isSelected = selectedNode === node.id
      
      // Node background - use solid colors instead of CSS variables
      ctx.fillStyle = isConnectingSource ? '#FF5722' : (isSelected ? '#4CAF50' : '#2D2D2D')
      ctx.strokeStyle = isConnectingSource ? '#FF7043' : (isSelected ? '#66BB6A' : '#555555')
      ctx.lineWidth = isConnectingSource ? 3 : 2
      
      // Draw rounded rectangle
      const radius = 8
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, node.height, radius)
      ctx.fill()
      ctx.stroke()

      // Draw icon area (top part)
      ctx.fillStyle = isConnectingSource ? '#E64A19' : (isSelected ? '#388E3C' : '#1F1F1F')
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, 30, [radius, radius, 0, 0])
      ctx.fill()

      // Draw text - Label
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x + node.width / 2, node.y + 20)
      
      // Draw text - Description
      ctx.font = '12px Arial'
      ctx.fillStyle = '#CCCCCC'
      ctx.fillText(node.description, node.x + node.width / 2, node.y + 45)
      
      // Draw text - Type
      ctx.font = 'bold 10px Arial'
      ctx.fillStyle = isConnectingSource ? '#FFAB91' : (isSelected ? '#81C784' : '#2196F3')
      ctx.fillText(node.type.toUpperCase(), node.x + node.width / 2, node.y + 65)
      
      // Draw connection points
      const pointSize = 6
      const pointColor = isConnectingSource ? '#FFEB3B' : '#FF9800'
      
      // Top connection point
      ctx.fillStyle = pointColor
      ctx.beginPath()
      ctx.arc(node.x + node.width / 2, node.y, pointSize / 2, 0, 2 * Math.PI)
      ctx.fill()
      
      // Bottom connection point
      ctx.beginPath()
      ctx.arc(node.x + node.width / 2, node.y + node.height, pointSize / 2, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw connection preview line if connecting
    if (connecting && connectingMouse) {
      const sourceNode = nodes.find((n: Node) => n.id === connecting)
      if (sourceNode) {
        ctx.strokeStyle = '#FF5722'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(sourceNode.x + sourceNode.width / 2, sourceNode.y + sourceNode.height)
        ctx.lineTo(connectingMouse.x, connectingMouse.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }, [nodes, edges, selectedNode, connecting, connectingMouse])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getNodeAtPosition = (x: number, y: number): Node | null => {
    for (const node of nodes) {
      if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
        return node
      }
    }
    return null
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    
    // Scale mouse coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    console.log('Mouse down at:', x, y, 'Scale:', scaleX, scaleY)
    
    const node = getNodeAtPosition(x, y)
    
    if (node) {
      console.log('Node found:', node.label, 'at position:', node.x, node.y)
      
      // Check for double-click on configurable nodes
      const now = Date.now()
      const isDoubleClick = lastClickedNode === node.id && now - lastClickTime < 300
      
      if (isDoubleClick && onNodeDoubleClick) {
        console.log('Double-click detected on node:', node.label, 'type:', node.type)
        if (['folders', 'products', 'versions', 'results'].includes(node.type)) {
          console.log('Triggering double-click handler')
          onNodeDoubleClick(node)
          setLastClickTime(0)
          setLastClickedNode(null)
          return
        }
      }
      
      setLastClickTime(now)
      setLastClickedNode(node.id)
      
      if (event.ctrlKey || event.metaKey) {
        // Start connection
        console.log('Starting connection from node:', node.label)
        setConnecting(node.id)
        setConnectingMouse({ x, y })
        setSelectedNode(node.id)
        event.preventDefault()
        return
      } else {
        // Start dragging
        console.log('Starting drag for node:', node.label)
        setDraggedNode(node.id)
        setDragOffset({ x: x - node.x, y: y - node.y })
        setSelectedNode(node.id)
      }
    } else {
      console.log('No node found at position')
      setSelectedNode(null)
      setConnecting(null)
      setConnectingMouse(null)
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    
    // Scale mouse coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    if (connecting) {
      // Update only the preview endpoint (source is `connecting`)
      setConnectingMouse({ x, y })
      return
    }

    if (!draggedNode) return

    const newX = x - dragOffset.x
    const newY = y - dragOffset.y

    const newNodes = nodes.map((node: Node) =>
      node.id === draggedNode ? { ...node, x: newX, y: newY } : node
    )
    setNodes(newNodes)
    onExternalNodesChange(newNodes)
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Mouse up event')
    
    if (connecting) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      
      // Scale mouse coordinates to canvas coordinates
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY

      console.log('Looking for target node at:', x, y)
      const targetNode = getNodeAtPosition(x, y)
      
      if (targetNode && targetNode.id !== connecting) {
        console.log('Creating connection from', connecting, 'to', targetNode.id)
        // Create edge
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: connecting,
          target: targetNode.id
        }
        const newEdges = [...edges, newEdge]
        setEdges(newEdges)
        onExternalEdgesChange(newEdges)
        console.log('Connection created successfully!')
        alert(`Connected ${nodes.find((n: Node) => n.id === connecting)?.label} to ${targetNode.label}`)
      } else {
        console.log('No valid target found or same node')
      }
      setConnecting(null)
      setConnectingMouse(null)
    }

    setDraggedNode(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      // Delete selected node and its edges
      const newNodes = nodes.filter((n: Node) => n.id !== selectedNode)
      const newEdges = edges.filter((e: Edge) => e.source !== selectedNode && e.target !== selectedNode)
      
      setNodes(newNodes)
      setEdges(newEdges)
      onExternalNodesChange(newNodes)
      onExternalEdgesChange(newEdges)
      setSelectedNode(null)
    }
  }

  return (
    <>
      <Styled.NodePalette>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', width: '100%' }}>
          Node Palette - Click to add nodes:
        </div>
        {nodeTemplates.map((template) => (
          <Styled.NodeButton
            key={template.type}
            onClick={() => addNode(template)}
            title={template.description}
          >
            <Icon icon={template.icon} />
            {template.label}
          </Styled.NodeButton>
        ))}
        <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', width: '100%', marginTop: '8px' }}>
          {connecting 
            ? `🔗 Connecting from ${nodes.find((n: Node) => n.id === connecting)?.label} - Click target node` 
            : 'Double-click Folders/Products/Versions/Results to configure • Hold Ctrl+Click source then click target to connect • Delete to remove'}
        </div>
      </Styled.NodePalette>

      <Styled.GraphArea>
        {connecting && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FF5722',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            🔗 Connection Mode: Click on any node to connect to it
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            width: '100%',
            height: '100%',
            background: '#1a1a1a',
            cursor: draggedNode ? 'grabbing' : connecting ? 'crosshair' : 'default',
            border: '1px solid #555',
            borderRadius: '8px'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        />
      </Styled.GraphArea>
    </>
  )
}

export default NodeGraph