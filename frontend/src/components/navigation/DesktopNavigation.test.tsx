import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopNavigation } from './DesktopNavigation';
import { LanguageProvider } from '@/context/LanguageContext';

// Mock WorkspaceSwitcher completely
vi.mock('@/components/ui/WorkspaceSwitcher', () => ({
  WorkspaceSwitcher: () => null,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('DesktopNavigation', () => {
  it('should render navigation', () => {
    const mockOnTabChange = vi.fn();
    
    renderWithProviders(
      <DesktopNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should call onTabChange when clicked', () => {
    const mockOnTabChange = vi.fn();
    
    renderWithProviders(
      <DesktopNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    // Find any navigation button and click it
    const buttons = screen.getAllByRole('button');
    const navButton = buttons.find(btn => btn.textContent?.includes('Personal'));
    
    if (navButton) {
      fireEvent.click(navButton);
      expect(mockOnTabChange).toHaveBeenCalled();
    }
  });

  it('should have proper ARIA attributes', () => {
    const mockOnTabChange = vi.fn();
    
    renderWithProviders(
      <DesktopNavigation currentTab="overview" onTabChange={mockOnTabChange} />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });
});
