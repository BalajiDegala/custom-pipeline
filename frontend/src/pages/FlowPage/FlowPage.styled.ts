import styled from 'styled-components'

export const FlowPageContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
`

export const GraphContainer = styled.div`
  flex: 2;
  min-width: 600px;
  height: 100%;
  
  .react-flow {
    background-color: var(--md-sys-color-surface-container);
  }
  
  .react-flow__node {
    background-color: var(--md-sys-color-surface-container-highest);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 8px;
    color: var(--md-sys-color-on-surface);
    font-size: 12px;
    padding: 8px;
    min-width: 120px;
  }
  
  .react-flow__node.selected {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 1px var(--md-sys-color-primary);
  }
  
  .react-flow__edge {
    stroke: var(--md-sys-color-outline);
  }
  
  .react-flow__edge.selected {
    stroke: var(--md-sys-color-primary);
  }
  
  .react-flow__handle {
    background-color: var(--md-sys-color-primary);
    border: 1px solid var(--md-sys-color-primary);
    width: 8px;
    height: 8px;
  }
  
  .react-flow__controls {
    background-color: var(--md-sys-color-surface-container-highest);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 8px;
    
    button {
      background-color: transparent;
      border: none;
      color: var(--md-sys-color-on-surface);
      
      &:hover {
        background-color: var(--md-sys-color-surface-container-high);
      }
    }
  }
  
  .react-flow__minimap {
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 8px;
  }
`

export const QueryContainer = styled.div`
  flex: 1;
  min-width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
`

export const PanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  
  h3 {
    margin: 0 0 8px 0;
    color: var(--md-sys-color-on-surface);
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 14px;
  }
`

export const NodePalette = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
`

export const NodeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--md-sys-color-surface-container-highest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 6px;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary-container);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .icon {
    font-size: 16px;
  }
`

export const GraphArea = styled.div`
  flex: 1;
  position: relative;
  background-color: var(--md-sys-color-surface-container);
  border-radius: 8px;
  overflow: hidden;
`

export const ZoomControls = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  padding: 4px;
  z-index: 10;
`

export const ZoomButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
`

export const ZoomLevel = styled.span`
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
`

export const HelpText = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 8px 12px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 6px;
  font-size: 11px;
  color: var(--md-sys-color-on-surface-variant);
  z-index: 10;
`

export const ConnectionBanner = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #FF5722;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

export const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--md-sys-color-outline-variant);
  margin: 0 8px;
`