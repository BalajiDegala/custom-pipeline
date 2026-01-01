import React, { useMemo, useCallback, useRef, useState } from 'react'
import * as Styled from './UserDashboardList.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onCollapsedColumnsChanged, onTaskSelected } from '@state/dashboard'
import ListItem from '@components/ListItem/ListItem'
import { InView } from 'react-intersection-observer'
import { useURIContext } from '@shared/context'
import { getTaskRoute } from '@helpers/routes'
import { useScopedDetailsPanel } from '@shared/context'
import { useGetTaskContextMenu } from '@pages/UserDashboardPage/hooks'
import styled from 'styled-components'
import { Button, Icon } from '@ynput/ayon-react-components'

const NestedGroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  padding-left: ${props => (props.$level * 24) + 16}px;
  background: ${props => props.$level === 0 
    ? 'var(--md-sys-color-surface-container-high)' 
    : props.$level === 1 
      ? 'var(--md-sys-color-surface-container)' 
      : 'var(--md-sys-color-surface)'};
  border-bottom: 1px solid ${props => props.$color || 'var(--md-sys-color-outline-variant)'};
  cursor: pointer;
  user-select: none;
  position: sticky;
  top: ${props => props.$level * 36}px;
  z-index: ${props => 50 - props.$level};
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  .group-label {
    font-weight: ${props => props.$level === 0 ? 600 : 500};
    font-size: ${props => props.$level === 0 ? '14px' : '13px'};
    color: var(--md-sys-color-on-surface);
  }
  
  .group-count {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
    padding: 2px 8px;
    background: var(--md-sys-color-surface-container-high);
    border-radius: 12px;
  }
  
  .collapse-icon {
    transition: transform 0.2s;
    transform: rotate(${props => props.$collapsed ? '-90deg' : '0deg'});
  }
`

const NestedGroupContent = styled.div`
  display: ${props => props.$collapsed ? 'none' : 'block'};
`

const TaskListItem = styled.div`
  padding-left: ${props => (props.$level * 24)}px;
