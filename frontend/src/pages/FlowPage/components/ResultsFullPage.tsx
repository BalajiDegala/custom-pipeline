import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ResultsModal = styled.div`
  width: 90vw;
  height: 90vh;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
  flex-wrap: wrap;
  gap: 12px;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const ResultsTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
`

const ResultsCount = styled.span`
  padding: 4px 10px;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
`

const ResultsBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
  position: relative;
`

const TableContainer = styled.div`
  width: 100%;
  overflow: auto;
  background: var(--md-sys-color-surface);
  border-radius: 8px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
    
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    
    th {
      background: var(--md-sys-color-surface-container-highest);
      font-weight: 600;
      position: sticky;
      top: 0;
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background: var(--md-sys-color-surface-container-high);
      }
      
      &.sortable::after {
        content: ' ⇅';
        opacity: 0.5;
      }
      
      &.sorted-asc::after {
        content: ' ↑';
        opacity: 1;
      }
      
      &.sorted-desc::after {
        content: ' ↓';
        opacity: 1;
      }
    }
    
    tr:hover td {
      background: var(--md-sys-color-surface-container);
    }
  }
`

const LoadingMessage = styled.div`
  padding: 60px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 16px;
`

const ErrorMessage = styled.div`
  padding: 24px;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: 8px;
  margin: 16px;
`

const ColumnOrderPanel = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const ColumnOrderTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--md-sys-color-on-surface);
`

const ColumnChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ColumnChip = styled.div<{ $isDragging?: boolean; $hidden?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.$hidden ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container-highest)'};
  border: 1px solid ${props => props.$hidden ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-outline-variant)'};
  border-radius: 20px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
  opacity: ${props => props.$isDragging ? 0.5 : props.$hidden ? 0.6 : 1};
  text-decoration: ${props => props.$hidden ? 'line-through' : 'none'};
  
  &:hover {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  
  .grip {
    color: var(--md-sys-color-on-surface-variant);
    cursor: grab;
  }
  
  .visibility-toggle {
    cursor: pointer;
    color: ${props => props.$hidden ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-primary)'};
    
    &:hover {
      color: var(--md-sys-color-primary);
    }
  }
`

// Bulk Edit Styled Components
const BulkEditToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--md-sys-color-primary-container);
  border-bottom: 1px solid var(--md-sys-color-primary);
`

const BulkEditInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--md-sys-color-on-primary-container);
`

const BulkEditActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`

const BulkEditSelect = styled.select`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-size: 13px;
  cursor: pointer;
  
  &:focus {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
`

const BulkEditInput = styled.input`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-size: 13px;
  min-width: 200px;
  
  &:focus {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
`

const RowCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--md-sys-color-primary);
`

const SelectAllCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--md-sys-color-primary);
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--md-sys-color-surface-container);
  border-radius: 6px;
  padding: 2px 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  
  &:focus-within {
    border-color: var(--md-sys-color-primary);
  }
`

const SearchInput = styled.input`
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: 13px;
  min-width: 120px;
  padding: 4px 0;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--md-sys-color-on-surface-variant);
  }
`

// Edit History Panel
const HistoryPanel = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background: var(--md-sys-color-surface-container);
  border-left: 1px solid var(--md-sys-color-outline-variant);
  display: ${props => props.$visible ? 'flex' : 'none'};
  flex-direction: column;
  z-index: 200;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
`

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-high);
`

const HistoryTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`

const HistoryList = styled.div`
  flex: 1;
  overflow: auto;
  padding: 8px;
`

const HistoryItem = styled.div<{ $current?: boolean }>`
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.$current ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)'};
  border-radius: 8px;
  border: 1px solid ${props => props.$current ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'};
  
  .field-name {
    font-weight: 500;
    color: var(--md-sys-color-primary);
    margin-bottom: 4px;
  }
  
  .change {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  
  .old-value {
    color: var(--md-sys-color-error);
    text-decoration: line-through;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .arrow {
    color: var(--md-sys-color-on-surface-variant);
  }
  
  .new-value {
    color: var(--md-sys-color-tertiary);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .timestamp {
    font-size: 11px;
    color: var(--md-sys-color-on-surface-variant);
    margin-top: 6px;
  }
`

const HistoryEmpty = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
`

// Pagination Styled Components
const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-low);
  gap: 16px;
  flex-wrap: wrap;
`

const PaginationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  
  select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--md-sys-color-outline);
    background: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    font-size: 14px;
    cursor: pointer;
    
    &:hover {
      border-color: var(--md-sys-color-primary);
    }
  }
`

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid ${props => props.$active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'};
  background: ${props => props.$active ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)'};
  color: ${props => props.$active ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$active ? 600 : 400};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

// Hierarchical View Styled Components
const HierarchyContainer = styled.div`
  padding: 16px;
  overflow: auto;
  height: 100%;
`

const HierarchyNode = styled.div<{ $level: number; $type: string }>`
  margin-left: ${props => props.$level * 24}px;
  margin-bottom: 4px;
`

const HierarchyHeader = styled.div<{ $type: string; $expanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => {
    switch (props.$type) {
      case 'project': return 'var(--md-sys-color-primary-container)';
      case 'department': return 'var(--md-sys-color-secondary-container)';
      case 'artist': return 'var(--md-sys-color-tertiary-container)';
      case 'folder': return 'var(--md-sys-color-surface-container-high)';
      default: return 'var(--md-sys-color-surface-container)';
    }
  }};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }
  
  .expand-icon {
    transition: transform 0.2s;
    transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`

const HierarchyLabel = styled.span`
  font-weight: 500;
  flex: 1;
`

const HierarchyCount = styled.span`
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface);
  padding: 2px 8px;
  border-radius: 12px;
`

const HierarchyChildren = styled.div`
  margin-top: 4px;
  margin-left: 16px;
  border-left: 2px solid var(--md-sys-color-outline-variant);
  padding-left: 8px;
`

const ViewModeToggle = styled.div`
  display: flex;
  gap: 4px;
  background: var(--md-sys-color-surface-container);
  padding: 4px;
  border-radius: 8px;
`

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${props => props.$active ? 'var(--md-sys-color-primary)' : 'transparent'};
  color: ${props => props.$active ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.$active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)'};
  }
`

// Gantt/Timeline View Styled Components
const GanttContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

const GanttHeader = styled.div`
  display: flex;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
  position: sticky;
  top: 0;
  z-index: 10;
`

const GanttTaskColumn = styled.div`
  min-width: 250px;
  max-width: 250px;
  padding: 8px 12px;
  font-weight: 500;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container);
`

const GanttTimelineHeader = styled.div`
  flex: 1;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  
  /* Show scrollbar for timeline navigation */
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: var(--md-sys-color-surface-container);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--md-sys-color-on-surface-variant);
  }
`

const GanttDayHeader = styled.div<{ $isWeekend?: boolean; $isToday?: boolean }>`
  min-width: 40px;
  padding: 4px 2px;
  text-align: center;
  font-size: 11px;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  background: ${props => props.$isToday 
    ? 'var(--md-sys-color-primary-container)' 
    : props.$isWeekend 
      ? 'var(--md-sys-color-surface-container-high)' 
      : 'transparent'};
  
  .day-num {
    font-weight: 500;
  }
  
  .day-name {
    font-size: 9px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const GanttBody = styled.div`
  flex: 1;
  overflow: auto;
  /* Hide horizontal scrollbar since header controls horizontal scroll */
  &::-webkit-scrollbar:horizontal {
    height: 8px;
  }
`

const GanttRow = styled.div`
  display: flex;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  min-height: 36px;
  
  &:hover {
    background: var(--md-sys-color-surface-container);
  }
`

const GanttTaskCell = styled.div`
  min-width: 250px;
  max-width: 250px;
  padding: 8px 12px;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--md-sys-color-surface);
  position: sticky;
  left: 0;
  z-index: 5;
`

const GanttTimelineRow = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  min-height: 36px;
`

const GanttDayCell = styled.div<{ $isWeekend?: boolean; $isToday?: boolean }>`
  min-width: 40px;
  border-right: 1px solid var(--md-sys-color-outline-variant);
  background: ${props => props.$isToday 
    ? 'var(--md-sys-color-primary-container)' 
    : props.$isWeekend 
      ? 'var(--md-sys-color-surface-container-high)' 
      : 'transparent'};
`

const GanttBar = styled.div<{ $color?: string; $left: number; $width: number; $isDragging?: boolean }>`
  position: absolute;
  top: 4px;
  height: 28px;
  left: ${props => props.$left}px;
  width: ${props => Math.max(props.$width, 20)}px;
  background: ${props => props.$color || 'var(--md-sys-color-primary)'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: white;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: ${props => props.$isDragging ? '0 4px 12px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.2)'};
  z-index: ${props => props.$isDragging ? 100 : 2};
  opacity: ${props => props.$isDragging ? 0.9 : 1};
  transform: ${props => props.$isDragging ? 'scale(1.02)' : 'none'};
  transition: ${props => props.$isDragging ? 'none' : 'box-shadow 0.2s, transform 0.1s'};
  user-select: none;
  
  &:hover {
    filter: brightness(1.1);
  }
`

const MilestoneMarker = styled.div<{ $left: number; $color?: string }>`
  position: absolute;
  top: 8px;
  left: ${props => props.$left}px;
  width: 20px;
  height: 20px;
  background: ${props => props.$color || 'var(--md-sys-color-tertiary)'};
  transform: rotate(45deg);
  border-radius: 3px;
  z-index: 3;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  
  &:hover {
    filter: brightness(1.2);
  }
`

const DependencyLine = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`

const GanttControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const GanttZoomControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`

// Workload View styled components
const WorkloadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: auto;
  flex: 1;
`

const WorkloadArtistCard = styled.div`
  background: var(--md-sys-color-surface-container);
  border-radius: 8px;
  overflow: hidden;
`

const WorkloadArtistHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--md-sys-color-surface-container-high);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const WorkloadArtistAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--md-sys-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-primary);
  font-weight: 600;
  font-size: 14px;
`

const WorkloadArtistInfo = styled.div`
  flex: 1;
  
  .name {
    font-weight: 600;
    font-size: 14px;
  }
  
  .stats {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const WorkloadProgressBar = styled.div<{ $percentage: number; $overloaded: boolean }>`
  width: 120px;
  height: 8px;
  background: var(--md-sys-color-surface-container-highest);
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => Math.min(props.$percentage, 100)}%;
    height: 100%;
    background: ${props => props.$overloaded 
      ? 'var(--md-sys-color-error)' 
      : props.$percentage > 80 
        ? 'var(--md-sys-color-warning, orange)' 
        : 'var(--md-sys-color-primary)'
    };
    transition: width 0.3s;
  }
`

const WorkloadTaskList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 0;
`

const WorkloadTaskItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
`

// Dashboard/Reporting styled components
const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
  overflow: auto;
  flex: 1;
`

const DashboardWidget = styled.div`
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const WidgetTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  gap: 8px;
`

const WidgetValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: var(--md-sys-color-primary);
`

const WidgetSubtext = styled.div`
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
`

const ProgressBar = styled.div<{ $percentage: number; $color?: string }>`
  width: 100%;
  height: 8px;
  background: var(--md-sys-color-surface-container-highest);
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.$percentage}%;
    height: 100%;
    background: ${props => props.$color || 'var(--md-sys-color-primary)'};
    transition: width 0.3s;
  }
`

const StatusBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`

const StatusDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color};
`

const ChartBar = styled.div<{ $height: number; $color?: string }>`
  width: 100%;
  height: ${props => props.$height}px;
  background: ${props => props.$color || 'var(--md-sys-color-primary)'};
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
`

const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
  padding-top: 8px;
`

const ChartColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const ChartLabel = styled.div`
  font-size: 10px;
  color: var(--md-sys-color-on-surface-variant);
`

// Calendar View styled components
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`

const CalendarControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const CalendarMonthTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  min-width: 180px;
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--md-sys-color-outline-variant);
  flex: 1;
`

const CalendarDayHeader = styled.div`
  background: var(--md-sys-color-surface-container);
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
`

const CalendarDay = styled.div<{ $isToday?: boolean; $isCurrentMonth?: boolean }>`
  background: ${props => props.$isToday 
    ? 'var(--md-sys-color-primary-container)' 
    : 'var(--md-sys-color-surface)'
  };
  min-height: 100px;
  padding: 4px;
  opacity: ${props => props.$isCurrentMonth ? 1 : 0.5};
`

const CalendarDayNumber = styled.div<{ $isToday?: boolean }>`
  font-size: 12px;
  font-weight: ${props => props.$isToday ? 700 : 400};
  color: ${props => props.$isToday 
    ? 'var(--md-sys-color-primary)' 
    : 'var(--md-sys-color-on-surface-variant)'
  };
  padding: 4px;
`

const CalendarTask = styled.div<{ $color?: string }>`
  background: ${props => props.$color || 'var(--md-sys-color-primary)'};
  color: white;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  margin: 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  
  &:hover {
    filter: brightness(1.1);
  }
`

// Production Templates Modal styled components
const TemplateModal = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`

const TemplateModalContent = styled.div`
  background: var(--md-sys-color-surface);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const TemplateModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const TemplateModalTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
`

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 24px;
  overflow-y: auto;
`

const TemplateCard = styled.div<{ $selected?: boolean }>`
  background: var(--md-sys-color-surface-container);
  border: 2px solid ${props => props.$selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-container-high);
  }
`

const TemplateCardIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`

const TemplateCardTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`

const TemplateCardDescription = styled.div`
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
`

const TemplatePreview = styled.div`
  background: var(--md-sys-color-surface-container-low);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
  font-family: monospace;
  font-size: 11px;
  white-space: pre;
  max-height: 120px;
  overflow-y: auto;
`

