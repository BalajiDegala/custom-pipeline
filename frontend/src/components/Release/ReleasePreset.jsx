import React from 'react'
import { Icon } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import * as Styled from './ReleasePreset.styled'

const ReleasePreset = ({
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
}) => {
  return (
    <Styled.ReleasePreset
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
}

export default ReleasePreset