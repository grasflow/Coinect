import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@test/helpers/test-utils";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renderuje się z tekstem", () => {
    render(<Button>Kliknij mnie</Button>);
    expect(screen.getByRole("button", { name: "Kliknij mnie" })).toBeInTheDocument();
  });

  it("obsługuje kliknięcie", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Kliknij mnie</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("jest wyłączony gdy disabled=true", () => {
    render(<Button disabled>Wyłączony</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("aplikuje poprawne klasy dla wariantów", () => {
    const { rerender } = render(<Button variant="filled">Filled</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(button.className).toContain("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    expect(button.className).toContain("border");
  });

  it("aplikuje poprawne klasy dla rozmiarów", () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");
  });
});