// Production structure templates
const PRODUCTION_TEMPLATES = {
  vfx_shot: {
    name: 'VFX Shot Structure',
    icon: '🎬',
    description: 'Standard VFX shot breakdown with departments',
    preview: `📁 Sequences
  📁 SEQ010
    📁 SH010
      📋 Matchmove
      📋 Roto
      📋 Comp
    📁 SH020
      📋 Matchmove
      📋 Roto
      📋 Comp`,
    folders: ['Sequences'],
    taskTypes: ['Matchmove', 'Roto', 'Comp', 'Lighting', 'FX']
  },
  animation_episode: {
    name: 'Animation Episode',
    icon: '📺',
    description: 'TV/Streaming episode structure',
    preview: `📁 Episodes
  📁 EP101
    📁 Scenes
      📁 SC01
        📋 Layout
        📋 Animation
        📋 Lighting
      📁 SC02
        📋 Layout
        📋 Animation
        📋 Lighting`,
    folders: ['Episodes'],
    taskTypes: ['Layout', 'Animation', 'Lighting', 'Rendering', 'Comp']
  },
  asset_library: {
    name: 'Asset Library',
    icon: '🎨',
    description: 'Character and prop asset structure',
    preview: `📁 Assets
  📁 Characters
    📁 Hero_Character
      📋 Modeling
      📋 Rigging
      📋 Surfacing
  📁 Props
    📁 Prop_001
      📋 Modeling
      📋 Surfacing`,
    folders: ['Assets', 'Characters', 'Props', 'Environments', 'Vehicles'],
    taskTypes: ['Modeling', 'Rigging', 'Surfacing', 'Lookdev']
  },
  feature_film: {
    name: 'Feature Film',
    icon: '🎥',
    description: 'Full feature film production structure',
    preview: `📁 Sequences
  📁 Reel_1
    📁 SEQ_0100
      📁 Shot_0100_0010
        📋 Layout
        📋 Animation
        📋 Lighting
        📋 Comp`,
    folders: ['Sequences', 'Assets'],
    taskTypes: ['Previs', 'Layout', 'Animation', 'Lighting', 'FX', 'Comp', 'DMP']
  },
  commercial: {
    name: 'Commercial/Short',
    icon: '📢',
    description: 'Quick turnaround commercial structure',
    preview: `📁 Shots
  📁 Shot_001
    📋 Design
    📋 Animation
    📋 Comp
  📁 Shot_002
    📋 Design
    📋 Animation
    📋 Comp`,
    folders: ['Shots', 'Assets'],
    taskTypes: ['Design', 'Animation', 'Comp', 'Finishing']
  }
}

interface Node {
  id: string
  type: string
  label: string
  config?: any
}

interface Edge {
  id: string
  source: string
  target: string
}

interface ResultsFullPageProps {
  resultsNodeId: string
  nodes: Node[]
  edges: Edge[]
  projectName: string
  allProjects?: string[]
  onClose: () => void
  selectedColumns?: string[]
}

// Hierarchical result structure
interface HierarchicalNode {
  type: string
  name: string
  data: any
  children: HierarchicalNode[]
  expanded?: boolean
}

