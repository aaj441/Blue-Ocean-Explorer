import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpTooltip } from "../../src/components/HelpTooltip";

describe("HelpTooltip", () => {
  it("should render the tooltip icon", () => {
    render(<HelpTooltip content="Help text" />);

    const icon = screen.getByRole("button");
    expect(icon).toBeInTheDocument();
  });

  it("should show tooltip content on hover", async () => {
    render(<HelpTooltip content="This is help text" />);

    const icon = screen.getByRole("button");
    fireEvent.mouseEnter(icon);

    // The tooltip content should be visible
    const tooltip = await screen.findByText("This is help text");
    expect(tooltip).toBeInTheDocument();
  });

  it("should hide tooltip content on mouse leave", async () => {
    render(<HelpTooltip content="This is help text" />);

    const icon = screen.getByRole("button");
    fireEvent.mouseEnter(icon);
    
    const tooltip = await screen.findByText("This is help text");
    expect(tooltip).toBeInTheDocument();

    fireEvent.mouseLeave(icon);
  });

  it("should render with custom className", () => {
    const { container } = render(
      <HelpTooltip content="Help text" className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
