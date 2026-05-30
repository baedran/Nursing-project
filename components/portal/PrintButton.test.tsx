import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import PrintButton from "@/components/portal/PrintButton";

describe("PrintButton", () => {
  test("renders its label", () => {
    render(<PrintButton label="Print summary" />);
    expect(
      screen.getByRole("button", { name: /print summary/i }),
    ).toBeInTheDocument();
  });
});
