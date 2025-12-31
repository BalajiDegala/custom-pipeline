import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from '../FlowPage.styled'
import NodeSearchPopup from './NodeSearchPopup'
import { nodeTemplates } from './NodeSearchPopup'

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
  config?: any
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
  onNodeConfigChange?: (nodeId: string, config: any) => void
}

const NodeGraph: React.FC<NodeGraphProps> = ({
  nodes: externalNodes,
  edges: externalEdges,
  onNodesChange: onExternalNodesChange,
  onEdgesChange: onExternalEdgesChange,
  onNodeDoubleClick,
}: NodeGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [nodes, setNodes] = useState<Node[]>(externalNodes.length > 0 ? externalNodes : [
    {
      id: 'project-1',
      x: 100,
      y: 200,
      width: 180,
      height: 100,
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
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // Context menu / search popup
  const [showNodeSearch, setShowNodeSearch] = useState(false)
  const [nodeSearchPosition, setNodeSearchPosition] = useState({ x: 0, y: 0 })
  const [canvasClickPosition, setCanvasClickPosition] = useState({ x: 0, y: 0 })

  // Sync external nodes
  useEffect(() => {
    if (externalNodes.length > 0) {
      setNodes(externalNodes)
    }
  }, [externalNodes])

  useEffect(() => {
    setEdges(externalEdges)
  }, [externalEdges])

  const addNode = (nodeTemplate: any, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${nodeTemplate.type}-${Date.now()}`,
      x: position?.x ?? Math.random() * 300 + 100,
      y: position?.y ?? Math.random() * 200 + 100,
      width: 180,
      height: 100,
      type: nodeTemplate.type,
      label: nodeTemplate.label,
      icon: nodeTemplate.icon,
      description: nodeTemplate.description,
      config: {},
    }
    
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    onExternalNodesChange(newNodes)
  }

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    }
  }, [pan, zoom])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and fill background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan transform
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)
    
    // Draw grid pattern
    const gridSize = 50
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1 / zoom
    
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize
    const endX = startX + canvas.width / zoom + gridSize * 2
    const endY = startY + canvas.height / zoom + gridSize * 2
    
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }

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
      const isConnectingSource = connecting === node.id
      const isSelected = selectedNode === node.id
      const hasConfig = node.config && Object.keys(node.config).length > 0
      
      // Node background
      ctx.fillStyle = isConnectingSource ? '#FF5722' : (isSelected ? '#4CAF50' : '#2D2D2D')
      ctx.strokeStyle = isConnectingSource ? '#FF7043' : (isSelected ? '#66BB6A' : '#555555')
      ctx.lineWidth = isConnectingSource ? 3 : 2
      
      const radius = 8
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, node.height, radius)
      ctx.fill()
      ctx.stroke()

      // Header area
      ctx.fillStyle = isConnectingSource ? '#E64A19' : (isSelected ? '#388E3C' : '#1F1F1F')
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, node.width, 35, [radius, radius, 0, 0])
      ctx.fill()

      // Label
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x + node.width / 2, node.y + 23)
      
      // Description
      ctx.font = '11px Arial'
      ctx.fillStyle = '#CCCCCC'
      ctx.fillText(node.description, node.x + node.width / 2, node.y + 55)
      
      // Type badge
      ctx.font = 'bold 10px Arial'
      ctx.fillStyle = isConnectingSource ? '#FFAB91' : (isSelected ? '#81C784' : '#2196F3')
      ctx.fillText(node.type.toUpperCase(), node.x + node.width / 2, node.y + 75)
      
      // Config indicator (green checkmark if configured)
      if (hasConfig && Object.values(node.config).some((v: any) => Array.isArray(v) ? v.length > 0 : !!v)) {
        ctx.fillStyle = '#4CAF50'
        ctx.beginPath()
        ctx.arc(node.x + node.width - 15, node.y + 15, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = '#FFF'
        ctx.font = 'bold 8px Arial'
        ctx.fillText('✓', node.x + node.width - 15, node.y + 18)
      }
      
      // Connection points
      const pointSize = 8
      const pointColor = isConnectingSource ? '#FFEB3B' : '#FF9800'
      
      ctx.fillStyle = pointColor
      ctx.beginPath()
      ctx.arc(node.x + node.width / 2, node.y, pointSize / 2, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(node.x + node.width / 2, node.y + node.height, pointSize / 2, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Connection preview line
    if (connecting && connectingMouse) {
      const sourceNode = nodes.find((n: Node) => n.id === connecting)
      if (sourceNode) {
        const canvasPos = screenToCanvas(connectingMouse.x, connectingMouse.y)
        ctx.strokeStyle = '#FF5722'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(sourceNode.x + sourceNode.width / 2, sourceNode.y + sourceNode.height)
        ctx.lineTo(canvasPos.x, canvasPos.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
    
    ctx.restore()
  }, [nodes, edges, selectedNode, connecting, connectingMouse, zoom, pan, screenToCanvas])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        drawCanvas()
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawCanvas])

  const getNodeAtPosition = (canvasX: number, canvasY: number): Node | null => {
    for (const node of nodes) {
      if (canvasX >= node.x && canvasX <= node.x + node.width && 
          canvasY >= node.y && canvasY <= node.y + node.height) {
        return node
      }
    }
    return null
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const { x, y } = screenToCanvas(screenX, screenY)

    // Middle mouse button or Shift+drag for panning
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      setIsPanning(true)
      setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y })
      event.preventDefault()
      return
    }
    
    const node = getNodeAtPosition(x, y)
    
    if (node) {
      const now = Date.now()
      const isDoubleClick = lastClickedNode === node.id && now - lastClickTime < 300
      
      if (isDoubleClick && onNodeDoubleClick) {
        const configurableTypes = ['folders', 'products', 'versions', 'tasks', 'departments', 'artists', 'columns', 'results']
        if (configurableTypes.includes(node.type)) {
          onNodeDoubleClick(node)
          setLastClickTime(0)
          setLastClickedNode(null)
          return
        }
      }
      
      setLastClickTime(now)
      setLastClickedNode(node.id)
      
      if (event.ctrlKey || event.metaKey) {
        setConnecting(node.id)
        setConnectingMouse({ x: screenX, y: screenY })
        setSelectedNode(node.id)
        event.preventDefault()
        return
      } else {
        setDraggedNode(node.id)
        setDragOffset({ x: x - node.x, y: y - node.y })
        setSelectedNode(node.id)
      }
    } else {
      setSelectedNode(null)
      setConnecting(null)
      setConnectingMouse(null)
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isPanning) {
      setPan({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y
      })
      return
    }

    const rect = canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top

    if (connecting) {
      setConnectingMouse({ x: screenX, y: screenY })
      return
    }

    if (!draggedNode) return

    const { x, y } = screenToCanvas(screenX, screenY)
    const newX = x - dragOffset.x
    const newY = y - dragOffset.y

    const newNodes = nodes.map((node: Node) =>
      node.id === draggedNode ? { ...node, x: newX, y: newY } : node
    )
    setNodes(newNodes)
    onExternalNodesChange(newNodes)
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false)
      return
    }
    
    if (connecting) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = event.clientX - rect.left
      const screenY = event.clientY - rect.top
      const { x, y } = screenToCanvas(screenX, screenY)

      const targetNode = getNodeAtPosition(x, y)
      
      if (targetNode && targetNode.id !== connecting) {
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: connecting,
          target: targetNode.id
        }
        const newEdges = [...edges, newEdge]
        setEdges(newEdges)
        onExternalEdgesChange(newEdges)
      }
      setConnecting(null)
      setConnectingMouse(null)
    }

    setDraggedNode(null)
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * delta, 0.2), 3)
    
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)
      
      setPan({ x: newPanX, y: newPanY })
    }
    
    setZoom(newZoom)
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const canvasPos = screenToCanvas(screenX, screenY)
    
    setNodeSearchPosition({ x: event.clientX, y: event.clientY })
    setCanvasClickPosition(canvasPos)
    setShowNodeSearch(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      const newNodes = nodes.filter((n: Node) => n.id !== selectedNode)
      const newEdges = edges.filter((e: Edge) => e.source !== selectedNode && e.target !== selectedNode)
      
      setNodes(newNodes)
      setEdges(newEdges)
      onExternalNodesChange(newNodes)
      onExternalEdgesChange(newEdges)
      setSelectedNode(null)
    }
    
    // Tab key to open node search
    if (event.key === 'Tab') {
      event.preventDefault()
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        setNodeSearchPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        setCanvasClickPosition(screenToCanvas(rect.width / 2, rect.height / 2))
        setShowNodeSearch(true)
      }
    }
    
    // Reset zoom with 'r'
    if (event.key === 'r' || event.key === 'R') {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleNodeSelect = (template: typeof nodeTemplates[0]) => {
    addNode(template, canvasClickPosition)
    setShowNodeSearch(false)
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const zoomIn = () => setZoom(Math.min(zoom * 1.2, 3))
  const zoomOut = () => setZoom(Math.max(zoom * 0.8, 0.2))

  return (
    <Styled.GraphArea ref={containerRef}>
      {/* Zoom Controls */}
      <Styled.ZoomControls>
        <Styled.ZoomButton onClick={zoomIn} title="Zoom In">+</Styled.ZoomButton>
        <Styled.ZoomLevel>{Math.round(zoom * 100)}%</Styled.ZoomLevel>
        <Styled.ZoomButton onClick={zoomOut} title="Zoom Out">−</Styled.ZoomButton>
        <Styled.ZoomButton onClick={resetView} title="Reset View (R)">⌂</Styled.ZoomButton>
      </Styled.ZoomControls>
      
      {/* Help text */}
      <Styled.HelpText>
        Right-click or Tab: Add node • Ctrl+Click: Connect • Delete: Remove • Shift+Drag or Scroll: Pan/Zoom • R: Reset
      </Styled.HelpText>

      {connecting && (
        <Styled.ConnectionBanner>
          🔗 Click target node to connect from {nodes.find((n: Node) => n.id === connecting)?.label}
        </Styled.ConnectionBanner>
      )}
      
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : draggedNode ? 'grabbing' : connecting ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
      
      {showNodeSearch && (
        <NodeSearchPopup
          position={nodeSearchPosition}
          onSelect={handleNodeSelect}
          onClose={() => setShowNodeSearch(false)}
        />
      )}
    </Styled.GraphArea>
  )
}

export default NodeGraph