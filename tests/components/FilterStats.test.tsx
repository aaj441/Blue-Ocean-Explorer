import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterStats } from "../../src/components/FilterStats";

describe("FilterStats", () => {
  it("should render total count", () => {
    render(<FilterStats total={100} filtered={50} />);

    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("should render filtered count", () => {
    render(<FilterStats total={100} filtered={50} />);

    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("should show all items when no filter applied", () => {
    render(<FilterStats total={100} filtered={100} />);

    const text = screen.getByText(/100/);
    expect(text).toBeInTheDocument();
  });

  it("should handle zero items", () => {
    render(<FilterStats total={0} filtered={0} />);

    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it("should render with custom label", () => {
    render(
      <FilterStats total={100} filtered={50} label="opportunities" />,
    );

    expect(screen.getByText(/opportunities/i)).toBeInTheDocument();
  });
});
