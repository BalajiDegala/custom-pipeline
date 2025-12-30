import React, { useState, useCallback } from 'react'
import { Panel } from '@ynput/ayon-react-components'
import NodeGraph from './components/NodeGraph'
import NodeConfigPanel from './components/NodeConfigPanel'
import ResultsNode from './components/ResultsNode'
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
  const [activeResultsNode, setActiveResultsNode] = useState<string | null>(null)

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes)
  }, [])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges)
  }, [])

  const handleNodeDoubleClick = (node: Node) => {
    console.log('Node double-clicked:', node.label, node.type)
    
    // Handle Results node differently - show results panel
    if (node.type === 'results') {
      setActiveResultsNode(node.id)
      return
    }
    
    // Handle configurable nodes
    if (['folders', 'products', 'versions'].includes(node.type)) {
      setConfigNode(node)
    }
  }

  const handleConfigSave = (nodeId: string, config: any) => {
    const updatedNodes = nodes.map((n: Node) =>
      n.id === nodeId ? { ...n, config } : n
    )
    setNodes(updatedNodes)
    setConfigNode(null)
  }

  return (
    <Styled.FlowPageContainer>
      <Styled.GraphContainer style={{ width: '100%' }}>
        <Panel style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Styled.PanelHeader>
            <h3>Pipeline Flow Editor</h3>
            <p>Create visual queries by connecting pipeline nodes</p>
          </Styled.PanelHeader>
          <NodeGraph
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDoubleClick={handleNodeDoubleClick}
            projectName={projectName}
          />
        </Panel>
        
        {configNode && (
          <NodeConfigPanel
            node={configNode}
            projectName={projectName || 'demo_Commercial'}
            onClose={() => setConfigNode(null)}
            onSave={handleConfigSave}
          />
        )}
        
        {activeResultsNode && (
          <ResultsNode
            resultsNodeId={activeResultsNode}
            nodes={nodes}
            edges={edges}
            projectName={projectName || 'demo_Commercial'}
            onClose={() => setActiveResultsNode(null)}
          />
        )}
      </Styled.GraphContainer>
    </Styled.FlowPageContainer>
  )
}

export default FlowPage
