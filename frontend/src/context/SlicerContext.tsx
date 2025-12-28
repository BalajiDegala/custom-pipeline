import {
  createContext,
  useContext,
  useState,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useSlicerReduxSync from '@containers/Slicer/hooks/useSlicerReduxSync'
import { SelectionData, SliceDataItem, SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useLoadModule } from '@shared/hooks'
import type { ProjectModel, Assignees, AttributeModel, ProductType } from '@shared/api'
import SlicerDropdownFallback, {
  SlicerDropdownFallbackProps,
} from '@containers/Slicer/SlicerDropdownFallback'
import { DropdownRef } from '@ynput/ayon-react-components'
import { SliceMap, SliceTypeField } from '@containers/Slicer/types'
import { usePowerpack } from '@shared/context'

export type OnSliceTypeChange = (
  sliceType: SliceType,
  leavePersistentSlice: boolean,
  returnToPersistentSlice: boolean,
) => void

export type SlicerConfig = {
  [page: string]: {
    fields: SliceTypeField[]
  }
}

type ExtraSlices = {
  formatStatuses: (project?: ProjectModel, scopes?: string[]) => SimpleTableRow[]
  formatTaskTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatProductTypes: (productTypes: ProductType[]) => SimpleTableRow[]
  formatTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatAssignees: (assignees: Assignees) => SimpleTableRow[]
  formatAttribute: (attribute: AttributeModel) => SimpleTableRow[]
}

export type UseExtraSlices = () => ExtraSlices

type OnRowSelectionChange = (selection: RowSelectionState, data: SliceMap) => void

interface SlicerContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  onRowSelectionChange?: OnRowSelectionChange
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  sliceType: SliceType
  onSliceTypeChange: OnSliceTypeChange
  rowSelectionData: SelectionData
  setRowSelectionData: React.Dispatch<React.SetStateAction<SelectionData>>
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: React.Dispatch<React.SetStateAction<SelectionData>>
  config: SlicerConfig
  useExtraSlices: UseExtraSlices
  SlicerDropdown: ForwardRefExoticComponent<
    SlicerDropdownFallbackProps & RefAttributes<DropdownRef>
  >
}

const SlicerContext = createContext<SlicerContextValue | undefined>(undefined)

interface SlicerProviderProps {
  children: ReactNode
}

export const SlicerProvider = ({ children }: SlicerProviderProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [rowSelectionData, setRowSelectionData] = useState<SelectionData>({})
  // if there is a need to leavePersistentSlice row selection data between slice changes (like the hierarchy)
  const [persistentRowSelectionData, setPersistentRowSelectionData] = useState<SelectionData>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sliceType, setSliceType] = useState<SliceType>('hierarchy')
  const config: SlicerConfig = {
    progress: {
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees' },
        { value: 'status' },
        { value: 'taskType' },
      ],
    },
    overview: {
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees' },
        { value: 'status' },
        { value: 'type' },
        { value: 'taskType' },
        { value: 'attributes' },
      ],
    },
    versions: {
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees', label: 'Task assignee' },
        { value: 'status', label: 'Version status' },
        { value: 'author', label: 'Version author' },
        { value: 'productType' },
        { value: 'taskType' },
      ],
    },
  }

  const { useExtraSlices, SlicerDropdown } = useSlicerRemotes()

  const { onRowSelectionChange, onExpandedChange } = useSlicerReduxSync({
    setExpanded,
    sliceType,
  })

  const getSelectionData = (selection: RowSelectionState, data: SliceMap) => {
    // for each selected row, get the data
    const selectedRows = Object.keys(selection)
      .filter((id) => selection[id]) // only include selected rows
      .reduce<Record<string, SliceDataItem>>((acc, id) => {
        const rowData = data.get(id)

        if (!rowData) {
          console.warn(`Row with id ${id} not found in data`)
          return acc
        }

        acc[id] = rowData
        return acc
      }, {})

    return selectedRows
  }

  //   do something with selection change
  const handleRowSelectionChange: OnRowSelectionChange = (selection, data) => {
    if (sliceType === 'hierarchy') {
      // update redux focused folders
      onRowSelectionChange(selection)
    }

    // get selection data
    const selectionData = getSelectionData(selection, data)
    setRowSelectionData(selectionData)
  }

  const handleExpandedChange = (expanded: ExpandedState) => {
    if (sliceType === 'hierarchy') {
      // update redux expanded folders
      onExpandedChange(expanded)
    }
  }

  const handleSliceTypeChange: OnSliceTypeChange = (
    sliceType,
    leavePersistentSlice,
    returnToPersistentSlice,
  ) => {
    // reset selection
    setRowSelection({})
    // set slice type
    setSliceType(sliceType)
    // reset selection data
    setRowSelectionData({})
    // set persistent selection data
    if (leavePersistentSlice) setPersistentRowSelectionData(rowSelectionData)
    // we returned to the persisted slice type

    if (returnToPersistentSlice) {
      // clear the persisted selection data
      setPersistentRowSelectionData({})
      // restore the selection data and selection
      setRowSelectionData(persistentRowSelectionData)
      setRowSelection(
        Object.keys(persistentRowSelectionData).reduce((acc, id) => {
          acc[id] = true
          return acc
        }, {} as RowSelectionState),
      )
    }
  }

  return (
    <SlicerContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        onRowSelectionChange: handleRowSelectionChange,
        expanded,
        setExpanded,
        onExpandedChange: handleExpandedChange,
        sliceType,
        onSliceTypeChange: handleSliceTypeChange,
        rowSelectionData,
        setRowSelectionData,
        persistentRowSelectionData,
        setPersistentRowSelectionData,
        config,
        useExtraSlices,
        SlicerDropdown,
      }}
    >
      {children}
    </SlicerContext.Provider>
  )
}

