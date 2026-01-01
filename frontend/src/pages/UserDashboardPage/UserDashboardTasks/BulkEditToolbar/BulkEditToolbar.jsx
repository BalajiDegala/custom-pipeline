import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useUpdateEntitiesMutation } from '@shared/api'
import { toast } from 'react-toastify'
import styled from 'styled-components'

const BulkToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--md-sys-color-tertiary-container);
  border-radius: 8px;
  margin: 0 8px 8px 8px;
`

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-tertiary-container);
`

const EditDropdownContainer = styled.div`
  position: relative;
`

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 6px;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
`

const EditDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 8px 0;
  margin-top: 4px;
`

const EditOption = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: ${props => props.$active ? 'var(--md-sys-color-primary-container)' : 'none'};
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }

  .icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
`

const StatusDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.$color || 'var(--md-sys-color-outline)'};
`

const Divider = styled.hr`
  margin: 4px 0;
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

const BulkEditToolbar = ({
  selectedTasks = [],
  tasks = [],
  statusesOptions = [],
  priorities = [],
  projectUsers = [],
  onClearSelection,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  
  const statusRef = useRef(null)
  const priorityRef = useRef(null)
  const assigneeRef = useRef(null)

  const [updateEntities, { isLoading }] = useUpdateEntitiesMutation()

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDropdown(false)
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target)) {
        setShowPriorityDropdown(false)
      }
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get selected task data
  const selectedTasksData = tasks.filter(t => selectedTasks.includes(t.id))

  const handleBulkUpdate = async (field, value) => {
    if (selectedTasksData.length === 0) return
    
    try {
      const operations = selectedTasksData.map(task => ({
        id: task.id,
        projectName: task.projectName,
        data: field === 'attrib' ? { attrib: value } : { [field]: value },
        currentAssignees: task.assignees,
      }))

      await updateEntities({ operations, entityType: 'task' })
      toast.success(`Updated ${selectedTasksData.length} task(s)`)
      
      // Close dropdowns
      setShowStatusDropdown(false)
      setShowPriorityDropdown(false)
      setShowAssigneeDropdown(false)
    } catch (error) {
      toast.error('Error updating tasks')
      console.error(error)
    }
  }

  const handleAddAssignee = async (userName) => {
    if (selectedTasksData.length === 0) return
    
    try {
      const operations = selectedTasksData.map(task => {
        const newAssignees = task.assignees.includes(userName)
          ? task.assignees.filter(a => a !== userName)  // Remove if exists
          : [...task.assignees, userName]  // Add if not exists
        return {
          id: task.id,
          projectName: task.projectName,
          data: { assignees: newAssignees },
          currentAssignees: task.assignees,
        }
      })

      await updateEntities({ operations, entityType: 'task' })
      toast.success(`Updated assignees for ${selectedTasksData.length} task(s)`)
      setShowAssigneeDropdown(false)
    } catch (error) {
      toast.error('Error updating assignees')
      console.error(error)
    }
  }

  if (selectedTasks.length < 2) return null

  return (
    <BulkToolbarContainer>
      <SelectionInfo>
        <Icon icon="check_box" />
        {selectedTasks.length} tasks selected
      </SelectionInfo>

      {/* Status Edit */}
      <EditDropdownContainer ref={statusRef}>
        <EditButton onClick={() => setShowStatusDropdown(!showStatusDropdown)} disabled={isLoading}>
          <Icon icon="radio_button_checked" style={{ fontSize: 16 }} />
          Change Status
          <Icon icon="expand_more" style={{ fontSize: 16 }} />
        </EditButton>
        {showStatusDropdown && (
          <EditDropdown>
            {statusesOptions.map(status => (
              <EditOption 
                key={status.name} 
                onClick={() => handleBulkUpdate('status', status.name)}
              >
                <StatusDot $color={status.color} />
                {status.name}
              </EditOption>
            ))}
          </EditDropdown>
        )}
      </EditDropdownContainer>

      {/* Priority Edit */}
      <EditDropdownContainer ref={priorityRef}>
        <EditButton onClick={() => setShowPriorityDropdown(!showPriorityDropdown)} disabled={isLoading}>
          <Icon icon="flag" style={{ fontSize: 16 }} />
          Change Priority
          <Icon icon="expand_more" style={{ fontSize: 16 }} />
        </EditButton>
        {showPriorityDropdown && (
          <EditDropdown>
            {priorities.map(priority => (
              <EditOption 
                key={priority.value} 
                onClick={() => handleBulkUpdate('attrib', { priority: priority.value })}
              >
                {priority.icon && <Icon icon={priority.icon} style={{ fontSize: 16, color: priority.color }} />}
                {priority.label || priority.value}
              </EditOption>
            ))}
          </EditDropdown>
        )}
      </EditDropdownContainer>

      {/* Assignee Edit */}
      <EditDropdownContainer ref={assigneeRef}>
        <EditButton onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)} disabled={isLoading}>
          <Icon icon="person_add" style={{ fontSize: 16 }} />
          Toggle Assignee
          <Icon icon="expand_more" style={{ fontSize: 16 }} />
        </EditButton>
        {showAssigneeDropdown && (
          <EditDropdown>
            {projectUsers.map(user => (
              <EditOption 
                key={user.name} 
                onClick={() => handleAddAssignee(user.name)}
              >
                <Icon icon="person" style={{ fontSize: 16 }} />
                {user.fullName || user.name}
              </EditOption>
            ))}
          </EditDropdown>
        )}
      </EditDropdownContainer>

      <div style={{ flex: 1 }} />

      <Button
        icon="close"
        variant="text"
        onClick={onClearSelection}
        data-tooltip="Clear selection"
      />
    </BulkToolbarContainer>
  )
}

export default BulkEditToolbar
