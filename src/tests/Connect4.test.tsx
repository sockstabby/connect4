import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import App from "../App";

describe("Carousel", () => {
  it("connect4", () => {
    render(<App />);

    screen.debug();

    expect(1).toEqual(1);

    // expect(screen.getByText("a*")).toBeInTheDocument();
    // expect(screen.getByText("b*")).toBeInTheDocument();
    // expect(screen.getByText("C")).toBeInTheDocument();
    // expect(screen.getByText("D")).toBeInTheDocument();
    // expect(screen.getByText("E")).toBeInTheDocument();
    // expect(screen.getByText("F")).toBeInTheDocument();
    // expect(screen.getByText("G")).toBeInTheDocument();

    // expect(screen.queryByText("A")).toBeNull();
    // expect(screen.queryByText("B")).toBeNull();
  });
});
