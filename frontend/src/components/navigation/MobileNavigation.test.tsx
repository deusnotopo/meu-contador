import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigation } from './MobileNavigation';

describe('MobileNavigation', () => {
  it('should render navigation', () => {
    const mockOnTabChange = vi.fn();
    
    render(
      <MobileNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should call onTabChange when clicked', () => {
    const mockOnTabChange = vi.fn();
    
    render(
      <MobileNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[1]); // Click second button
      expect(mockOnTabChange).toHaveBeenCalled();
    }
  });

  it('should have proper ARIA label', () => {
    const mockOnTabChange = vi.fn();
    
    render(
      <MobileNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });
});
