import styled from 'styled-components'

export const ReleasePreset = styled.button`
  /* reset button */
  border: none;
  text-align: left;

  display: flex;
  padding: 16px;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
  min-height: 60px;
  flex-direction: column;

  & > * {
    z-index: 1;
  }

  border-radius: 8px;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-primary-container);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  span {
    word-break: break-all;
    line-height: 100%;
  }

  .addons {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);

      &:disabled {
        background-color: var(--md-sys-color-primary-container);
      }
    }
    .icon {
      /* fill icon */
      font-variation-settings: 'FILL' 1;
    }
  }

  &.loading {
    opacity: 0.6;
    cursor: wait;
    
    .icon {
      animation: spin 1s linear infinite;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest);
    }
  }

  .error {
    color: var(--md-sys-color-error);
    font-size: 0.875rem;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`