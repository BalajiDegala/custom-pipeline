import React, { useState, useCallback } from 'react'
import { Panel, Button, Icon } from '@ynput/ayon-react-components'
import NodeGraph from './components/NodeGraph'
import InlineNodeConfig from './components/InlineNodeConfig'
import ResultsFullPage from './components/ResultsFullPage'
import ScriptManager from './components/ScriptManager'
import * as Styled from './FlowPage.styled'

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

interface FlowPageProps {
  projectName?: string
}

const FlowPage: React.FC<FlowPageProps> = ({ projectName }) => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [configNode, setConfigNode] = useState<Node | null>(null)
  const [configPosition, setConfigPosition] = useState({ x: 0, y: 0 })
  const [activeResultsNode, setActiveResultsNode] = useState<string | null>(null)
  const [showScriptManager, setShowScriptManager] = useState(false)

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes)
  }, [])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges)
  }, [])

  const handleNodeDoubleClick = (node: Node) => {
    console.log('Node double-clicked:', node.label, node.type)
    
    // Handle Results node - open full page results
    if (node.type === 'results') {
      setActiveResultsNode(node.id)
      return
    }
    
    // Handle configurable nodes with inline config
    const configurableTypes = ['folders', 'products', 'versions', 'tasks', 'departments', 'artists', 'columns']
    if (configurableTypes.includes(node.type)) {
      const nodeWithConfig = nodes.find(n => n.id === node.id) || node
      // Position config panel near the node
      setConfigPosition({ 
        x: Math.min(node.x + node.width + 20, window.innerWidth - 350),
        y: Math.max(node.y, 100)
      })
      setConfigNode(nodeWithConfig as Node)
    }
  }

  const handleConfigSave = (nodeId: string, config: any) => {
    const updatedNodes = nodes.map((n: Node) =>
      n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
    )
    setNodes(updatedNodes)
    setConfigNode(null)
  }

  const handleLoadScript = (loadedNodes: Node[], loadedEdges: Edge[]) => {
    setNodes(loadedNodes)
    setEdges(loadedEdges)
  }

  const clearFlow = () => {
    if (confirm('Clear all nodes and connections?')) {
      setNodes([{
        id: 'project-1',
        x: 100,
        y: 200,
        width: 180,
        height: 100,
        type: 'project',
        label: 'Project',
        icon: 'folder_open',
        description: 'Root project node'
      }])
      setEdges([])
    }
  }

  return (
    <Styled.FlowPageContainer>
      <Styled.GraphContainer style={{ width: '100%' }}>
        <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <Styled.Toolbar>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Pipeline Flow Editor</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Create visual queries by connecting pipeline nodes
              </p>
            </div>
            <Styled.ToolbarDivider />
            <Button variant="text" onClick={() => setShowScriptManager(true)}>
              <Icon icon="save" /> Scripts
            </Button>
            <Button variant="text" onClick={clearFlow}>
              <Icon icon="delete_sweep" /> Clear
            </Button>
          </Styled.Toolbar>
          
          {/* Graph Area - Full Size */}
          <NodeGraph
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeConfigChange={handleConfigSave}
            projectName={projectName}
          />
        </Panel>
        
        {/* Inline Node Config */}
        {configNode && (
          <InlineNodeConfig
            node={configNode}
            projectName={projectName || 'demo_Commercial'}
            position={configPosition}
            onClose={() => setConfigNode(null)}
            onSave={handleConfigSave}
          />
        )}
        
        {/* Full Page Results */}
        {activeResultsNode && (
          <ResultsFullPage
            resultsNodeId={activeResultsNode}
            nodes={nodes}
            edges={edges}
            projectName={projectName || 'demo_Commercial'}
            onClose={() => setActiveResultsNode(null)}
          />
        )}
        
        {/* Script Manager */}
        {showScriptManager && (
          <ScriptManager
            nodes={nodes}
            edges={edges}
            projectName={projectName || 'demo_Commercial'}
            onLoad={handleLoadScript}
            onClose={() => setShowScriptManager(false)}
          />
        )}
      </Styled.GraphContainer>
    </Styled.FlowPageContainer>
  )
}

export default FlowPage
