import { describe, it, expect, vi } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";

import App from "../App";
import { useCounter } from "../useCounter";

global.fetch = vi.fn();

function createFetchResponse(data) {
  return { json: () => new Promise((resolve) => resolve(data)) };
}

describe("App", () => {
  it("should increment the count", () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
  it("should decrement the count", () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(-1);
  });

  it("renders headline", () => {
    const todoListResponse = [
      {
        title: "Unit test",
        done: false,
      },
    ];
    const token = "token";

    // @ts-ignore
    fetch.mockResolvedValue(createFetchResponse(todoListResponse));

    render(<App title="React" />);

    screen.debug();

    // check if App components renders headline
  });
});

const func = (height: number, width: number) => {
  console.log("hello");
};

describe("something truthy and falsy", () => {
  it("true to be true", () => {
    expect(true).toBe(true);
  });

  it("false to be false", () => {
    expect(false).toBe(false);
  });
});
