import { AttributeModel } from '../ProjectTreeTable'
import { ProjectTableAttribute } from '../ProjectTreeTable/hooks/useAttributesList'
import { SelectionData, SliceDataItem, SliceFilter, SliceType } from './types'

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string; label: string }[]
}

export type CreateFilterFromSlicer = ({
  selection,
  type,
  attribFields,
}: {
  selection: SelectionData
  type: SliceType
  attribFields: ProjectTableAttribute[]
}) => SliceFilter | null

export const createFilterFromSlicer: CreateFilterFromSlicer = ({
  selection,
  type,
  attribFields,
}) => {
  const sliceFilterTypes = {
    assignees: 'list_of_strings',
    status: 'string',
    taskType: 'string',
    productType: 'string',
    author: 'string',
    hierarchy: undefined,
    ...attribFields.reduce((acc, field) => {
      // @ts-ignore
      acc['attrib.' + field.name] = field.data.type
      return acc
    }, {} as Record<string, AttributeModel['data']['type']>),
  }

  const filter: SliceFilter | null = (() => {
    const sliceType = sliceFilterTypes[type as keyof typeof sliceFilterTypes]
    if (!sliceType) return null

    const selectedItems = Object.values(selection)
    const values = selectedItems.map((item) => {
      // Ensure id and label are strings, not objects
      const id = typeof item.id === 'object' ? JSON.stringify(item.id) : String(item.id || '')
      const label = typeof item.label === 'object' 
        ? JSON.stringify(item.label) 
        : String(item.label || item.name || '')
      
      return {
        id,
        label,
      }
    })

    const filter = {
      id: type,
      label: type,
      type: sliceType,
      inverted: false,
      operator: 'OR',
      values,
    }

    console.log('[createFilterFromSlicer] Creating filter:', 
      '\n  type:', type,
      '\n  sliceType:', sliceType,
      '\n  values:', JSON.stringify(values, null, 2),
      '\n  filter:', JSON.stringify(filter, null, 2)
    )

    return filter
  })()

  return filter
}
