import { render, screen } from "@testing-library/react";
import React from "react";
import Pill from "../../components/Pill";

describe("Pill", () => {
  it("renders children and applies style", () => {
    render(<Pill intent="success">Done</Pill>);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