const useSlicerRemotes = () => {
  // MODIFICATION: Implement formatters to properly display assignees, status, task types, etc.
  const useExtraSlicesDefault: UseExtraSlices = () => {
    return {
      formatStatuses: (project?: ProjectModel, scopes?: string[]) => {
        if (!project?.statuses || project.statuses.length === 0) {
          return []
        }
        
        // MODIFICATION: Don't filter by scope - show all statuses
        // The scope filter was removing all statuses because scopes didn't match
        const statusList = project.statuses

        return statusList.map((status) => ({
          id: status.name,
          name: status.name,
          label: status.name,
          icon: status.icon || 'radio_button_checked',
          iconColor: status.color,
          subRows: [],
          data: { id: status.name, name: status.name },
        }))
      },
      formatTaskTypes: (project?: ProjectModel) => {
        if (!project?.taskTypes) return []
        
        return project.taskTypes.map((taskType) => ({
          id: taskType.name,
          name: taskType.name,
          label: taskType.name,
          icon: taskType.icon || 'task_alt',
          subRows: [],
          data: { id: taskType.name, name: taskType.name },
        }))
      },
      formatTypes: (project?: ProjectModel) => {
        if (!project?.folderTypes) return []
        
        return project.folderTypes.map((folderType) => ({
          id: folderType.name,
          name: folderType.name,
          label: folderType.name,
          icon: folderType.icon || 'folder',
          subRows: [],
          data: { id: folderType.name, name: folderType.name },
        }))
      },
      formatAssignees: (groups: any) => {
        // MODIFICATION: Handle BOTH user object and EntityGroup formats
        console.log('[formatAssignees] Input groups:', JSON.stringify(groups, null, 2))
        
        if (!groups) return []
        
        // If it's an array, check the format
        if (Array.isArray(groups)) {
          const formatted = groups.map((group) => {
            // Check if it's user object format (has 'name' and 'fullName')
            if (group.name && group.fullName !== undefined) {
              return {
                id: group.name,  // Use 'name' as id (username)
                name: group.name,
                label: group.fullName || group.name,
                icon: 'person',
                subRows: [],
                data: { id: group.name, name: group.fullName || group.name },
              }
            }
            // EntityGroup format (has 'value' and 'label')
            else if (group.value !== undefined) {
              return {
                id: group.value,  // Use 'value' as id (username)
                name: group.value,
                label: group.label || group.value,
                icon: 'person',
                subRows: [],
                data: { id: group.value, name: group.label || group.value },
              }
            }
            // Fallback - shouldn't happen
            return {
              id: String(group.id || group.name || 'unknown'),
              name: String(group.name || 'unknown'),
              label: String(group.label || group.fullName || group.name || 'unknown'),
              icon: 'person',
              subRows: [],
              data: {},
            }
          })
          console.log('[formatAssignees] Formatted rows:', JSON.stringify(formatted, null, 2))
          return formatted
        }
        
        // Legacy fallback: if it's Assignees object format
        return Object.entries(groups).map(([name, user]:  [string, any]) => ({
          id: name,
          name: name,
          label: user?.fullName || name,
          icon: 'person',
          subRows: [],
          data: { id: name, name: user?.fullName || name },
        }))
      },
      formatAttribute: (attribute: AttributeModel) => {
        if (!attribute?.data) return []
        
        return attribute.data.enum?.map((item) => {
          // Handle both string enum values and object enum values
          const isObject = typeof item === 'object' && item !== null
          const value = isObject ? (item as any).value : item
          const label = isObject ? ((item as any).label || value) : item
          const icon = isObject ? (item as any).icon : undefined
          const color = isObject ? (item as any).color : undefined
          
          const stringValue = String(value)
          const stringLabel = String(label)
          
          return {
            id: stringValue,
            name: stringValue,
            label: stringLabel,
            icon: icon,
            iconColor: color,
            subRows: [],
            data: { 
              id: stringValue, 
              name: stringValue,
              label: stringLabel,
            },
          }
        }) || []
      },
      formatProductTypes: (productTypes: ProductType[]) => {
        if (!productTypes) return []
        
        return productTypes.map((productType) => ({
          id: productType.name,
          name: productType.name,
          label: productType.name,
          icon: productType.icon || 'inventory_2',
          iconColor: productType.color,
          subRows: [],
          data: { id: productType.name, name: productType.name },
        }))
      },
      formatAuthors: (groups: any) => {
        // MODIFICATION: Handle BOTH user object and EntityGroup formats (same as assignees)
        if (!groups) return []
        
        if (Array.isArray(groups)) {
          return groups.map((group) => {
            // Check if it's user object format (has 'name' and 'fullName')
            if (group.name && group.fullName !== undefined) {
              return {
                id: group.name,  // Use 'name' as id (username)
                name: group.name,
                label: group.fullName || group.name,
                icon: 'attribution',
                subRows: [],
                data: { id: group.name, name: group.fullName || group.name },
              }
            }
            // EntityGroup format (has 'value' and 'label')
            else if (group.value !== undefined) {
              return {
                id: group.value,  // Use 'value' as id (username)
                name: group.value,
                label: group.label || group.value,
                icon: 'attribution',
                subRows: [],
                data: { id: group.value, name: group.label || group.value },
              }
            }
            // Fallback
            return {
              id: String(group.id || group.name || 'unknown'),
              name: String(group.name || 'unknown'),
              label: String(group.label || group.fullName || group.name || 'unknown'),
              icon: 'attribution',
              subRows: [],
              data: {},
            }
          })
        }
        
        return Object.entries(groups).map(([name, user]: [string, any]) => ({
          id: name,
          name: name,
          label: user?.fullName || name,
          icon: 'person',
          subRows: [],
          data: { id: name, name: user?.fullName || name },
        }))
      },
    }
  }

  const { powerLicense } = usePowerpack()

  // MODIFICATION: Always skip remote loading and use our local formatters
  const [useExtraSlices] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'useExtraSlices',
    fallback: useExtraSlicesDefault,
    skip: true, // MODIFICATION: Always use fallback formatters
  })

  const [SlicerDropdown] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'SlicerDropdown',
    fallback: SlicerDropdownFallback,
    skip: true, // MODIFICATION: Always use fallback dropdown
  })

  return { useExtraSlices, SlicerDropdown: SlicerDropdown }
}

export const useSlicerContext = () => {
  const context = useContext(SlicerContext)
  if (context === undefined) {
    throw new Error('useSlicerContext must be used within a SlicerProvider')
  }
  return context
}

export default SlicerContext
