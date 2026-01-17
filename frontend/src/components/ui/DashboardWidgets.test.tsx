import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard, MiniChart, DollarSign } from './DashboardWidgets';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('DashboardWidgets', () => {
  describe('StatCard', () => {
    it('should render title and value', () => {
      render(
        <StatCard
          title="Total Balance"
          value="R$ 10.000"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('R$ 10.000')).toBeInTheDocument();
    });

    it('should show change indicator', () => {
      render(
        <StatCard
          title="Income"
          value="R$ 5.000"
          change={15}
          icon={DollarSign}
        />
      );

      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  describe('MiniChart', () => {
    it('should render chart title', () => {
      render(
        <MiniChart
          title="Spending Trend"
          data={[100, 200, 150, 300]}
        />
      );

      expect(screen.getByText('Spending Trend')).toBeInTheDocument();
    });
  });
});
