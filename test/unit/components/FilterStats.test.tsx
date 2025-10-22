import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '~/test/utils/test-utils';
import { FilterStats } from '~/components/FilterStats';

describe('FilterStats Component', () => {
  const defaultProps = {
    total: 100,
    filtered: 25,
    label: 'opportunities',
  };

  it('should render with basic props', () => {
    render(<FilterStats {...defaultProps} />);

    expect(screen.getByText(/Showing 25 of 100 opportunities/i)).toBeInTheDocument();
  });

  it('should show singular label when filtered count is 1', () => {
    render(<FilterStats total={10} filtered={1} label="opportunity" />);

    expect(screen.getByText(/Showing 1 of 10 opportunity/i)).toBeInTheDocument();
  });

  it('should show all items message when filtered equals total', () => {
    render(<FilterStats total={50} filtered={50} label="items" />);

    expect(screen.getByText(/Showing all 50 items/i)).toBeInTheDocument();
  });

  it('should handle zero items', () => {
    render(<FilterStats total={0} filtered={0} label="results" />);

    expect(screen.getByText(/No results/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FilterStats {...defaultProps} className="custom-class" />
    );

    const statsElement = container.firstChild;
    expect(statsElement).toHaveClass('custom-class');
  });

  it('should handle edge case where filtered > total', () => {
    // This shouldn't happen in practice, but good to test
    render(<FilterStats total={10} filtered={20} label="items" />);

    // Component should handle gracefully
    expect(screen.getByText(/Showing 20 of 10 items/i)).toBeInTheDocument();
  });
});