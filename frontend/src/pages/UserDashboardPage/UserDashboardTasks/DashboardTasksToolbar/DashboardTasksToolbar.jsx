import { Button, InputText, SortingDropdown, Spacer, Icon } from '@ynput/ayon-react-components'
import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onAssigneesChanged,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '@state/dashboard'
import MeOrUserSwitch from '@components/MeOrUserSwitch/MeOrUserSwitch'
import * as Styled from './DashboardTasksToolbar.styled'
import sortByOptions from './KanBanSortByOptions'
import { getGroupByOptions } from './KanBanGroupByOptions'
import styled from 'styled-components'

const CSVDropdownContainer = styled.div`
  position: relative;
`

const CSVDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 220px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 8px 0;
  margin-top: 4px;
`

const CSVMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  
  &:hover {
    background: var(--md-sys-color-surface-container-highest);
  }
  
  .icon {
    color: var(--md-sys-color-primary);
  }
`

const DashboardTasksToolbar = ({ isLoading, view, setView, tasks = [], projectsInfo = {} }) => {
  const dispatch = useDispatch()
  const [showCSVDropdown, setShowCSVDropdown] = useState(false)
  const csvDropdownRef = useRef(null)

  const user = useSelector((state) => state.user)
  const isManager = user?.data?.isManager || user?.data?.isAdmin

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (csvDropdownRef.current && !csvDropdownRef.current.contains(e.target)) {
        setShowCSVDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ASSIGNEES SELECT
  const assignees = useSelector((state) => state.dashboard.tasks.assignees)
  const assigneesFilter = useSelector((state) => state.dashboard.tasks.assigneesFilter)

  const setAssignees = (payload) => dispatch(onAssigneesChanged(payload))

  const sortByValue = useSelector((state) => state.dashboard.tasks.sortBy)
  const setSortByValue = (value) => dispatch(onTasksSortByChanged(value))

  // GROUP BY - Multi-select support
  const groupByOptions = getGroupByOptions(assigneesFilter !== 'me')
  const groupByValueRaw = useSelector((state) => state.dashboard.tasks.groupBy)
  const groupByValue = Array.isArray(groupByValueRaw) ? groupByValueRaw : []
  const setGroupByValue = (value) => dispatch(onTasksGroupByChanged(value))

  // Handle multi-select group by
  const handleGroupBy = (selectedOptions) => {
    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return setGroupByValue([])
    }
    // Map selected options to include sortOrder
    const mappedOptions = selectedOptions.map(opt => {
      const existingOpt = groupByValue.find(g => g.id === opt.id)
      return {
        ...opt,
        sortOrder: existingOpt?.sortOrder ?? opt.sortOrder ?? true
      }
    })
    setGroupByValue(mappedOptions)
  }

  // FILTER
  const filterValue = useSelector((state) => state.dashboard.tasks.filter)
  const setFilterValue = (value) => dispatch(onTasksFilterChanged(value))

  const handleAssigneesChange = (filter, newAssignees) => {
    const payload = {
      filter: filter,
      assignees: newAssignees || assignees,
    }
    setAssignees(payload)
  }

  // CSV Export functionality
  const exportTasksToCSV = () => {
    setShowCSVDropdown(false)
    
    try {
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        alert('No tasks to export')
        return
      }
      
      const headers = ['projectName', 'folderName', 'folderPath', 'name', 'taskType', 'status', 'assignees', 'priority', 'startDate', 'endDate']
      const csvRows = [headers.join(',')]
      
      tasks.forEach(task => {
        if (!task) return
        const row = headers.map(h => {
          let val = task[h]
          if (Array.isArray(val)) val = val.join(';')
          if (val === undefined || val === null) val = ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        csvRows.push(row.join(','))
      })
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `dashboard_tasks_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    }
  }

  // When user does not have permission to list other users, force the
  // assignees filter to "me" to avoid being unable to list tasks.
  if (!isManager && assigneesFilter !== "me") {
    console.log("Force assignees filter to 'me'")
    setAssignees({
      assignees: [],
      filter: "me"
    })
  }

  return (
    <Styled.TasksToolbar>
      <SortingDropdown
        title="Sort by"
        options={sortByOptions}
        value={sortByValue}
        onChange={setSortByValue}
      />
      <SortingDropdown
        title="Group by"
        options={groupByOptions}
        value={groupByValue}
        onChange={handleGroupBy}
        multiSelect={true}
      />
      
      <InputText
        placeholder="Filter tasks..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />
      {isManager && !isLoading && (
        <MeOrUserSwitch
          value={assignees}
          onChange={(state, v) => handleAssigneesChange(state, v)}
          filter={assigneesFilter}
          align={'right'}
          placeholder="Assignees"
          buttonStyle={{ outline: '1px solid var(--md-sys-color-outline-variant)' }}
          style={{ zIndex: 20 }}
        />
      )}
      <Spacer />
      
      {/* CSV Export */}
      <CSVDropdownContainer ref={csvDropdownRef}>
        <Button
          icon="download"
          onClick={() => setShowCSVDropdown(!showCSVDropdown)}
          data-tooltip="Export CSV"
        />
        {showCSVDropdown && (
          <CSVDropdown>
            <CSVMenuItem onClick={exportTasksToCSV}>
              <Icon icon="download" className="icon" />
              Export Tasks to CSV
            </CSVMenuItem>
          </CSVDropdown>
        )}
      </CSVDropdownContainer>
      
      <Button
        label="List"
        onClick={() => setView('list')}
        selected={view === 'list'}
        icon="format_list_bulleted"
        data-tooltip="List view"
      />
      <Button
        label="Board"
        onClick={() => setView('kanban')}
        selected={view === 'kanban'}
        icon="view_kanban"
        data-tooltip="Board (kanban) view"
      />
    </Styled.TasksToolbar>
  )
}

export default DashboardTasksToolbar
