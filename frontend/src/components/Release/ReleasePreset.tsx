import React from 'react'
import * as Styled from './ReleasePreset.styled'
import { Icon } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'

export interface ReleasePresetProps extends React.HTMLAttributes<HTMLButtonElement> {
  name?: string
  label?: string
  icon?: string
  isSelected?: boolean
  isLoading?: boolean
  disabled?: boolean
  error?: string
  index?: number
  addons?: string[]
}

const ReleasePreset = React.forwardRef<HTMLButtonElement, ReleasePresetProps>(
  (
    {
      name,
      label,
      icon = 'check_circle',
      isSelected,
      isLoading,
      disabled,
      error,
      index,
      addons,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Styled.ReleasePreset
        ref={ref}
        className={clsx(className, { 
          selected: isSelected, 
          error: !!error, 
          loading: isLoading 
        })}
        disabled={disabled || isLoading}
        {...props}
      >
        <Icon icon={icon} />
        <span className={Type.titleSmall}>{label || name || 'Release'}</span>
        {error && <span className="error">{error}</span>}
        {addons && (
          <span className="addons">
            {addons.length} addon{addons.length !== 1 ? 's' : ''}
          </span>
        )}
      </Styled.ReleasePreset>
    )
  },
)

ReleasePreset.displayName = 'ReleasePreset'

export default ReleasePreset