import styled from 'styled-components'

export const NavBar = styled.nav`
    background-color: var(--md-sys-color-surface-container-low);
    border-bottom: 1px solid var(--border-color);
    padding: 0;
    box-shadow: var(--shadow-low);

    ul {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0;
        list-style: none;
        margin: 0;
        padding: 0;
        height: 48px;
        width: 100%;
        overflow-x: auto;
        
        /* Hide scrollbar but keep functionality */
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
            display: none;
        }
    }
`

export const NavItem = styled.li`
    user-select: none;
    display: flex;
    align-items: stretch;
    
    /* ShotGrid-style navigation links */
    a {
        display: flex;
        align-items: center;
        padding: 0 20px;
        text-decoration: none;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        letter-spacing: var(--letter-spacing-wide);
        text-transform: uppercase;
        position: relative;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        white-space: nowrap;
        
        &:hover {
            color: var(--text-primary);
            background-color: var(--md-sys-color-surface-container);
        }
        
        &.active {
            color: var(--md-sys-color-primary);
            border-bottom-color: var(--md-sys-color-primary);
            background-color: var(--md-sys-color-surface);
            font-weight: var(--font-weight-semibold);
        }
        
        /* Buttons inside navigation */
        button {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            transition: all 0.2s ease;
            
            &:hover {
                background-color: var(--md-sys-color-surface-container);
                border-color: var(--md-sys-color-primary);
                color: var(--md-sys-color-primary);
            }
        }
    }
`

export const Views = styled.span`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 8px;
`