const ResultsFullPage: React.FC<ResultsFullPageProps> = ({
  resultsNodeId,
  nodes,
  edges,
  projectName,
  allProjects = [],
  onClose,
  selectedColumns: initialSelectedColumns
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [hierarchicalResults, setHierarchicalResults] = useState<HierarchicalNode[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy' | 'timeline' | 'workload' | 'dashboard' | 'calendar'>('hierarchy')
  const [columns, setColumns] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [showColumnOrder, setShowColumnOrder] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{rowIdx: number, column: string} | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [statusOptions, setStatusOptions] = useState<{name: string, color: string, state: string}[]>([])
  const [availableUsers, setAvailableUsers] = useState<{name: string, fullName: string}[]>([])
  
  // Timeline/Gantt view state
  const [timelineZoom, setTimelineZoom] = useState<'day' | 'week' | 'month'>('day')
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    const today = new Date()
    today.setDate(today.getDate() - 7) // Start a week before today
    return today
  })
  const [timelineDays, setTimelineDays] = useState(60) // Show 60 days by default
  const [draggingTask, setDraggingTask] = useState<{ rowIdx: number; startX: number; originalLeft: number } | null>(null)
  const [dragDelta, setDragDelta] = useState(0)
  
  // Calendar view state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date())
  
  // Bulk editing state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [bulkEditField, setBulkEditField] = useState<string>('')
  const [bulkEditValue, setBulkEditValue] = useState<string>('')
  const [bulkSaving, setBulkSaving] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100) // 100 rows per page default
  
  // Edit history for undo/redo
  interface EditHistoryEntry {
    timestamp: Date
    entityType: string
    entityId: string
    projectName: string
    field: string
    oldValue: any
    newValue: any
    rowIdx: number
  }
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1) // -1 means at the latest state
  const [undoing, setUndoing] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Performance: Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Performance: Virtualization state
  const [visibleRowRange, setVisibleRowRange] = useState({ start: 0, end: 50 })
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const ROW_HEIGHT = 36 // pixels per row
  const BUFFER_ROWS = 10 // extra rows to render above/below viewport

  // Gantt synchronized scroll refs
  const ganttHeaderRef = useRef<HTMLDivElement>(null)
  const ganttBodyRef = useRef<HTMLDivElement>(null)
  const isScrollingSyncRef = useRef(false) // Prevent infinite scroll loop

  // Synchronized scroll handler for Gantt header and body
  const handleGanttHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSyncRef.current) return
    isScrollingSyncRef.current = true
    const scrollLeft = e.currentTarget.scrollLeft
    if (ganttBodyRef.current) {
      ganttBodyRef.current.scrollLeft = scrollLeft
    }
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false
    })
  }, [])

  const handleGanttBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSyncRef.current) return
    isScrollingSyncRef.current = true
    const scrollLeft = e.currentTarget.scrollLeft
    if (ganttHeaderRef.current) {
      ganttHeaderRef.current.scrollLeft = scrollLeft
    }
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false
    })
  }, [])

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 200) // 200ms debounce
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchQuery])

  // Get all projects to query (from allProjects or fallback to projectName)
  const projectsToQuery = allProjects.length > 0 ? allProjects : [projectName]

  // Fetch project statuses and available users
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        
        const response = await fetch(`/api/projects/${projectName}`, { headers })
        if (response.ok) {
          const data = await response.json()
          const statuses = data.statuses || []
          setStatusOptions(statuses.map((s: any) => ({ 
            name: s.name, 
            color: s.color || '#888', 
            state: s.state || 'in_progress' 
          })))
        }
      } catch (e) {
        console.warn('Could not fetch project statuses:', e)
      }
    }
    
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        
        const response = await fetch('/api/users', { headers })
        if (response.ok) {
          const data = await response.json()
          setAvailableUsers(data.map((u: any) => ({ 
            name: u.name, 
            fullName: u.attrib?.fullName || u.name 
          })))
        }
      } catch (e) {
        console.warn('Could not fetch users:', e)
      }
    }
    
    if (projectName) {
      fetchStatuses()
      fetchUsers()
    }
  }, [projectName])

  const buildQueryFromChain = (forProject: string): string => {
    const chain: Node[] = []
    const findChain = (targetId: string): void => {
      const incomingEdge = edges.find(e => e.target === targetId)
      if (incomingEdge) {
        const sourceNode = nodes.find(n => n.id === incomingEdge.source)
        if (sourceNode) {
          chain.unshift(sourceNode)
          findChain(sourceNode.id)
        }
      }
    }
    
    findChain(resultsNodeId)
    
    if (chain.length === 0) return ''

    // Find columns node for selected columns
    const columnsNode = nodes.find(n => n.type === 'columns')
    const _selectedCols = columnsNode?.config?.selectedColumns || initialSelectedColumns || []

    // Get filter configurations from chain nodes
    const departmentsNode = chain.find(n => n.type === 'departments')
    const artistsNode = chain.find(n => n.type === 'artists')
    const selectedDepartments = departmentsNode?.config?.selectedDepartments || []
    const selectedArtists = artistsNode?.config?.selectedArtists || []

    // Common attrib fields fragment
    const attribFields = `
              attrib {
                fps
                resolutionWidth
                resolutionHeight
                pixelAspect
                clipIn
                clipOut
                frameStart
                frameEnd
                handleStart
                handleEnd
                startDate
                endDate
                description
                priority
              }`

    let query = 'query FlowResults {\n'
    query += `  project(name: "${forProject}") {\n`
    query += `    name\n`
    query += `    code\n`
    
    const foldersNode = chain.find(n => n.type === 'folders')
    const tasksNode = chain.find(n => n.type === 'tasks')
    
    // Handle tasks at project level (without folders)
    if (tasksNode && !foldersNode) {
      // Build tasks query with filters
      const taskFilters: string[] = []
      if (selectedDepartments.length > 0) {
        taskFilters.push(`taskTypes: [${selectedDepartments.map((d: string) => `"${d}"`).join(', ')}]`)
      }
      if (selectedArtists.length > 0) {
        taskFilters.push(`assigneesAny: [${selectedArtists.map((a: string) => `"${a}"`).join(', ')}]`)
      }
      const selectedTasks = tasksNode.config?.selectedTasks || []
      if (selectedTasks.length > 0) {
        taskFilters.push(`ids: [${selectedTasks.map((id: string) => `"${id}"`).join(', ')}]`)
      }
      
      const filterStr = taskFilters.length > 0 ? `${taskFilters.join(', ')}, ` : ''
      query += `    tasks(${filterStr}first: 2000) {\n`
      query += `      edges {\n`
      query += `        node {\n`
      query += `          id\n`
      query += `          name\n`
      query += `          label\n`
      query += `          taskType\n`
      query += `          status\n`
      query += `          assignees\n`
      query += `          folderId\n`
      query += `          tags\n`
      query += `          active\n`
      query += `          createdAt\n`
      query += `          updatedAt\n`
      query += `          createdBy\n`
      query += `          updatedBy\n`
      query += attribFields
      query += `\n        }\n`
      query += `      }\n`
      query += `    }\n`
    }
    
    if (foldersNode) {
      const selectedFolders = foldersNode.config?.selectedFolders || []
      
      if (selectedFolders.length > 0) {
        query += `    folders(ids: [${selectedFolders.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
      } else {
        query += `    folders(first: 2000) {\n`
      }
      
      query += `      edges {\n`
      query += `        node {\n`
      query += `          id\n`
      query += `          name\n`
      query += `          label\n`
      query += `          folderType\n`
      query += `          path\n`
      query += `          status\n`
      query += `          tags\n`
      query += `          active\n`
      query += `          createdAt\n`
      query += `          updatedAt\n`
      query += `          createdBy\n`
      query += `          updatedBy\n`
      query += `          thumbnailId\n`
      query += attribFields
      
      // Add tasks if in chain (nested under folders)
      if (tasksNode) {
        // Build task filters
        const taskFilters: string[] = []
        if (selectedDepartments.length > 0) {
          taskFilters.push(`taskTypes: [${selectedDepartments.map((d: string) => `"${d}"`).join(', ')}]`)
        }
        if (selectedArtists.length > 0) {
          taskFilters.push(`assigneesAny: [${selectedArtists.map((a: string) => `"${a}"`).join(', ')}]`)
        }
        const selectedTasks = tasksNode.config?.selectedTasks || []
        if (selectedTasks.length > 0) {
          taskFilters.push(`ids: [${selectedTasks.map((id: string) => `"${id}"`).join(', ')}]`)
        }
        
        const filterStr = taskFilters.length > 0 ? `${taskFilters.join(', ')}, ` : ''
        query += `\n          tasks(${filterStr}first: 2000) {\n`
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                label\n`
        query += `                taskType\n`
        query += `                status\n`
        query += `                assignees\n`
        query += `                tags\n`
        query += `                active\n`
        query += `                createdAt\n`
        query += `                updatedAt\n`
        query += `                createdBy\n`
        query += `                updatedBy\n`
        query += `                attrib {\n`
        query += `                  fps\n`
        query += `                  resolutionWidth\n`
        query += `                  resolutionHeight\n`
        query += `                  pixelAspect\n`
        query += `                  clipIn\n`
        query += `                  clipOut\n`
        query += `                  frameStart\n`
        query += `                  frameEnd\n`
        query += `                  startDate\n`
        query += `                  endDate\n`
        query += `                  description\n`
        query += `                  priority\n`
        query += `                }\n`
        query += `              }\n`
        query += `            }\n`
        query += `          }\n`
      }
      
      const productsNode = chain.find(n => n.type === 'products')
      if (productsNode) {
        const selectedProducts = productsNode.config?.selectedProducts || []
        
        if (selectedProducts.length > 0) {
          query += `          products(ids: [${selectedProducts.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
        } else {
          query += `          products(first: 2000) {\n`
        }
        
        query += `            edges {\n`
        query += `              node {\n`
        query += `                id\n`
        query += `                name\n`
        query += `                productType\n`
        query += `                status\n`
        query += `                tags\n`
        query += `                active\n`
        query += `                createdAt\n`
        query += `                updatedAt\n`
        
        const versionsNode = chain.find(n => n.type === 'versions')
        if (versionsNode) {
          const selectedVersions = versionsNode.config?.selectedVersions || []
          
          if (selectedVersions.length > 0) {
            query += `                versions(ids: [${selectedVersions.map((id: string) => `"${id}"`).join(', ')}], first: 2000) {\n`
          } else {
            query += `                versions(first: 2000) {\n`
          }
          
          query += `                  edges {\n`
          query += `                    node {\n`
          query += `                      id\n`
          query += `                      version\n`
          query += `                      author\n`
          query += `                      status\n`
          query += `                      tags\n`
          query += `                      active\n`
          query += `                      createdAt\n`
          query += `                      updatedAt\n`
          query += `                    }\n`
          query += `                  }\n`
          query += `                }\n`
        }
        
        query += `              }\n`
        query += `            }\n`
        query += `          }\n`
      }
      
      query += `        }\n`
      query += `      }\n`
      query += `    }\n`
    }
    
    query += `  }\n`
    query += `}`
    
    return query
  }

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    
    try {
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      // Query all selected projects
      const allFlattenedResults: any[] = []
      
      for (const proj of projectsToQuery) {
        const query = buildQueryFromChain(proj)
        
        if (!query) {
          continue // Skip if no valid query for this project
        }
        
        const response = await fetch('/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query })
        })
        
        if (!response.ok) {
          console.warn(`HTTP error for project ${proj}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.errors) {
          console.warn(`GraphQL error for project ${proj}:`, data.errors[0]?.message)
          continue
        }
        
        const flattenedResults = flattenResults(data.data, proj)
        allFlattenedResults.push(...flattenedResults)
      }
      
      if (allFlattenedResults.length === 0) {
        throw new Error('No results found. Connect Project → Tasks or Project → Folders → Results')
      }
      
      setResults(allFlattenedResults)
      
      // Build hierarchical results based on the node chain
      const hierarchical = buildHierarchicalResults(allFlattenedResults)
      setHierarchicalResults(hierarchical)
      
      // Expand ALL nodes by default for easier viewing
      if (hierarchical.length > 0) {
        const initialExpanded = new Set<string>()
        const expandAll = (nodes: HierarchicalNode[], parentPath: string = '') => {
          nodes.forEach(node => {
            const path = parentPath ? `${parentPath}/${node.name}` : node.name
            initialExpanded.add(path)
            if (node.children && node.children.length > 0) {
              expandAll(node.children, path)
            }
          })
        }
        expandAll(hierarchical)
        setExpandedNodes(initialExpanded)
      }
      
      if (allFlattenedResults.length > 0) {
        // Get all columns, but hide internal ones (starting with _) by default
        const allCols = Object.keys(allFlattenedResults[0])
        const visibleCols = allCols.filter(col => !col.startsWith('_'))
        const internalCols = allCols.filter(col => col.startsWith('_'))
        
        setColumns(allCols)
        setColumnOrder(visibleCols)
        setHiddenColumns(new Set(internalCols))
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to execute query')
    } finally {
      setLoading(false)
    }
  }

  const flattenResults = (data: any, forProject: string): any[] => {
    const rows: any[] = []
    
    const extractNodes = (edgesContainer: any): any[] => {
      if (!edgesContainer?.edges) return []
      return edgesContainer.edges.map((e: any) => e.node)
    }
    
    // Helper to flatten attrib fields
    const flattenAttrib = (attrib: any, prefix: string = '') => {
      if (!attrib) return {}
      const result: any = {}
      Object.entries(attrib).forEach(([key, value]) => {
        if (key !== '__typename') {
          // Include all values, even null/undefined as empty string
          result[prefix + key] = value ?? ''
        }
      })
      return result
    }
    
    // Use the project passed to this function
    const currentProjectName = forProject || projectName || 'Unknown'
    
    const flatten = (obj: any, _prefix: string = '') => {
      if (Array.isArray(obj)) {
        obj.forEach(item => flatten(item, _prefix))
      } else if (obj && typeof obj === 'object') {
        // Skip the project wrapper, go directly to its contents
        if (obj.project) {
          const projectData = obj.project
          // Process tasks at project level
          if (projectData.tasks?.edges) {
            const tasks = extractNodes(projectData.tasks)
            tasks.forEach((task: any) => {
              rows.push({
                _entityType: 'task',
                _entityId: task.id,
                _projectName: currentProjectName,
                projectName: currentProjectName,
                id: task.id,
                name: task.name || '',
                label: task.label || '',
                taskType: task.taskType || '',
                status: task.status || '',
                assignees: task.assignees?.join(', ') || '',
                folderId: task.folderId || '',
                tags: task.tags?.join(', ') || '',
                active: task.active,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                createdBy: task.createdBy || '',
                updatedBy: task.updatedBy || '',
                // Key task fields explicitly for consistency
                startDate: task.attrib?.startDate || '',
                endDate: task.attrib?.endDate || '',
                description: task.attrib?.description || '',
                priority: task.attrib?.priority || '',
                ...flattenAttrib(task.attrib),
              })
            })
          }
          // Process folders
          if (projectData.folders?.edges) {
            const folders = extractNodes(projectData.folders)
            folders.forEach((folder: any) => {
              const folderAttrib = flattenAttrib(folder.attrib, 'folder_')
              
              if (folder.tasks?.edges) {
                // Folder has tasks - create task rows
                const tasks = extractNodes(folder.tasks)
                tasks.forEach((task: any) => {
                  // Get task attribs and also expose key fields without prefix for easier access
                  const taskAttrib = flattenAttrib(task.attrib, 'task_')
                  rows.push({
                    _entityType: 'task',
                    _entityId: task.id,
                    _folderId: folder.id,
                    _projectName: currentProjectName,
                    projectName: currentProjectName,
                    folderId: folder.id,
                    folderName: folder.name,
                    folderPath: folder.path,
                    folderType: folder.folderType,
                    folderStatus: folder.status,
                    id: task.id,
                    name: task.name || '',
                    label: task.label || '',
                    taskType: task.taskType || '',
                    status: task.status || '',
                    assignees: task.assignees?.join(', ') || '',
                    tags: task.tags?.join(', ') || '',
                    active: task.active,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    createdBy: task.createdBy || '',
                    updatedBy: task.updatedBy || '',
                    // Key task fields without prefix for easier access
                    startDate: task.attrib?.startDate || '',
                    endDate: task.attrib?.endDate || '',
                    description: task.attrib?.description || '',
                    priority: task.attrib?.priority || '',
                    ...taskAttrib,
                    ...folderAttrib,
                  })
                })
              } else if (folder.products?.edges) {
                // Folder has products
                const products = extractNodes(folder.products)
                products.forEach((product: any) => {
                  if (product.versions?.edges) {
                    const versions = extractNodes(product.versions)
                    versions.forEach((version: any) => {
                      rows.push({
                        _entityType: 'version',
                        _entityId: version.id,
                        _folderId: folder.id,
                        _productId: product.id,
                        _projectName: currentProjectName,
                        projectName: currentProjectName,
                        folderId: folder.id,
                        folderName: folder.name,
                        folderPath: folder.path,
                        folderType: folder.folderType,
                        folderStatus: folder.status,
                        productId: product.id,
                        productName: product.name,
                        productType: product.productType,
                        productStatus: product.status || '',
                        id: version.id,
                        name: `v${version.version}`,
                        version: version.version,
                        versionAuthor: version.author,
                        status: version.status,
                        tags: version.tags?.join(', ') || '',
                        active: version.active,
                        createdAt: version.createdAt,
                        updatedAt: version.updatedAt,
                        ...folderAttrib,
                      })
                    })
                  } else {
                    rows.push({
                      _entityType: 'product',
                      _entityId: product.id,
                      _folderId: folder.id,
                      _projectName: currentProjectName,
                      projectName: currentProjectName,
                      folderId: folder.id,
                      folderName: folder.name,
                      folderPath: folder.path,
                      folderType: folder.folderType,
                      folderStatus: folder.status,
                      id: product.id,
                      name: product.name,
                      productType: product.productType,
                      status: product.status || '',
                      tags: product.tags?.join(', ') || '',
                      active: product.active,
                      createdAt: product.createdAt,
                      updatedAt: product.updatedAt,
                      ...folderAttrib,
                    })
                  }
                })
              } else {
                // Just folders, no nested entities
                rows.push({
                  _entityType: 'folder',
                  _entityId: folder.id,
                  _projectName: currentProjectName,
                  projectName: currentProjectName,
                  id: folder.id,
                  name: folder.name,
                  label: folder.label || '',
                  folderType: folder.folderType,
                  path: folder.path,
                  status: folder.status,
                  tags: folder.tags?.join(', ') || '',
                  active: folder.active,
                  createdAt: folder.createdAt,
                  updatedAt: folder.updatedAt,
                  createdBy: folder.createdBy || '',
                  updatedBy: folder.updatedBy || '',
                  thumbnailId: folder.thumbnailId || '',
                  ...flattenAttrib(folder.attrib),
                })
              }
            })
          }
          return
        }
      }
    }
    
    flatten(data)
    return rows
  }

  // Build hierarchical results - DYNAMIC based on nodes in the flow
  const buildHierarchicalResults = (flatResults: any[]): HierarchicalNode[] => {
    if (flatResults.length === 0) return []
    
    // Find what nodes are in the chain to determine hierarchy levels
    const chain: Node[] = []
    const findChain = (targetId: string): void => {
      const incomingEdge = edges.find(e => e.target === targetId)
      if (incomingEdge) {
        const sourceNode = nodes.find(n => n.id === incomingEdge.source)
        if (sourceNode) {
          chain.unshift(sourceNode)
          findChain(sourceNode.id)
        }
      }
    }
    findChain(resultsNodeId)
    
    // Check which nodes are in the flow
    const hasDepartmentsNode = chain.some(n => n.type === 'departments')
    const hasArtistsNode = chain.some(n => n.type === 'artists')
    
    // Group by project first (always)
    const projectGroups = new Map<string, any[]>()
    flatResults.forEach(item => {
      const projectKey = item.projectName || item._projectName || projectName || 'Unknown'
      if (!projectGroups.has(projectKey)) {
        projectGroups.set(projectKey, [])
      }
      projectGroups.get(projectKey)!.push(item)
    })
    
    const projectNodes: HierarchicalNode[] = []
    
    projectGroups.forEach((projectItems, projectKey) => {
      // If no departments or artists node, show data directly under project
      if (!hasDepartmentsNode && !hasArtistsNode) {
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: projectItems,
          children: [],
          expanded: true,
        })
        return
      }
      
      // If only artists node (no departments), group by artist under project
      if (!hasDepartmentsNode && hasArtistsNode) {
        const artistGroups = new Map<string, any[]>()
        projectItems.forEach(item => {
          const artistKey = item.assignees || 'Unassigned'
          if (!artistGroups.has(artistKey)) {
            artistGroups.set(artistKey, [])
          }
          artistGroups.get(artistKey)!.push(item)
        })
        
        const artistNodes: HierarchicalNode[] = []
        artistGroups.forEach((artistItems, artistKey) => {
          artistNodes.push({
            type: 'artist',
            name: artistKey,
            data: artistItems,
            children: [],
            expanded: true,
          })
        })
        
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: null,
          children: artistNodes,
          expanded: true,
        })
        return
      }
      
      // If only departments node (no artists), group by department under project
      if (hasDepartmentsNode && !hasArtistsNode) {
        const deptGroups = new Map<string, any[]>()
        projectItems.forEach(item => {
          const deptKey = item.taskType || item.folderType || 'General'
          if (!deptGroups.has(deptKey)) {
            deptGroups.set(deptKey, [])
          }
          deptGroups.get(deptKey)!.push(item)
        })
        
        const deptNodes: HierarchicalNode[] = []
        deptGroups.forEach((deptItems, deptKey) => {
          deptNodes.push({
            type: 'department',
            name: deptKey,
            data: deptItems,
            children: [],
            expanded: true,
          })
        })
        
        projectNodes.push({
          type: 'project',
          name: projectKey,
          data: null,
          children: deptNodes,
          expanded: true,
        })
        return
      }
      
      // Both departments and artists nodes: Project → Department → Artist
      const deptGroups = new Map<string, any[]>()
      projectItems.forEach(item => {
        const deptKey = item.taskType || item.folderType || 'General'
        if (!deptGroups.has(deptKey)) {
          deptGroups.set(deptKey, [])
        }
        deptGroups.get(deptKey)!.push(item)
      })
      
      const deptNodes: HierarchicalNode[] = []
      
      deptGroups.forEach((deptItems, deptKey) => {
        // Group by artist (assignees)
        const artistGroups = new Map<string, any[]>()
        deptItems.forEach(item => {
          const artistKey = item.assignees || 'Unassigned'
          if (!artistGroups.has(artistKey)) {
            artistGroups.set(artistKey, [])
          }
          artistGroups.get(artistKey)!.push(item)
        })
        
        const artistNodes: HierarchicalNode[] = []
        
        artistGroups.forEach((artistItems, artistKey) => {
          artistNodes.push({
            type: 'artist',
            name: artistKey,
            data: artistItems,
            children: [],
            expanded: true,
          })
        })
        
        deptNodes.push({
          type: 'department',
          name: deptKey,
          data: null,
          children: artistNodes,
          expanded: true,
        })
      })
      
      projectNodes.push({
        type: 'project',
        name: projectKey,
        data: null,
        children: deptNodes,
        expanded: true,
      })
    })
    
    return projectNodes
  }

  // Toggle node expansion
  const toggleNodeExpansion = (nodePath: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodePath)) {
        newSet.delete(nodePath)
      } else {
        newSet.add(nodePath)
      }
      return newSet
    })
  }

  useEffect(() => {
    executeQuery()
  }, [])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Performance: Use debounced search for filtering
  const sortedAndFilteredResults = useMemo(() => {
    let filtered = results
    
    // Apply search filter using debounced query for better performance
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = results.filter(row => {
        // Search across all visible columns
        return Object.entries(row).some(([key, value]) => {
          if (key.startsWith('_')) return false // Skip internal fields
          return String(value ?? '').toLowerCase().includes(query)
        })
      })
    }
    
    // Apply sorting
    if (!sortColumn) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true })
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [results, sortColumn, sortDirection, debouncedSearchQuery])

  // Pagination calculations
  const totalPages = useMemo(() => 
    pageSize === -1 ? 1 : Math.ceil(sortedAndFilteredResults.length / pageSize),
    [sortedAndFilteredResults.length, pageSize]
  )

  // Reset to page 1 when search/sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, sortColumn, sortDirection])

  // Paginated results
  const sortedResults = useMemo(() => {
    if (pageSize === -1) return sortedAndFilteredResults // Show all
    const startIndex = (currentPage - 1) * pageSize
    return sortedAndFilteredResults.slice(startIndex, startIndex + pageSize)
  }, [sortedAndFilteredResults, currentPage, pageSize])

  // Performance: Memoize visible columns
  const orderedColumns = useMemo(() => 
    columnOrder.length > 0 ? columnOrder : columns, 
    [columnOrder, columns]
  )
  
  const visibleColumns = useMemo(() => 
    orderedColumns.filter(col => !hiddenColumns.has(col)),
    [orderedColumns, hiddenColumns]
  )

  // Performance: Handle table scroll for virtualization
  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const viewportHeight = container.clientHeight
    
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS)
    const endRow = Math.min(
      sortedResults.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_ROWS
    )
    
    setVisibleRowRange({ start: startRow, end: endRow })
  }, [sortedResults.length])

  // Performance: Calculate virtualized rows
  const virtualizedRows = useMemo(() => {
    // Only virtualize for large datasets
    if (sortedResults.length <= 100) {
      return { rows: sortedResults, startIndex: 0, paddingTop: 0, paddingBottom: 0 }
    }
    
    const { start, end } = visibleRowRange
    const paddingTop = start * ROW_HEIGHT
    const paddingBottom = Math.max(0, (sortedResults.length - end) * ROW_HEIGHT)
    
    return {
      rows: sortedResults.slice(start, end),
      startIndex: start,
      paddingTop,
      paddingBottom
    }
  }, [sortedResults, visibleRowRange])

  const handleColumnDragStart = (column: string) => {
    setDraggedColumn(column)
  }

  const handleColumnDragOver = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumn) return
    
    const newOrder = [...columnOrder]
    const draggedIdx = newOrder.indexOf(draggedColumn)
    const targetIdx = newOrder.indexOf(targetColumn)
    newOrder.splice(draggedIdx, 1)
    newOrder.splice(targetIdx, 0, draggedColumn)
    setColumnOrder(newOrder)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
  }

  // Editable columns mapping - which columns can be edited and their entity field
  const editableColumns: Record<string, { entityType: string, field: string, isAttrib?: boolean, isArray?: boolean, isDate?: boolean }> = {
    status: { entityType: 'folder', field: 'status' },
    folderStatus: { entityType: 'folder', field: 'status' },
    taskStatus: { entityType: 'task', field: 'status' },
    name: { entityType: 'folder', field: 'name' },
    folderName: { entityType: 'folder', field: 'name' },
    taskName: { entityType: 'task', field: 'name' },
    label: { entityType: 'folder', field: 'label' },
    folderLabel: { entityType: 'folder', field: 'label' },
    taskLabel: { entityType: 'task', field: 'label' },
    assignees: { entityType: 'task', field: 'assignees', isArray: true },
    priority: { entityType: 'folder', field: 'priority', isAttrib: true },
    fps: { entityType: 'folder', field: 'fps', isAttrib: true },
    resolutionWidth: { entityType: 'folder', field: 'resolutionWidth', isAttrib: true },
    resolutionHeight: { entityType: 'folder', field: 'resolutionHeight', isAttrib: true },
    frameStart: { entityType: 'folder', field: 'frameStart', isAttrib: true },
    frameEnd: { entityType: 'folder', field: 'frameEnd', isAttrib: true },
    clipIn: { entityType: 'folder', field: 'clipIn', isAttrib: true },
    clipOut: { entityType: 'folder', field: 'clipOut', isAttrib: true },
    description: { entityType: 'folder', field: 'description', isAttrib: true },
    folder_priority: { entityType: 'folder', field: 'priority', isAttrib: true },
    folder_fps: { entityType: 'folder', field: 'fps', isAttrib: true },
    task_priority: { entityType: 'task', field: 'priority', isAttrib: true },
    task_fps: { entityType: 'task', field: 'fps', isAttrib: true },
    // Date fields for scheduling
    startDate: { entityType: 'task', field: 'startDate', isAttrib: true, isDate: true },
    endDate: { entityType: 'task', field: 'endDate', isAttrib: true, isDate: true },
    taskStartDate: { entityType: 'task', field: 'startDate', isAttrib: true, isDate: true },
    taskEndDate: { entityType: 'task', field: 'endDate', isAttrib: true, isDate: true },
    task_startDate: { entityType: 'task', field: 'startDate', isAttrib: true, isDate: true },
    task_endDate: { entityType: 'task', field: 'endDate', isAttrib: true, isDate: true },
    task_description: { entityType: 'task', field: 'description', isAttrib: true },
    task_priority: { entityType: 'task', field: 'priority', isAttrib: true },
    folder_description: { entityType: 'folder', field: 'description', isAttrib: true },
  }

  const isColumnEditable = (column: string): boolean => {
    // Don't allow editing internal fields or IDs
    if (column.startsWith('_') || column.endsWith('Id') || column === 'id') return false
    if (column.includes('createdAt') || column.includes('updatedAt')) return false
    if (column.includes('createdBy') || column.includes('updatedBy')) return false
    // Allow assignees editing
    if (column === 'assignees') return true
    // Allow date fields
    if (column === 'startDate' || column === 'endDate' || column === 'task_startDate' || column === 'task_endDate') return true
    // Allow description fields
    if (column === 'description' || column === 'task_description' || column === 'folder_description') return true
    return column in editableColumns || column.includes('status') || column.includes('Name') || column.includes('priority')
  }

  const isStatusColumn = (column: string): boolean => {
    return column.toLowerCase().includes('status')
  }

  const isAssigneesColumn = (column: string): boolean => {
    return column === 'assignees'
  }

  const isDateColumn = (column: string): boolean => {
    return column === 'startDate' || column === 'endDate' || 
           column === 'taskStartDate' || column === 'taskEndDate' ||
           column === 'task_startDate' || column === 'task_endDate' ||
           column.toLowerCase().includes('deadline')
  }

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Format date for input[type=date]
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Single click to start editing (CSV-like behavior)
  const handleCellClick = (rowIdx: number, column: string, currentValue: any) => {
    if (!isColumnEditable(column)) return
    setEditingCell({ rowIdx, column })
    // For date columns, format for date input
    if (isDateColumn(column)) {
      setEditValue(formatDateForInput(String(currentValue ?? '')))
    } else {
      setEditValue(String(currentValue ?? ''))
    }
  }

  const handleCellEditSave = async (directValue?: string) => {
    if (!editingCell) return
    
    const row = sortedResults[editingCell.rowIdx]
    const column = editingCell.column
    
    // Use direct value if provided (for select onChange), otherwise use state
    const valueToUse = directValue !== undefined ? directValue : editValue
    
    // Determine entity type and ID
    let entityType = row._entityType || 'folder'
    let entityId = row._entityId || row.id
    
    // Special handling for prefixed columns and assignees
    if (column === 'assignees' || column.startsWith('task')) {
      entityType = 'task'
      entityId = row.taskId || row._entityId || row.id
    } else if (column.startsWith('folder')) {
      entityType = 'folder'
      entityId = row.folderId || row._folderId || row._entityId
    } else if (column.startsWith('product')) {
      entityType = 'product'
      entityId = row.productId || row._productId
    } else if (column.startsWith('version')) {
      entityType = 'version'
      entityId = row.versionId
    }
    
    // Get the correct project for this row
    const rowProject = row._projectName || row.projectName || projectName
    
    if (!entityId) {
      alert('Cannot determine entity ID for update')
      setEditingCell(null)
      return
    }
    
    setSaving(true)
    try {
      // Determine the actual field name
      let fieldName = column
      let isAttrib = false
      let isArray = false
      
      if (editableColumns[column]) {
        fieldName = editableColumns[column].field
        isAttrib = editableColumns[column].isAttrib || false
        isArray = editableColumns[column].isArray || false
      } else if (column.includes('Status')) {
        fieldName = 'status'
      } else if (column.includes('Name') && !column.includes('folder')) {
        fieldName = 'name'
      }
      
      // Build the PATCH request body
      let body: any = {}
      let valueToSave: any = valueToUse
      
      // Handle array fields like assignees
      if (isArray) {
        // Split by comma and trim whitespace
        valueToSave = valueToUse.split(',').map(v => v.trim()).filter(v => v.length > 0)
      }
      
      // Handle date fields - convert YYYY-MM-DD to ISO datetime
      if (isDateColumn(column) && valueToUse) {
        // Convert date string to ISO datetime (set to noon UTC to avoid timezone issues)
        const date = new Date(valueToUse + 'T12:00:00Z')
        valueToSave = date.toISOString()
      }
      
      if (isAttrib) {
        body = { attrib: { [fieldName]: valueToSave } }
      } else {
        body = { [fieldName]: valueToSave }
      }
      
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      // Use the REST API to update the entity with correct project
      const endpoint = `/api/projects/${rowProject}/${entityType}s/${entityId}`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to update: ${response.status}`)
      }
      
      // Record edit in history for undo/redo
      const oldValue = row[column]
      const historyEntry: EditHistoryEntry = {
        timestamp: new Date(),
        entityType,
        entityId,
        projectName: rowProject,
        field: column,
        oldValue,
        newValue: valueToUse,
        rowIdx: editingCell.rowIdx
      }
      
      // If we're not at the end of history, truncate the redo stack
      const newHistory = historyIndex >= 0 
        ? [...editHistory.slice(0, historyIndex + 1), historyEntry]
        : [...editHistory, historyEntry]
      setEditHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      
      // Update local state
      const updatedResults = [...results]
      const originalIdx = results.findIndex(r => 
        (r._entityId === entityId) || (r.id === entityId) || 
        (r.taskId === entityId) || (r.folderId === entityId)
      )
      if (originalIdx >= 0) {
        updatedResults[originalIdx] = { ...updatedResults[originalIdx], [column]: valueToUse }
        setResults(updatedResults)
      }
      
      setEditingCell(null)
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCellEditCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellEditSave()
    } else if (e.key === 'Escape') {
      handleCellEditCancel()
    }
  }

  // Undo/Redo functions
  const canUndo = editHistory.length > 0 && historyIndex >= 0
  const canRedo = editHistory.length > 0 && historyIndex < editHistory.length - 1

  const applyHistoryEdit = async (entry: EditHistoryEntry, value: any) => {
    const accessToken = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    
    // Determine field details
    let fieldName = entry.field
    let isAttrib = false
    let isArray = false
    
    if (editableColumns[entry.field]) {
      fieldName = editableColumns[entry.field].field
      isAttrib = editableColumns[entry.field].isAttrib || false
      isArray = editableColumns[entry.field].isArray || false
    }
    
    // Build body
    let body: any = {}
    let valueToSave = value
    
    if (isArray && typeof value === 'string') {
      valueToSave = value.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
    }
    
    if (isAttrib) {
      body = { attrib: { [fieldName]: valueToSave } }
    } else {
      body = { [fieldName]: valueToSave }
    }
    
    const endpoint = `/api/projects/${entry.projectName}/${entry.entityType}s/${entry.entityId}`
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    })
    
    return response.ok
  }

  const handleUndo = async () => {
    if (!canUndo || undoing) return
    
    setUndoing(true)
    const entry = editHistory[historyIndex]
    
    try {
      const success = await applyHistoryEdit(entry, entry.oldValue)
      if (success) {
        // Update local state
        const updatedResults = [...results]
        const originalIdx = results.findIndex(r => 
          (r._entityId === entry.entityId) || (r.id === entry.entityId) || 
          (r.taskId === entry.entityId) || (r.folderId === entry.entityId)
        )
        if (originalIdx >= 0) {
          updatedResults[originalIdx] = { ...updatedResults[originalIdx], [entry.field]: entry.oldValue }
          setResults(updatedResults)
        }
        setHistoryIndex(historyIndex - 1)
      } else {
        alert('Failed to undo')
      }
    } catch (err: any) {
      alert(`Undo failed: ${err.message}`)
    } finally {
      setUndoing(false)
    }
  }

  const handleRedo = async () => {
    if (!canRedo || undoing) return
    
    setUndoing(true)
    const entry = editHistory[historyIndex + 1]
    
    try {
      const success = await applyHistoryEdit(entry, entry.newValue)
      if (success) {
        // Update local state
        const updatedResults = [...results]
        const originalIdx = results.findIndex(r => 
          (r._entityId === entry.entityId) || (r.id === entry.entityId) || 
          (r.taskId === entry.entityId) || (r.folderId === entry.entityId)
        )
        if (originalIdx >= 0) {
          updatedResults[originalIdx] = { ...updatedResults[originalIdx], [entry.field]: entry.newValue }
          setResults(updatedResults)
        }
        setHistoryIndex(historyIndex + 1)
      } else {
        alert('Failed to redo')
      }
    } catch (err: any) {
      alert(`Redo failed: ${err.message}`)
    } finally {
      setUndoing(false)
    }
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          handleRedo()
        } else {
          e.preventDefault()
          handleUndo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [canUndo, canRedo, historyIndex, editHistory, undoing])

  // Bulk editing handlers
  const handleRowSelect = (rowIdx: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowIdx)
    } else {
      newSelected.delete(rowIdx)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedResults.map((_, idx) => idx)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
    setBulkEditField('')
    setBulkEditValue('')
  }

  const getBulkEditableFields = (): {id: string, label: string, type?: string}[] => {
    return [
      { id: 'status', label: 'Status' },
      { id: 'assignees', label: 'Assignees' },
      { id: 'taskType', label: 'Task Type' },
      { id: 'priority', label: 'Priority' },
      { id: 'startDate', label: 'Start Date', type: 'date' },
      { id: 'endDate', label: 'End Date', type: 'date' },
    ]
  }

  const handleBulkEdit = async () => {
    if (!bulkEditField || selectedRows.size === 0) return
    
    setBulkSaving(true)
    const accessToken = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    
    let successCount = 0
    let failCount = 0
    const updatedResults = [...results]
    
    // Get selected rows data
    const selectedData = Array.from(selectedRows).map(idx => sortedResults[idx])
    
    for (const row of selectedData) {
      try {
        // Determine entity type and ID for tasks
        let entityType = row._entityType || 'task'
        let entityId = row.taskId || row._entityId || row.id
        const rowProject = row._projectName || row.projectName || projectName
        
        if (!entityId) {
          failCount++
          continue
        }
        
        // Build PATCH body based on field
        let body: any = {}
        let valueToSave: any = bulkEditValue
        
        if (bulkEditField === 'assignees') {
          valueToSave = bulkEditValue.split(',').map(v => v.trim()).filter(v => v.length > 0)
          body = { assignees: valueToSave }
        } else if (bulkEditField === 'status') {
          body = { status: valueToSave }
        } else if (bulkEditField === 'taskType') {
          body = { taskType: valueToSave }
        } else if (bulkEditField === 'priority') {
          body = { attrib: { priority: valueToSave } }
        } else if (bulkEditField === 'startDate' || bulkEditField === 'endDate') {
          // Convert date to ISO datetime
          if (valueToSave) {
            const date = new Date(valueToSave + 'T12:00:00Z')
            valueToSave = date.toISOString()
          }
          body = { attrib: { [bulkEditField]: valueToSave } }
        }
        
        const endpoint = `/api/projects/${rowProject}/${entityType}s/${entityId}`
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body)
        })
        
        if (response.ok) {
          successCount++
          // Update local state
          const originalIdx = results.findIndex(r => 
            (r._entityId === entityId) || (r.id === entityId) || 
            (r.taskId === entityId)
          )
          if (originalIdx >= 0) {
            if (bulkEditField === 'assignees') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], assignees: valueToSave }
            } else if (bulkEditField === 'status') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], status: valueToSave, taskStatus: valueToSave }
            } else if (bulkEditField === 'taskType') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], taskType: valueToSave }
            } else if (bulkEditField === 'priority') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], priority: valueToSave }
            } else if (bulkEditField === 'startDate') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], startDate: valueToSave }
            } else if (bulkEditField === 'endDate') {
              updatedResults[originalIdx] = { ...updatedResults[originalIdx], endDate: valueToSave }
            }
          }
        } else {
          failCount++
        }
      } catch (err) {
        console.error('Bulk edit error:', err)
        failCount++
      }
    }
    
    setResults(updatedResults)
    setBulkSaving(false)
    clearSelection()
    
    if (failCount > 0) {
      alert(`Bulk edit completed: ${successCount} succeeded, ${failCount} failed`)
    }
  }

  const exportCSV = () => {
    const orderedCols = columnOrder.length > 0 ? columnOrder : columns
    const exportCols = orderedCols.filter(col => !hiddenColumns.has(col))
    const csvContent = [
      exportCols.join(','),
      ...sortedResults.map(row => 
        exportCols.map(col => {
          const val = row[col]
          const escaped = String(val ?? '').replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `flow_results_${projectName}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // Import CSV and update results
  const importCSV = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      alert('CSV file must have headers and at least one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    
    // Map headers to columns - need to match exported column names
    const headerToColumn: Record<string, string> = {}
    headers.forEach(h => {
      // Direct match
      if (columns.includes(h)) {
        headerToColumn[h] = h
      }
    })

    // Parse data rows
    const importedRows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let inQuotes = false
      let current = ''
      for (const char of lines[i]) {
        if (char === '"' && !inQuotes) {
          inQuotes = true
        } else if (char === '"' && inQuotes) {
          inQuotes = false
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      
      const rowData: any = {}
      headers.forEach((h, idx) => {
        if (headerToColumn[h]) {
          rowData[headerToColumn[h]] = values[idx] || ''
        }
      })
      importedRows.push(rowData)
    }

    // Match imported rows to existing results and update
    const accessToken = localStorage.getItem('accessToken')
    const headersObj: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headersObj['Authorization'] = `Bearer ${accessToken}`

    let updated = 0
    let errors = 0
    
    // Track all updates to apply at once
    const allUpdates: { matchIdx: number, column: string, newValue: any }[] = []
    
    for (const importedRow of importedRows) {
      // Try to find matching row by id
      const matchIdx = results.findIndex(r => 
        r.id === importedRow.id || 
        r._entityId === importedRow.id ||
        (r.name === importedRow.name && r.folderPath === importedRow.folderPath)
      )
      
      if (matchIdx < 0) continue
      
      const existingRow = results[matchIdx]
      const entityType = existingRow._entityType || 'folder'
      const entityId = existingRow._entityId || existingRow.id
      const rowProject = existingRow._projectName || existingRow.projectName || projectName

      // Find changed columns
      const changes: { column: string, oldValue: any, newValue: any }[] = []
      for (const col of Object.keys(importedRow)) {
        if (col.startsWith('_') || col === 'id') continue
        if (importedRow[col] !== String(existingRow[col] ?? '')) {
          changes.push({ column: col, oldValue: existingRow[col], newValue: importedRow[col] })
        }
      }

      // Apply changes
      for (const change of changes) {
        try {
          let fieldName = change.column
          let isAttrib = false
          let isArray = false
          
          if (editableColumns[change.column]) {
            fieldName = editableColumns[change.column].field
            isAttrib = editableColumns[change.column].isAttrib || false
            isArray = editableColumns[change.column].isArray || false
          }

          let valueToSave: any = change.newValue
          if (isArray) {
            valueToSave = change.newValue.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
          }
          
          // Handle date fields - convert to ISO datetime
          if (isDateColumn(change.column) && valueToSave) {
            const date = new Date(valueToSave + 'T12:00:00Z')
            valueToSave = date.toISOString()
          }

          const body = isAttrib 
            ? { attrib: { [fieldName]: valueToSave } }
            : { [fieldName]: valueToSave }

          const endpoint = `/api/projects/${rowProject}/${entityType}s/${entityId}`
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: headersObj,
            body: JSON.stringify(body)
          })

          if (response.ok) {
            updated++
            // Track update for batch state update
            allUpdates.push({ matchIdx, column: change.column, newValue: change.newValue })
          } else {
            errors++
          }
        } catch {
          errors++
        }
      }
    }

    // Apply all updates to state at once
    if (allUpdates.length > 0) {
      const updatedResults = [...results]
      for (const update of allUpdates) {
        updatedResults[update.matchIdx] = { 
          ...updatedResults[update.matchIdx], 
          [update.column]: update.newValue 
        }
      }
      setResults(updatedResults)
    }

    alert(`Import complete: ${updated} fields updated, ${errors} errors`)
  }

  const handleImportCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        importCSV(file)
      }
    }
    input.click()
  }

  const openInNewTab = () => {
    // Create a new window with the results
    const newWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!newWindow) {
      alert('Popup blocked! Please allow popups for this site.')
      return
    }

    const orderedCols = columnOrder.length > 0 ? columnOrder : columns
    const exportCols = orderedCols.filter(col => !hiddenColumns.has(col))
    
    // Build HTML content for the new window
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Flow Results - ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px 24px;
      background: #252542;
      border-radius: 8px;
    }
    .title { font-size: 24px; font-weight: 600; }
    .count {
      padding: 4px 12px;
      background: #3a3a5c;
      border-radius: 16px;
      font-size: 14px;
      margin-left: 16px;
    }
    .btn {
      padding: 8px 16px;
      background: #4a4a7c;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 8px;
    }
    .btn:hover { background: #5a5a9c; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #252542;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #3a3a5c;
    }
    th {
      background: #1a1a2e;
      font-weight: 600;
      cursor: pointer;
      position: sticky;
      top: 0;
    }
    th:hover { background: #2a2a4e; }
    tr:hover td { background: #2a2a4e; }
    .container { overflow: auto; max-height: calc(100vh - 120px); }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="title">Flow Results</span>
      <span class="count">${sortedResults.length} rows</span>
    </div>
    <div>
      <button class="btn" onclick="exportCSV()">Export CSV</button>
      <button class="btn" onclick="window.print()">Print</button>
    </div>
  </div>
  <div class="container">
    <table>
      <thead>
        <tr>
          ${exportCols.map(col => `<th>${col}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${sortedResults.map(row => `
          <tr>
            ${exportCols.map(col => `<td>${row[col] ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <script>
    const data = ${JSON.stringify(sortedResults)};
    const columns = ${JSON.stringify(exportCols)};
    
    function exportCSV() {
      const csvContent = [
        columns.join(','),
        ...data.map(row => 
          columns.map(col => {
            const val = row[col];
            const escaped = String(val ?? '').replace(/"/g, '""');
            return '"' + escaped + '"';
          }).join(',')
        )
      ].join('\\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'flow_results_${projectName}_${new Date().toISOString().slice(0, 10)}.csv';
      link.click();
    }
  </script>
</body>
</html>
    `
    
    newWindow.document.write(htmlContent)
    newWindow.document.close()
  }

  const toggleColumnVisibility = (col: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(col)) {
        newSet.delete(col)
      } else {
        newSet.add(col)
      }
      return newSet
    })
  }

  // Timeline/Gantt helper functions - memoized for performance
  const daysArray = useMemo(() => {
    const days: Date[] = []
    // Normalize to midnight to avoid timezone issues
    const start = new Date(
      timelineStart.getFullYear(),
      timelineStart.getMonth(),
      timelineStart.getDate()
    )
    for (let i = 0; i < timelineDays; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }, [timelineStart, timelineDays])
  
  // Keep getDaysArray for backward compatibility but use memoized version
  const getDaysArray = useCallback(() => daysArray, [daysArray])

  const isWeekend = useCallback((date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }, [])

  const isToday = useCallback((date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }, [])

  // Performance: Memoize day width calculation
  const getDayWidth = useCallback(() => {
    switch (timelineZoom) {
      case 'day': return 40
      case 'week': return 20
      case 'month': return 10
    }
  }, [timelineZoom])
  
  // Memoize the actual day width value
  const dayWidth = useMemo(() => getDayWidth(), [getDayWidth])

  const getBarPosition = useCallback((startDate: string | null, endDate: string | null) => {
    if (!startDate) return null
    
    // Normalize dates to midnight local time to avoid timezone issues
    const normalizeToMidnight = (dateStr: string) => {
      // Parse the date string and create a new date at midnight local time
      const parsed = new Date(dateStr)
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    }
    
    const start = normalizeToMidnight(startDate)
    const end = endDate ? normalizeToMidnight(endDate) : new Date(start)
    
    // Normalize timeline start to midnight as well
    const timelineStartNormalized = new Date(
      timelineStart.getFullYear(),
      timelineStart.getMonth(),
      timelineStart.getDate()
    )
    
    // Calculate difference in days (now both are at midnight, so division is clean)
    const msPerDay = 1000 * 60 * 60 * 24
    const startDiff = Math.round((start.getTime() - timelineStartNormalized.getTime()) / msPerDay)
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1) // +1 to include end date
    
    return {
      left: startDiff * dayWidth,
      width: duration * dayWidth
    }
  }, [dayWidth, timelineStart])

  // Performance: Memoize status color lookup
  const getStatusColor = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.name === status)
    return statusOption?.color || 'var(--md-sys-color-primary)'
  }, [statusOptions])

  // Check if a task is a milestone (no duration - start date equals end date, or marked as milestone)
  const isMilestone = (row: any) => {
    if (!row.startDate) return false
    // A milestone is when start date equals end date, or the task has no end date
    if (!row.endDate) return false
    const start = new Date(row.startDate)
    const end = new Date(row.endDate)
    return start.getTime() === end.getTime()
  }

  // Compute dependencies based on folder hierarchy (tasks in same folder are implicitly related)
  const computeDependencies = () => {
    const dependencies: { sourceIdx: number; targetIdx: number }[] = []
    
    // Group tasks by their parent folder
    const tasksByFolder: Map<string, number[]> = new Map()
    sortedAndFilteredResults.forEach((row, idx) => {
      const folderId = row.folderId || row._parentId
      if (folderId) {
        const existing = tasksByFolder.get(folderId) || []
        existing.push(idx)
        tasksByFolder.set(folderId, existing)
      }
    })
    
    // Create dependencies between consecutive tasks in the same folder (sorted by startDate)
    tasksByFolder.forEach((indices) => {
      // Sort by start date
      const sortedIndices = indices
        .filter(idx => sortedAndFilteredResults[idx].startDate)
        .sort((a, b) => {
          const dateA = new Date(sortedAndFilteredResults[a].startDate).getTime()
          const dateB = new Date(sortedAndFilteredResults[b].startDate).getTime()
          return dateA - dateB
        })
      
      // Link consecutive tasks
      for (let i = 0; i < sortedIndices.length - 1; i++) {
        dependencies.push({
          sourceIdx: sortedIndices[i],
          targetIdx: sortedIndices[i + 1]
        })
      }
    })
    
    return dependencies
  }

  const [showDependencies, setShowDependencies] = useState(false)
  
  // Performance: Memoize dependencies calculation
  const dependencies = useMemo(() => 
    showDependencies ? computeDependencies() : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showDependencies, sortedAndFilteredResults]
  )

  // Performance: Memoize tasks with dates (use full filtered results for timeline)
  const tasksWithDates = useMemo(() => 
    sortedAndFilteredResults.filter(row => row.startDate || row.endDate),
    [sortedAndFilteredResults]
  )

  // Compute workload data per artist
  const computeWorkloadData = () => {
    const workloadByArtist: Map<string, {
      name: string
      fullName: string
      tasks: any[]
      totalHours: number
      completedTasks: number
    }> = new Map()
    
    sortedAndFilteredResults.forEach(row => {
      const assignees = row.assignees || row.taskAssignees || []
      const assigneeList = Array.isArray(assignees) ? assignees : [assignees].filter(Boolean)
      
      assigneeList.forEach((assignee: string) => {
        if (!assignee) return
        
        const existing = workloadByArtist.get(assignee) || {
          name: assignee,
          fullName: availableUsers.find(u => u.name === assignee)?.fullName || assignee,
          tasks: [],
          totalHours: 0,
          completedTasks: 0
        }
        
        existing.tasks.push(row)
        
        // Estimate hours based on date range (8 hours per day)
        if (row.startDate && row.endDate) {
          const start = new Date(row.startDate)
          const end = new Date(row.endDate)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          existing.totalHours += days * 8
        }
        
        // Count completed tasks
        const status = row.status || row.taskStatus
        const statusInfo = statusOptions.find(s => s.name === status)
        if (statusInfo?.state === 'done') {
          existing.completedTasks++
        }
        
        workloadByArtist.set(assignee, existing)
      })
    })
    
    // Also include unassigned tasks
    const unassignedTasks = sortedResults.filter(row => {
      const assignees = row.assignees || row.taskAssignees || []
      return !assignees || (Array.isArray(assignees) && assignees.length === 0)
    })
    
    if (unassignedTasks.length > 0) {
      workloadByArtist.set('_unassigned', {
        name: '_unassigned',
        fullName: 'Unassigned',
        tasks: unassignedTasks,
        totalHours: 0,
        completedTasks: 0
      })
    }
    
    return Array.from(workloadByArtist.values()).sort((a, b) => b.tasks.length - a.tasks.length)
  }

  // Performance: Memoize expensive workload calculation
  const workloadData = useMemo(() => 
    viewMode === 'workload' ? computeWorkloadData() : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewMode, sortedAndFilteredResults, availableUsers]
  )

  // Compute dashboard statistics
  const computeDashboardStats = () => {
    const totalTasks = sortedAndFilteredResults.length
    const statusCounts: Map<string, { count: number; color: string; state: string }> = new Map()
    const typeCounts: Map<string, number> = new Map()
    let completedTasks = 0
    let inProgressTasks = 0
    let overdueTasks = 0
    let dueSoonTasks = 0
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)
    
    sortedAndFilteredResults.forEach(row => {
      // Status breakdown
      const status = row.status || row.taskStatus || 'Unknown'
      const statusInfo = statusOptions.find(s => s.name === status)
      const existing = statusCounts.get(status) || { count: 0, color: statusInfo?.color || '#888', state: statusInfo?.state || '' }
      existing.count++
      statusCounts.set(status, existing)
      
      // Track completion states
      if (statusInfo?.state === 'done') {
        completedTasks++
      } else if (statusInfo?.state === 'in_progress') {
        inProgressTasks++
      }
      
      // Type breakdown
      const type = row.taskType || row.type || 'Other'
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
      
      // Deadline tracking
      const endDate = row.endDate ? new Date(row.endDate) : null
      if (endDate) {
        if (endDate < now && statusInfo?.state !== 'done') {
          overdueTasks++
        } else if (endDate <= threeDaysFromNow && statusInfo?.state !== 'done') {
          dueSoonTasks++
        }
      }
    })
    
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Daily progress (last 7 days mock data - would need real data from API)
    const dailyProgress = [65, 70, 72, 68, 75, 78, completionPercentage]
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueSoonTasks,
      completionPercentage,
      statusBreakdown: Array.from(statusCounts.entries())
        .sort((a, b) => b[1].count - a[1].count),
      typeBreakdown: Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1]),
      dailyProgress
    }
  }

  // Performance: Memoize dashboard statistics calculation
  const dashboardStats = useMemo(() => 
    viewMode === 'dashboard' ? computeDashboardStats() : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewMode, sortedAndFilteredResults, statusOptions]
  )

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    
    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // Add days from next month to complete the last week (6 weeks total for consistent layout)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return sortedResults.filter(row => {
      if (!row.startDate && !row.endDate) return false
      const start = row.startDate ? row.startDate.split('T')[0] : null
      const end = row.endDate ? row.endDate.split('T')[0] : start
      if (!start) return false
      return dateStr >= start && dateStr <= (end || start)
    })
  }

  // Drag-to-schedule handlers
  const handleBarMouseDown = (e: React.MouseEvent, rowIdx: number, currentLeft: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDelta(0)
    setDraggingTask({
      rowIdx,
      startX: e.clientX,
      originalLeft: currentLeft
    })
  }

  // Global mouse move/up for drag-to-schedule
  React.useEffect(() => {
    if (!draggingTask) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggingTask) return
      const delta = e.clientX - draggingTask.startX
      setDragDelta(delta)
    }

    const handleGlobalMouseUp = async (e: MouseEvent) => {
      if (!draggingTask) return
      
      const dayWidth = getDayWidth()
      // Calculate delta directly from mouse position to avoid stale closure issue
      const finalDelta = e.clientX - draggingTask.startX
      const daysDelta = Math.round(finalDelta / dayWidth)
      
      if (daysDelta === 0) {
        setDraggingTask(null)
        setDragDelta(0)
        return
      }
      
      const row = sortedAndFilteredResults[draggingTask.rowIdx]
      if (!row) {
        setDraggingTask(null)
        setDragDelta(0)
        return
      }
      
      // Calculate new dates
      const oldStartDate = row.startDate ? new Date(row.startDate) : null
      const oldEndDate = row.endDate ? new Date(row.endDate) : null
      
      if (!oldStartDate) {
        setDraggingTask(null)
        setDragDelta(0)
        return
      }
      
      const newStartDate = new Date(oldStartDate)
      newStartDate.setDate(newStartDate.getDate() + daysDelta)
      
      let newEndDate = oldEndDate ? new Date(oldEndDate) : null
      if (newEndDate) {
        newEndDate.setDate(newEndDate.getDate() + daysDelta)
      }
      
      // Update via API
      const entityType = row._entityType || 'task'
      const entityId = row._entityId || row.id
      const rowProject = row._projectName || row.projectName || projectName
      
      const accessToken = localStorage.getItem('accessToken')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      try {
        const body: any = {
          attrib: {
            startDate: newStartDate.toISOString()
          }
        }
        if (newEndDate) {
          body.attrib.endDate = newEndDate.toISOString()
        }
        
        const response = await fetch(`/api/projects/${rowProject}/${entityType}s/${entityId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body)
        })
        
        if (response.ok) {
          // Update local state
          const updatedResults = [...results]
          const originalIdx = results.findIndex(r => 
            (r._entityId === entityId) || (r.id === entityId)
          )
          if (originalIdx >= 0) {
            updatedResults[originalIdx] = {
              ...updatedResults[originalIdx],
              startDate: newStartDate.toISOString().split('T')[0],
              endDate: newEndDate ? newEndDate.toISOString().split('T')[0] : updatedResults[originalIdx].endDate
            }
            setResults(updatedResults)
          }
        }
      } catch (err) {
        console.error('Failed to update dates:', err)
      }
      
      setDraggingTask(null)
      setDragDelta(0)
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [draggingTask, sortedAndFilteredResults, results, projectName])

  // Hierarchy node component for rendering tree structure
  const HierarchyNodeComponent = ({ 
    node, 
    path, 
    level,
    expandedNodes,
    toggleNodeExpansion,
    visibleColumns
  }: { 
    node: HierarchicalNode
    path: string
    level: number
    expandedNodes: Set<string>
    toggleNodeExpansion: (path: string) => void
    visibleColumns: string[]
  }) => {
    const isExpanded = expandedNodes.has(path)
    const hasChildren = node.children && node.children.length > 0
    const isLeafWithData = Array.isArray(node.data) && node.data.length > 0
    const itemCount = isLeafWithData 
      ? (node.data as any[]).length 
      : hasChildren 
        ? node.children.length 
        : 0
    
    // Type icons only (no labels)
    const typeIcons: Record<string, string> = {
      project: '📁',
      department: '🏢',
      artist: '👤',
      folder: '📂',
      task: '✓',
      product: '📦',
      version: '🔢',
      results: '📊',
    }
    
    // Type colors
    const typeColors: Record<string, string> = {
      project: '#4CAF50',
      department: '#2196F3',
      artist: '#9C27B0',
      folder: '#FF9800',
      task: '#00BCD4',
      product: '#E91E63',
      version: '#607D8B',
      results: '#795548',
    }

    return (
      <HierarchyNode $level={level}>
        <HierarchyHeader 
          onClick={() => (hasChildren || isLeafWithData) && toggleNodeExpansion(path)}
          style={{ cursor: (hasChildren || isLeafWithData) ? 'pointer' : 'default' }}
        >
          {(hasChildren || isLeafWithData) && (
            <Icon 
              icon={isExpanded ? 'expand_more' : 'chevron_right'} 
              style={{ marginRight: 8, opacity: 0.7 }}
            />
          )}
          <span style={{ marginRight: 6 }}>{typeIcons[node.type] || '•'}</span>
          <HierarchyLabel style={{ color: typeColors[node.type] || '#999', fontWeight: 600 }}>
            {node.name}
          </HierarchyLabel>
          {itemCount > 0 && (
            <HierarchyCount>
              {itemCount}
            </HierarchyCount>
          )}
        </HierarchyHeader>
        
        {isExpanded && isLeafWithData && (
          <HierarchyChildren>
            <TableContainer style={{ margin: '8px 0', marginLeft: 24 }}>
              <table>
                <thead>
                  <tr>
                    {visibleColumns.slice(0, 8).map(col => (
                      <th key={col} style={{ fontSize: 11, padding: '6px 8px' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(node.data as any[]).map((item, itemIdx) => (
                    <tr key={itemIdx}>
                      {visibleColumns.slice(0, 8).map(col => (
                        <td key={col} style={{ fontSize: 12, padding: '4px 8px' }}>
                          {item[col] !== undefined ? String(item[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          </HierarchyChildren>
        )}
        
        {isExpanded && hasChildren && !isLeafWithData && (
          <HierarchyChildren>
            {node.children.map((child, childIdx) => (
              <HierarchyNodeComponent
                key={`${child.type}-${child.name}-${childIdx}`}
                node={child}
                path={`${path}/${child.name}`}
                level={level + 1}
                expandedNodes={expandedNodes}
                toggleNodeExpansion={toggleNodeExpansion}
                visibleColumns={visibleColumns}
              />
            ))}
          </HierarchyChildren>
        )}
      </HierarchyNode>
    )
  }

  return (
    <FullScreenOverlay onClick={onClose}>
      <ResultsModal onClick={e => e.stopPropagation()}>
        <ResultsHeader>
          <HeaderLeft>
            <ResultsTitle>Query Results</ResultsTitle>
            <ResultsCount>
              {sortedAndFilteredResults.length}
              {searchQuery && ` of ${results.length}`} rows
            </ResultsCount>
            <SearchContainer>
              <Icon icon="search" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
              <SearchInput
                type="text"
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Icon 
                  icon="close" 
                  style={{ cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </SearchContainer>
            <ViewModeToggle>
              <ViewModeButton 
                $active={viewMode === 'table'} 
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <Icon icon="table_rows" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'hierarchy'} 
                onClick={() => setViewMode('hierarchy')}
                title="Hierarchy View"
              >
                <Icon icon="account_tree" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'timeline'} 
                onClick={() => setViewMode('timeline')}
                title="Timeline/Gantt View"
              >
                <Icon icon="view_timeline" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'workload'} 
                onClick={() => setViewMode('workload')}
                title="Workload View"
              >
                <Icon icon="group" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'dashboard'} 
                onClick={() => setViewMode('dashboard')}
                title="Dashboard / Reports"
              >
                <Icon icon="dashboard" />
              </ViewModeButton>
              <ViewModeButton 
                $active={viewMode === 'calendar'} 
                onClick={() => setViewMode('calendar')}
                title="Calendar View"
              >
                <Icon icon="calendar_month" />
              </ViewModeButton>
            </ViewModeToggle>
          </HeaderLeft>
          <HeaderActions>
            <Button 
              onClick={handleUndo} 
              disabled={!canUndo || undoing} 
              variant="text"
              title="Undo (Ctrl+Z)"
            >
              <Icon icon="undo" />
            </Button>
            <Button 
              onClick={handleRedo} 
              disabled={!canRedo || undoing} 
              variant="text"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Icon icon="redo" />
            </Button>
            <Button 
              onClick={() => setShowHistoryPanel(!showHistoryPanel)} 
              variant="text"
              title="View Edit History"
              style={showHistoryPanel ? { background: 'var(--md-sys-color-primary-container)' } : {}}
            >
              <Icon icon="history" />
            </Button>
            <Button onClick={() => setShowColumnOrder(!showColumnOrder)} variant="text" title="Column Order">
              <Icon icon="view_column" />
            </Button>
            <Button onClick={openInNewTab} disabled={results.length === 0} variant="text" title="Open in New Tab">
              <Icon icon="open_in_new" />
            </Button>
            <Button onClick={executeQuery} disabled={loading} title="Re-run Query">
              <Icon icon="refresh" /> {loading ? '...' : 'Re-run'}
            </Button>
            <Button onClick={exportCSV} disabled={results.length === 0} title="Export to CSV">
              <Icon icon="download" /> Export CSV
            </Button>
            <Button onClick={handleImportCSV} disabled={results.length === 0} title="Import from CSV">
              <Icon icon="upload" /> Import CSV
            </Button>
            <Button onClick={onClose} variant="text" title="Close">
              <Icon icon="close" />
            </Button>
          </HeaderActions>
        </ResultsHeader>
        
        {showColumnOrder && (
          <ColumnOrderPanel>
            <ColumnOrderTitle>Drag to reorder, click eye to toggle visibility (affects table and CSV export):</ColumnOrderTitle>
            <ColumnChips>
              {orderedColumns.map(col => (
                <ColumnChip
                  key={col}
                  $isDragging={draggedColumn === col}
                  $hidden={hiddenColumns.has(col)}
                  draggable
                  onDragStart={() => handleColumnDragStart(col)}
                  onDragOver={(e) => handleColumnDragOver(e, col)}
                  onDragEnd={handleColumnDragEnd}
                >
                  <Icon icon="drag_indicator" className="grip" />
                  {col}
                  <Icon 
                    icon={hiddenColumns.has(col) ? "visibility_off" : "visibility"} 
                    className="visibility-toggle"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      toggleColumnVisibility(col)
                    }}
                  />
                </ColumnChip>
              ))}
            </ColumnChips>
          </ColumnOrderPanel>
        )}
        
        <ResultsBody>
          {loading && <LoadingMessage>Executing query...</LoadingMessage>}
          
          {error && <ErrorMessage><strong>Error:</strong> {error}</ErrorMessage>}
          
          {!loading && !error && results.length === 0 && (
            <LoadingMessage>No results found. Make sure your nodes are connected properly.</LoadingMessage>
          )}
          
          {!loading && !error && results.length > 0 && viewMode === 'hierarchy' && (
            <HierarchyContainer>
              {hierarchicalResults.length > 0 ? (
                hierarchicalResults.map((node, idx) => (
                  <HierarchyNodeComponent
                    key={`${node.type}-${node.name}-${idx}`}
                    node={node}
                    path={node.name}
                    level={0}
                    expandedNodes={expandedNodes}
                    toggleNodeExpansion={toggleNodeExpansion}
                    visibleColumns={visibleColumns}
                  />
                ))
              ) : (
                <LoadingMessage>Building hierarchy...</LoadingMessage>
              )}
            </HierarchyContainer>
          )}
          
          {!loading && !error && results.length > 0 && viewMode === 'table' && (
            <>
              {selectedRows.size > 0 && (
                <BulkEditToolbar>
                  <BulkEditInfo>
                    <Icon icon="check_box" />
                    {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
                  </BulkEditInfo>
                  <BulkEditActions>
                    <BulkEditSelect
                      value={bulkEditField}
                      onChange={(e) => setBulkEditField(e.target.value)}
                    >
                      <option value="">Select field to edit...</option>
                      {getBulkEditableFields().map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </BulkEditSelect>
                    
                    {bulkEditField === 'status' && statusOptions.length > 0 ? (
                      <BulkEditSelect
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      >
                        <option value="">Select status...</option>
                        {statusOptions.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </BulkEditSelect>
                    ) : bulkEditField === 'assignees' ? (
                      <BulkEditInput
                        type="text"
                        placeholder="Enter usernames (comma-separated)"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      />
                    ) : bulkEditField === 'startDate' || bulkEditField === 'endDate' ? (
                      <BulkEditInput
                        type="date"
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      />
                    ) : bulkEditField ? (
                      <BulkEditInput
                        type="text"
                        placeholder={`Enter new ${bulkEditField}...`}
                        value={bulkEditValue}
                        onChange={(e) => setBulkEditValue(e.target.value)}
                      />
                    ) : null}
                    
                    <Button 
                      onClick={handleBulkEdit}
                      disabled={!bulkEditField || !bulkEditValue || bulkSaving}
                    >
                      <Icon icon="edit" /> {bulkSaving ? 'Saving...' : 'Apply to Selected'}
                    </Button>
                  </BulkEditActions>
                  <Button onClick={clearSelection} variant="text">
                    <Icon icon="close" /> Clear Selection
                  </Button>
                </BulkEditToolbar>
              )}
              <TableContainer ref={tableContainerRef} onScroll={handleTableScroll}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <SelectAllCheckbox
                          type="checkbox"
                          checked={selectedRows.size === sortedResults.length && sortedResults.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          title="Select all rows"
                        />
                      </th>
                      {visibleColumns.map(col => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className={`sortable ${sortColumn === col ? `sorted-${sortDirection}` : ''}`}
                          title={isColumnEditable(col) ? 'Click cells to edit' : ''}
                        >
                          {col}
                          {isColumnEditable(col) && <span style={{ marginLeft: 4, opacity: 0.5, fontSize: 10 }}>✎</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Virtualization: padding for rows above viewport */}
                    {virtualizedRows.paddingTop > 0 && (
                      <tr style={{ height: virtualizedRows.paddingTop }} />
                    )}
                    {virtualizedRows.rows.map((row, localIdx) => {
                      const idx = virtualizedRows.startIndex + localIdx
                      return (
                      <tr 
                        key={idx}
                        style={{ 
                          height: ROW_HEIGHT,
                          background: selectedRows.has(idx) ? 'var(--md-sys-color-primary-container)' : undefined 
                        }}
                      >
                        <td style={{ width: 40, textAlign: 'center' }}>
                          <RowCheckbox
                            type="checkbox"
                            checked={selectedRows.has(idx)}
                            onChange={(e) => handleRowSelect(idx, e.target.checked)}
                          />
                        </td>
                        {visibleColumns.map(col => (
                        <td 
                          key={col}
                          onClick={() => handleCellClick(idx, col, row[col])}
                          style={{ 
                            cursor: isColumnEditable(col) ? 'text' : 'default',
                            backgroundColor: editingCell?.rowIdx === idx && editingCell?.column === col 
                              ? 'var(--md-sys-color-primary-container)' 
                              : undefined
                          }}
                        >
                          {editingCell?.rowIdx === idx && editingCell?.column === col ? (
                            isStatusColumn(col) && statusOptions.length > 0 ? (
                              <select
                                value={editValue}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setEditValue(newValue)
                                  // Pass value directly to avoid race condition
                                  handleCellEditSave(newValue)
                                }}
                                onBlur={() => handleCellEditSave()}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              >
                                {statusOptions.map(s => (
                                  <option key={s.name} value={s.name} style={{ color: s.color }}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            ) : isAssigneesColumn(col) && availableUsers.length > 0 ? (
                              <select
                                value={editValue}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setEditValue(newValue)
                                  // Pass value directly to avoid race condition
                                  handleCellEditSave(newValue)
                                }}
                                onBlur={() => handleCellEditSave()}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              >
                                <option value="">Unassigned</option>
                                {availableUsers.map(u => (
                                  <option key={u.name} value={u.name}>
                                    {u.fullName || u.name}
                                  </option>
                                ))}
                              </select>
                            ) : isDateColumn(col) ? (
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setEditValue(newValue)
                                  // Pass value directly to avoid race condition
                                  handleCellEditSave(newValue)
                                }}
                                onBlur={() => handleCellEditSave()}
                                onKeyDown={handleEditKeyDown}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={() => handleCellEditSave()}
                                autoFocus
                                disabled={saving}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '2px solid var(--md-sys-color-primary)',
                                  borderRadius: 4,
                                  background: 'var(--md-sys-color-surface)',
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontSize: 'inherit',
                                }}
                              />
                            )
                          ) : (
                            <span title={isColumnEditable(col) ? 'Click to edit' : ''}>
                              {isStatusColumn(col) ? (
                                <span style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: statusOptions.find(s => s.name === row[col])?.color || 'var(--md-sys-color-surface-variant)',
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}>
                                  {row[col]}
                                </span>
                              ) : isDateColumn(col) && row[col] ? (
                                <span style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: 'var(--md-sys-color-tertiary-container)',
                                  color: 'var(--md-sys-color-on-tertiary-container)',
                                  fontSize: 12,
                                }}>
                                  📅 {formatDateForDisplay(row[col])}
                                </span>
                              ) : (
                                row[col]
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )})}
                    {/* Virtualization: padding for rows below viewport */}
                    {virtualizedRows.paddingBottom > 0 && (
                      <tr style={{ height: virtualizedRows.paddingBottom }} />
                    )}
                </tbody>
              </table>
            </TableContainer>
            
            {/* Pagination Controls */}
            <PaginationContainer>
              <PaginationInfo>
                <span>
                  Showing {pageSize === -1 ? sortedAndFilteredResults.length : Math.min(pageSize, sortedAndFilteredResults.length - (currentPage - 1) * pageSize)} of {sortedAndFilteredResults.length} rows
                  {searchQuery && ` (filtered from ${results.length} total)`}
                </span>
                <span>|</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Rows per page:
                  <select 
                    value={pageSize} 
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={-1}>All</option>
                  </select>
                </label>
              </PaginationInfo>
              
              {pageSize !== -1 && totalPages > 1 && (
                <PaginationControls>
                  <PageButton 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    title="First page"
                  >
                    ⟨⟨
                  </PageButton>
                  <PageButton 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    ⟨
                  </PageButton>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <PageButton
                        key={pageNum}
                        $active={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PageButton>
                    )
                  })}
                  
                  <PageButton 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    ⟩
                  </PageButton>
                  <PageButton 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                    title="Last page"
                  >
                    ⟩⟩
                  </PageButton>
                  
                  <span style={{ marginLeft: 8, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                </PaginationControls>
              )}
            </PaginationContainer>
            </>
          )}
          
          {/* Timeline/Gantt View */}
          {!loading && !error && results.length > 0 && viewMode === 'timeline' && (
            <GanttContainer>
              <GanttControls>
                <GanttZoomControl>
                  <span>Zoom:</span>
                  <Button 
                    variant={timelineZoom === 'day' ? 'filled' : 'text'} 
                    onClick={() => setTimelineZoom('day')}
                  >
                    Day
                  </Button>
                  <Button 
                    variant={timelineZoom === 'week' ? 'filled' : 'text'} 
                    onClick={() => setTimelineZoom('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timelineZoom === 'month' ? 'filled' : 'text'} 
                    onClick={() => setTimelineZoom('month')}
                  >
                    Month
                  </Button>
                </GanttZoomControl>
                <GanttZoomControl>
                  <Button variant="text" onClick={() => {
                    const newStart = new Date(timelineStart)
                    newStart.setDate(newStart.getDate() - 14)
                    setTimelineStart(newStart)
                  }}>
                    <Icon icon="chevron_left" /> Earlier
                  </Button>
                  <Button variant="text" onClick={() => {
                    const today = new Date()
                    today.setDate(today.getDate() - 7)
                    setTimelineStart(today)
                  }}>
                    Today
                  </Button>
                  <Button variant="text" onClick={() => {
                    const newStart = new Date(timelineStart)
                    newStart.setDate(newStart.getDate() + 14)
                    setTimelineStart(newStart)
                  }}>
                    Later <Icon icon="chevron_right" />
                  </Button>
                </GanttZoomControl>
                <Button 
                  variant={showDependencies ? 'filled' : 'text'}
                  onClick={() => setShowDependencies(!showDependencies)}
                  title="Show task dependencies"
                >
                  <Icon icon="timeline" /> Dependencies
                </Button>
                <span style={{ marginLeft: 'auto', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}>
                  {tasksWithDates.length} tasks with dates
                </span>
              </GanttControls>
              
              <GanttHeader>
                <GanttTaskColumn>Task</GanttTaskColumn>
                <GanttTimelineHeader ref={ganttHeaderRef} onScroll={handleGanttHeaderScroll}>
                  {getDaysArray().map((day, idx) => (
                    <GanttDayHeader 
                      key={idx} 
                      $isWeekend={isWeekend(day)} 
                      $isToday={isToday(day)}
                      style={{ minWidth: getDayWidth() }}
                    >
                      <div className="day-num">{day.getDate()}</div>
                      <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}</div>
                    </GanttDayHeader>
                  ))}
                </GanttTimelineHeader>
              </GanttHeader>
              
              <GanttBody ref={ganttBodyRef} onScroll={handleGanttBodyScroll}>
                {/* Dependency lines overlay */}
                {showDependencies && dependencies.length > 0 && (
                  <DependencyLine>
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="var(--md-sys-color-outline)"
                        />
                      </marker>
                    </defs>
                    {dependencies.map((dep, depIdx) => {
                      const sourceRow = sortedAndFilteredResults[dep.sourceIdx]
                      const targetRow = sortedAndFilteredResults[dep.targetIdx]
                      const sourcePos = getBarPosition(sourceRow?.startDate, sourceRow?.endDate)
                      const targetPos = getBarPosition(targetRow?.startDate, targetRow?.endDate)
                      
                      if (!sourcePos || !targetPos) return null
                      
                      const rowHeight = 36
                      const taskColWidth = 200
                      const x1 = taskColWidth + sourcePos.left + sourcePos.width
                      const y1 = dep.sourceIdx * rowHeight + 18
                      const x2 = taskColWidth + targetPos.left
                      const y2 = dep.targetIdx * rowHeight + 18
                      
                      // Draw a curved line from end of source to start of target
                      const midX = (x1 + x2) / 2
                      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
                      
                      return (
                        <path
                          key={depIdx}
                          d={path}
                          stroke="var(--md-sys-color-outline)"
                          strokeWidth="2"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                          opacity={0.6}
                        />
                      )
                    })}
                  </DependencyLine>
                )}
                
                {sortedAndFilteredResults.map((row, idx) => {
                  const barPos = getBarPosition(row.startDate, row.endDate)
                  const milestone = isMilestone(row)
                  return (
                    <GanttRow key={idx}>
                      <GanttTaskCell>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: milestone ? 0 : '50%',
                          transform: milestone ? 'rotate(45deg)' : 'none',
                          background: getStatusColor(row.status || row.taskStatus),
                        }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.name || row.taskName || row.folderName}
                          {milestone && ' ★'}
                        </span>
                      </GanttTaskCell>
                      <GanttTimelineRow>
                        {getDaysArray().map((day, dayIdx) => (
                          <GanttDayCell 
                            key={dayIdx}
                            $isWeekend={isWeekend(day)}
                            $isToday={isToday(day)}
                            style={{ minWidth: getDayWidth() }}
                          />
                        ))}
                        {barPos && !milestone && (
                          <GanttBar 
                            $color={getStatusColor(row.status || row.taskStatus)}
                            $left={barPos.left + (draggingTask?.rowIdx === idx ? dragDelta : 0)}
                            $width={barPos.width}
                            $isDragging={draggingTask?.rowIdx === idx}
                            title={`${row.name || row.taskName}: ${row.startDate ? formatDateForDisplay(row.startDate) : ''} - ${row.endDate ? formatDateForDisplay(row.endDate) : ''}`}
                            onMouseDown={(e) => handleBarMouseDown(e, idx, barPos.left)}
                          >
                            {row.name || row.taskName}
                          </GanttBar>
                        )}
                        {barPos && milestone && (
                          <MilestoneMarker
                            $left={barPos.left + (draggingTask?.rowIdx === idx ? dragDelta : 0)}
                            $color={getStatusColor(row.status || row.taskStatus)}
                            title={`Milestone: ${row.name || row.taskName} - ${row.startDate ? formatDateForDisplay(row.startDate) : ''}`}
                            onMouseDown={(e: React.MouseEvent) => handleBarMouseDown(e, idx, barPos.left)}
                          />
                        )}
                      </GanttTimelineRow>
                    </GanttRow>
                  )
                })}
              </GanttBody>
            </GanttContainer>
          )}
          
          {/* Workload View */}
          {viewMode === 'workload' && (
            <WorkloadContainer>
              {workloadData.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <Icon icon="group" style={{ fontSize: 48, marginBottom: 12 }} />
                  <div>No assigned tasks found</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    Assign tasks to artists to see workload distribution
                  </div>
                </div>
              ) : (
                workloadData.map((artist, idx) => {
                  const maxHoursPerWeek = 40
                  const totalWeeks = 4 // Assume 4-week planning horizon
                  const targetHours = maxHoursPerWeek * totalWeeks
                  const percentage = (artist.totalHours / targetHours) * 100
                  const isOverloaded = percentage > 100
                  
                  return (
                    <WorkloadArtistCard key={artist.name}>
                      <WorkloadArtistHeader>
                        <WorkloadArtistAvatar>
                          {artist.name === '_unassigned' 
                            ? '?' 
                            : artist.fullName?.charAt(0).toUpperCase() || artist.name.charAt(0).toUpperCase()
                          }
                        </WorkloadArtistAvatar>
                        <WorkloadArtistInfo>
                          <div className="name">{artist.fullName}</div>
                          <div className="stats">
                            {artist.tasks.length} tasks • {artist.completedTasks} completed • ~{Math.round(artist.totalHours)} hours
                          </div>
                        </WorkloadArtistInfo>
                        {artist.name !== '_unassigned' && (
                          <>
                            <WorkloadProgressBar $percentage={percentage} $overloaded={isOverloaded} />
                            <span style={{ 
                              fontSize: 12, 
                              color: isOverloaded ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)',
                              fontWeight: isOverloaded ? 600 : 400
                            }}>
                              {Math.round(percentage)}%
                            </span>
                          </>
                        )}
                      </WorkloadArtistHeader>
                      <WorkloadTaskList>
                        {artist.tasks.slice(0, 5).map((task, taskIdx) => (
                          <WorkloadTaskItem key={taskIdx}>
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: getStatusColor(task.status || task.taskStatus),
                              flexShrink: 0
                            }} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.name || task.taskName}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {task.taskType || task.type}
                            </span>
                            {task.startDate && (
                              <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {formatDateForDisplay(task.startDate)}
                              </span>
                            )}
                          </WorkloadTaskItem>
                        ))}
                        {artist.tasks.length > 5 && (
                          <WorkloadTaskItem style={{ justifyContent: 'center', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }}>
                            + {artist.tasks.length - 5} more tasks
                          </WorkloadTaskItem>
                        )}
                      </WorkloadTaskList>
                    </WorkloadArtistCard>
                  )
                })
              )}
            </WorkloadContainer>
          )}
          
          {/* Dashboard View */}
          {viewMode === 'dashboard' && dashboardStats && (
            <DashboardContainer>
              {/* Total Tasks Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="task_alt" /> Total Tasks
                </WidgetTitle>
                <WidgetValue>{dashboardStats.totalTasks}</WidgetValue>
                <WidgetSubtext>
                  {dashboardStats.completedTasks} completed • {dashboardStats.inProgressTasks} in progress
                </WidgetSubtext>
              </DashboardWidget>
              
              {/* Completion Progress Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="pie_chart" /> Completion
                </WidgetTitle>
                <WidgetValue>{dashboardStats.completionPercentage}%</WidgetValue>
                <ProgressBar $percentage={dashboardStats.completionPercentage} />
                <WidgetSubtext>
                  {dashboardStats.completedTasks} of {dashboardStats.totalTasks} tasks done
                </WidgetSubtext>
              </DashboardWidget>
              
              {/* Deadline Tracking Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="schedule" /> Deadlines
                </WidgetTitle>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <WidgetValue style={{ color: dashboardStats.overdueTasks > 0 ? 'var(--md-sys-color-error)' : 'inherit', fontSize: 24 }}>
                      {dashboardStats.overdueTasks}
                    </WidgetValue>
                    <WidgetSubtext>Overdue</WidgetSubtext>
                  </div>
                  <div>
                    <WidgetValue style={{ color: dashboardStats.dueSoonTasks > 0 ? 'var(--md-sys-color-warning, orange)' : 'inherit', fontSize: 24 }}>
                      {dashboardStats.dueSoonTasks}
                    </WidgetValue>
                    <WidgetSubtext>Due in 3 days</WidgetSubtext>
                  </div>
                </div>
              </DashboardWidget>
              
              {/* Status Breakdown Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="donut_small" /> Status Breakdown
                </WidgetTitle>
                <StatusBreakdown>
                  {dashboardStats.statusBreakdown.slice(0, 6).map(([status, info]) => (
                    <StatusRow key={status}>
                      <StatusDot $color={info.color} />
                      <span style={{ flex: 1 }}>{status}</span>
                      <span style={{ fontWeight: 600 }}>{info.count}</span>
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }}>
                        ({Math.round((info.count / dashboardStats.totalTasks) * 100)}%)
                      </span>
                    </StatusRow>
                  ))}
                </StatusBreakdown>
              </DashboardWidget>
              
              {/* Task Types Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="category" /> Task Types
                </WidgetTitle>
                <ChartContainer>
                  {dashboardStats.typeBreakdown.slice(0, 8).map(([type, count]) => {
                    const maxCount = Math.max(...dashboardStats.typeBreakdown.map(([, c]) => c))
                    const height = maxCount > 0 ? (count / maxCount) * 80 : 0
                    return (
                      <ChartColumn key={type}>
                        <ChartBar $height={height} title={`${type}: ${count}`} />
                        <ChartLabel>{type.slice(0, 3)}</ChartLabel>
                      </ChartColumn>
                    )
                  })}
                </ChartContainer>
              </DashboardWidget>
              
              {/* Progress Trend Widget */}
              <DashboardWidget>
                <WidgetTitle>
                  <Icon icon="trending_up" /> Progress Trend (7 days)
                </WidgetTitle>
                <ChartContainer>
                  {dashboardStats.dailyProgress.map((progress, idx) => (
                    <ChartColumn key={idx}>
                      <ChartBar 
                        $height={(progress / 100) * 80} 
                        $color={idx === dashboardStats.dailyProgress.length - 1 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)'}
                        title={`${progress}%`}
                      />
                      <ChartLabel>D{idx + 1}</ChartLabel>
                    </ChartColumn>
                  ))}
                </ChartContainer>
              </DashboardWidget>
            </DashboardContainer>
          )}
          
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <CalendarContainer>
              <CalendarControls>
                <Button 
                  variant="text" 
                  onClick={() => {
                    const newMonth = new Date(calendarMonth)
                    newMonth.setMonth(newMonth.getMonth() - 1)
                    setCalendarMonth(newMonth)
                  }}
                >
                  <Icon icon="chevron_left" />
                </Button>
                <CalendarMonthTitle>
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CalendarMonthTitle>
                <Button 
                  variant="text" 
                  onClick={() => {
                    const newMonth = new Date(calendarMonth)
                    newMonth.setMonth(newMonth.getMonth() + 1)
                    setCalendarMonth(newMonth)
                  }}
                >
                  <Icon icon="chevron_right" />
                </Button>
                <Button 
                  variant="text" 
                  onClick={() => setCalendarMonth(new Date())}
                >
                  Today
                </Button>
                <span style={{ marginLeft: 'auto', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}>
                  {tasksWithDates.length} tasks with dates
                </span>
              </CalendarControls>
              <CalendarGrid>
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <CalendarDayHeader key={day}>{day}</CalendarDayHeader>
                ))}
                {/* Calendar days */}
                {getCalendarDays().map((day, idx) => {
                  const tasks = getTasksForDate(day.date)
                  const today = new Date()
                  const isToday = day.date.toDateString() === today.toDateString()
                  
                  return (
                    <CalendarDay 
                      key={idx}
                      $isToday={isToday}
                      $isCurrentMonth={day.isCurrentMonth}
                    >
                      <CalendarDayNumber $isToday={isToday}>
                        {day.date.getDate()}
                      </CalendarDayNumber>
                      {tasks.slice(0, 3).map((task, taskIdx) => (
                        <CalendarTask 
                          key={taskIdx}
                          $color={getStatusColor(task.status || task.taskStatus)}
                          title={`${task.name || task.taskName} (${task.taskType || task.type})`}
                        >
                          {task.name || task.taskName}
                        </CalendarTask>
                      ))}
                      {tasks.length > 3 && (
                        <div style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)', padding: '2px 6px' }}>
                          +{tasks.length - 3} more
                        </div>
                      )}
                    </CalendarDay>
                  )
                })}
              </CalendarGrid>
            </CalendarContainer>
          )}
          
          {/* Edit History Panel */}
          <HistoryPanel $visible={showHistoryPanel}>
            <HistoryHeader>
              <HistoryTitle>Edit History</HistoryTitle>
              <Button onClick={() => setShowHistoryPanel(false)} variant="text">
                <Icon icon="close" />
              </Button>
            </HistoryHeader>
            <HistoryList>
              {editHistory.length === 0 ? (
                <HistoryEmpty>
                  <Icon icon="history" style={{ fontSize: 48, marginBottom: 12 }} />
                  <div>No edits yet</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    Click on cells to edit values
                  </div>
                </HistoryEmpty>
              ) : (
                [...editHistory].reverse().map((entry, idx) => {
                  const reverseIdx = editHistory.length - 1 - idx
                  const isCurrent = historyIndex === -1 
                    ? reverseIdx === editHistory.length - 1 
                    : reverseIdx === historyIndex
                  return (
                    <HistoryItem key={entry.timestamp} $current={isCurrent}>
                      <div className="field-name">
                        {entry.field} ({entry.entityType})
                      </div>
                      <div className="change">
                        <span className="old-value" title={String(entry.oldValue ?? '(empty)')}>
                          {entry.oldValue ?? '(empty)'}
                        </span>
                        <span className="arrow">→</span>
                        <span className="new-value" title={String(entry.newValue ?? '(empty)')}>
                          {entry.newValue ?? '(empty)'}
                        </span>
                      </div>
                      <div className="timestamp">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </HistoryItem>
                  )
                })
              )}
            </HistoryList>
          </HistoryPanel>
        </ResultsBody>
      </ResultsModal>
      
      {/* Production Templates Modal */}
      <TemplateModal $visible={showTemplateModal} onClick={() => setShowTemplateModal(false)}>
        <TemplateModalContent onClick={e => e.stopPropagation()}>
          <TemplateModalHeader>
            <TemplateModalTitle>
              <Icon icon="dashboard_customize" /> Production Templates
            </TemplateModalTitle>
            <Button variant="text" onClick={() => setShowTemplateModal(false)}>
              <Icon icon="close" />
            </Button>
          </TemplateModalHeader>
          <TemplateGrid>
            {Object.entries(PRODUCTION_TEMPLATES).map(([key, template]) => (
              <TemplateCard 
                key={key}
                $selected={selectedTemplate === key}
                onClick={() => setSelectedTemplate(selectedTemplate === key ? null : key)}
              >
                <TemplateCardIcon>{template.icon}</TemplateCardIcon>
                <TemplateCardTitle>{template.name}</TemplateCardTitle>
                <TemplateCardDescription>{template.description}</TemplateCardDescription>
                {selectedTemplate === key && (
                  <TemplatePreview>{template.preview}</TemplatePreview>
                )}
              </TemplateCard>
            ))}
          </TemplateGrid>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <WidgetSubtext>
              Templates provide a starting point for your production structure. 
              Select a template and apply it to quickly set up folders and task types.
            </WidgetSubtext>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button 
                variant="text" 
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="filled" 
                disabled={!selectedTemplate}
                onClick={() => {
                  // Template application would require API calls to create folders/tasks
                  // For now, just show an alert
                  if (selectedTemplate) {
                    const template = PRODUCTION_TEMPLATES[selectedTemplate as keyof typeof PRODUCTION_TEMPLATES]
                    alert(`Template "${template.name}" selected!\n\nFolders: ${template.folders.join(', ')}\nTask Types: ${template.taskTypes.join(', ')}\n\nNote: Full template application requires additional API integration.`)
                    setShowTemplateModal(false)
                    setSelectedTemplate(null)
                  }
                }}
              >
                <Icon icon="check" /> Apply Template
              </Button>
            </div>
          </div>
        </TemplateModalContent>
      </TemplateModal>
    </FullScreenOverlay>
  )
}

export default ResultsFullPage