`

/**
 * Create a nested group structure from tasks based on multiple group by values
 */
const createNestedGroups = (tasks, groupByValues, projectUsers = []) => {
  if (!groupByValues || groupByValues.length === 0) {
    return { items: tasks, isLeaf: true }
  }
  
  const [currentGroup, ...remainingGroups] = groupByValues
  const groupField = currentGroup.id
  
  // Group tasks by the current field
  const grouped = {}
  
  tasks.forEach(task => {
    let key = task[groupField]
    
    // Handle array values (like assignees)
    if (Array.isArray(key)) {
      key = key.join(', ') || 'Unassigned'
    } else if (key === undefined || key === null) {
      key = 'None'
    }
    
    if (!grouped[key]) {
      // Get display name for the group
      let displayName = key
      if (groupField === 'assignees' && projectUsers.length) {
        const names = String(key).split(', ')
        const fullNames = names.map(name => {
          const user = projectUsers.find(u => u.name === name)
          return user?.fullName || name
        })
        displayName = fullNames.join(', ')
      }
      
      grouped[key] = {
        id: `${groupField}-${key}`,
        key: key,
        field: groupField,
        displayName: displayName,
        items: [],
        isLeaf: remainingGroups.length === 0
      }
    }
    
    grouped[key].items.push(task)
  })
  
  // Recursively create nested groups for remaining group by values
  if (remainingGroups.length > 0) {
    Object.values(grouped).forEach(group => {
      group.children = createNestedGroups(group.items, remainingGroups, projectUsers)
      group.isLeaf = false
    })
  }
  
  return grouped
}

/**
 * Flatten nested groups into a renderable array with level info
 */
const flattenNestedGroups = (grouped, collapsedGroups = [], level = 0, parentPath = '') => {
  const result = []
  
  if (grouped.isLeaf) {
    // It's tasks, add them
    grouped.items.forEach(task => {
      result.push({ type: 'task', task, level, parentPath })
    })
    return result
  }
  
  // Sort groups by key
  const sortedGroups = Object.values(grouped).sort((a, b) => {
    const aKey = String(a.key).toLowerCase()
    const bKey = String(b.key).toLowerCase()
    return aKey.localeCompare(bKey)
  })
  
  sortedGroups.forEach(group => {
    const groupPath = parentPath ? `${parentPath}/${group.id}` : group.id
    const isCollapsed = collapsedGroups.includes(groupPath)
    
    // Add group header
    result.push({
      type: 'group',
      group,
      level,
      path: groupPath,
      isCollapsed,
      taskCount: group.items.length
    })
    
    // Add children if not collapsed
    if (!isCollapsed) {
      if (group.isLeaf) {
        // Add tasks
        group.items.forEach(task => {
          result.push({ type: 'task', task, level: level + 1, parentPath: groupPath })
        })
      } else {
        // Add nested groups
        const nested = flattenNestedGroups(group.children, collapsedGroups, level + 1, groupPath)
        result.push(...nested)
      }
    }
  })
  
  return result
}

const NestedDashboardList = ({
  tasks = [],
  groupByValue = [],
  isLoading,
  allUsers = [],
  statusesOptions = [],
  disabledStatuses = [],
  disabledProjectUsers = [],
  priorities = [],
  projectsInfo = {},
}) => {
  const dispatch = useDispatch()
  const containerRef = useRef(null)
  const { setUri } = useURIContext()
  const { setOpen } = useScopedDetailsPanel('dashboard')
  
  // Selected tasks
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected) || []
  const collapsedGroups = useSelector((state) => state.dashboard.tasks.collapsedColumns) || []
  
  // Create nested group structure
  const nestedGroups = useMemo(() => {
    return createNestedGroups(tasks, groupByValue, allUsers)
  }, [tasks, groupByValue, allUsers])
  
  // Flatten for rendering
  const flattenedItems = useMemo(() => {
    return flattenNestedGroups(nestedGroups, collapsedGroups)
  }, [nestedGroups, collapsedGroups])
  
  const handleToggleCollapse = useCallback((path) => {
    const newCollapsed = collapsedGroups.includes(path)
      ? collapsedGroups.filter(p => p !== path)
      : [...collapsedGroups, path]
    dispatch(onCollapsedColumnsChanged(newCollapsed))
  }, [collapsedGroups, dispatch])
  
  const handleTaskClick = useCallback((e, taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    let newIds = [taskId]
    let newTypes = [task.taskType]
    
    if (e.shiftKey && selectedTasks.length > 0) {
      // Shift-click: select range
      const taskIds = tasks.map(t => t.id)
      const lastSelected = selectedTasks[selectedTasks.length - 1]
      const lastIndex = taskIds.indexOf(lastSelected)
      const currentIndex = taskIds.indexOf(taskId)
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      newIds = taskIds.slice(start, end + 1)
      newTypes = newIds.map(id => tasks.find(t => t.id === id)?.taskType)
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click: toggle selection
      if (selectedTasks.includes(taskId)) {
        newIds = selectedTasks.filter(id => id !== taskId)
      } else {
        newIds = [...selectedTasks, taskId]
      }
      newTypes = newIds.map(id => tasks.find(t => t.id === id)?.taskType)
    }
    
    dispatch(onTaskSelected({
      ids: newIds,
      types: newTypes,
      data: newIds.map(id => {
        const t = tasks.find(task => task.id === id)
        return {
          id: t?.id,
          projectName: t?.projectName,
          taskType: t?.taskType,
          name: t?.name,
        }
      })
    }))
  }, [dispatch, tasks, selectedTasks])
  
  const handleDoubleClick = useCallback((e, task) => {
    if (e.metaKey || e.ctrlKey) {
      setUri(getTaskRoute(task))
    } else {
      setOpen(true)
    }
  }, [setUri, setOpen])
  
  const handleUpdate = useCallback((field, value) => {
    // This is handled by the parent BulkEditToolbar or ListItem
  }, [])
  
  const { handleContextMenu, closeContext } = useGetTaskContextMenu(tasks, dispatch, {
    onOpenInBrowser: (task) => setUri(getTaskRoute(task))
  })
  
  if (isLoading) {
    return (
      <Styled.ListContainer>
        <Styled.Inner>
          {[1, 2, 3, 4, 5].map(i => (
            <ListItem key={i} task={{ isLoading: true }} />
          ))}
        </Styled.Inner>
      </Styled.ListContainer>
    )
  }
  
  // If no grouping, just show flat list
  if (groupByValue.length === 0) {
    return (
      <Styled.ListContainer className="tasks-list">
        <Styled.Inner ref={containerRef}>
          {tasks.map((task, i) => (
            <InView key={task.id} root={containerRef?.current} rootMargin={'50% 0px 50% 0px'}>
              {({ inView, ref }) => (
                <ListItem
                  ref={ref}
                  task={task}
                  isLast={i === tasks.length - 1}
                  isFirst={i === 0}
                  selected={selectedTasks.includes(task.id)}
                  selectedLength={selectedTasks.length}
                  onClick={(e) => {
                    if (e?.detail === 2) {
                      return handleDoubleClick(e, task)
                    }
                    closeContext()
                    handleTaskClick(e, task.id)
                  }}
                  onContextMenu={handleContextMenu}
                  statusesOptions={statusesOptions}
                  disabledStatuses={disabledStatuses}
                  disabledProjectUsers={disabledProjectUsers}
                  onUpdate={handleUpdate}
                  allUsers={allUsers}
                  priorities={priorities}
                  inView={inView}
                />
              )}
            </InView>
          ))}
        </Styled.Inner>
      </Styled.ListContainer>
    )
  }
  
  return (
    <Styled.ListContainer className="tasks-list">
      <Styled.Inner ref={containerRef}>
        {flattenedItems.map((item, idx) => {
          if (item.type === 'group') {
            return (
              <NestedGroupHeader
                key={item.path}
                $level={item.level}
                $collapsed={item.isCollapsed}
                onClick={() => handleToggleCollapse(item.path)}
              >
                <Icon 
                  icon="expand_more" 
                  className="collapse-icon" 
                  style={{ fontSize: 18 }} 
                />
                <span className="group-label">{item.group.displayName}</span>
                <span className="group-count">{item.taskCount}</span>
              </NestedGroupHeader>
            )
          }
          
          // Task item
          const task = item.task
          return (
            <TaskListItem key={task.id} $level={item.level}>
              <InView root={containerRef?.current} rootMargin={'50% 0px 50% 0px'}>
                {({ inView, ref }) => (
                  <ListItem
                    ref={ref}
                    task={task}
                    selected={selectedTasks.includes(task.id)}
                    selectedLength={selectedTasks.length}
                    onClick={(e) => {
                      if (e?.detail === 2) {
                        return handleDoubleClick(e, task)
                      }
                      closeContext()
                      handleTaskClick(e, task.id)
                    }}
                    onContextMenu={handleContextMenu}
                    statusesOptions={statusesOptions}
                    disabledStatuses={disabledStatuses}
                    disabledProjectUsers={disabledProjectUsers}
                    onUpdate={handleUpdate}
                    allUsers={allUsers}
                    priorities={priorities}
                    inView={inView}
                  />
                )}
              </InView>
            </TaskListItem>
          )
        })}
        
        {flattenedItems.length === 0 && (
          <ListItem none />
        )}
      </Styled.Inner>
    </Styled.ListContainer>
  )
}

export default NestedDashboardList
