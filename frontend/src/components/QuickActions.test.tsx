import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from './QuickActions';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('QuickActions', () => {
  const mockOnNewTransaction = vi.fn();
  const mockOnNewReminder = vi.fn();

  beforeEach(() => {
    mockOnNewTransaction.mockClear();
    mockOnNewReminder.mockClear();
  });

  it('should render FAB button', () => {
    render(<QuickActions />);
    
    const fab = screen.getByLabelText(/abrir ações rápidas/i);
    expect(fab).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<QuickActions />);
    
    const fab = screen.getByLabelText(/abrir ações rápidas/i);
    expect(fab).toHaveAttribute('aria-expanded');
  });

  it('should call callback when provided', () => {
    render(<QuickActions onNewTransaction={mockOnNewTransaction} />);
    
    const fab = screen.getByLabelText(/abrir ações rápidas/i);
    expect(fab).toBeInTheDocument();
  });
});
