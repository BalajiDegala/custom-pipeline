import styled from 'styled-components'
import { Link } from 'react-router-dom'

const BrandContainer = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  letter-spacing: var(--letter-spacing-wide);
  transition: all 0.2s ease;
  border-radius: 8px;
  
  &:hover {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-primary);
    transform: translateY(-1px);
  }
`

const BrandIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-tertiary) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  box-shadow: var(--shadow-low);
`

const BrandText = styled.span`
  font-family: var(--font-family-primary);
  
  @media (max-width: 640px) {
    display: none;
  }
`

const Brand = ({ to = "/dashboard/tasks", children = "Pipeline" }) => {
  const initials = children.split(' ').map(word => word[0]).join('').toUpperCase()
  
  return (
    <BrandContainer to={to}>
      <BrandIcon>
        {initials}
      </BrandIcon>
      <BrandText>
        {children}
      </BrandText>
    </BrandContainer>
  )
}

export default Brand