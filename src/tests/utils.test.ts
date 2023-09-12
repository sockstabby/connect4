import { describe, it, expect } from "vitest";

import {
  testForTopLeftBottomRightWin,
  testForTopDownWin,
  testForTopRightBottomLeftWin,
  testForLeftRightWin,
} from "../utils";

const leftRightTestData = [
  ["red", "yellow"],
  ["red", "yellow", "red", "yellow"],
  ["yellow", "red", "yellow", "yellow"],
  ["red", "red", "yellow"],
  ["yellow", "red"],
  ["red"],
  [],
];

const topLeftBottomRight = [
  ["red", "yellow"],
  ["red", "yellow", "red", "yellow"],
  ["yellow", "red", "yellow"],
  ["red"],
  ["yellow"],
  ["red"],
  [],
];

const topDownTestData = [
  ["red", "yellow"],
  ["red", "yellow", "red", "yellow"],
  ["yellow", "red", "yellow"],
  ["red", "red", "red"],
  ["yellow", "yellow", "yellow"],
  ["red", "red", "yellow"],
  [],
];

const bottomLeftTopRightData = [
  ["red", "yellow"],
  ["red", "yellow", "red", "yellow"],
  ["yellow", "red", "yellow"],
  ["red", "red", "red", "red", "yellow"],
  ["yellow", "yellow", "yellow"],
  ["red", "red", "yellow"],
  [],
];

const leftRightTestData2 = [
  [],
  [],
  [],
  ["yellow", "red", "red"],
  ["yellow", "red"],
  ["red"],
  ["yellow"],
];

describe("utils", () => {
  it("testLeftRight", () => {
    const [win, _winningSet] = testForLeftRightWin(
      2,
      0,
      "yellow",
      leftRightTestData2
    );

    expect(win).toEqual(false);
  });

  it("testForTopLeftBottomRightWin", () => {
    const [win, _winningSet] = testForTopLeftBottomRightWin(
      3,
      1,
      "yellow",
      topLeftBottomRight
    );

    expect(win).toEqual(true);
  });

  it("testForTopDownWin", () => {
    const [win, _winningSet] = testForTopDownWin(3, 3, "red", topDownTestData);

    expect(win).toEqual(true);
  });

  it("testForTopRightBottomLeftWin", () => {
    const [win, _winningSet] = testForTopRightBottomLeftWin(
      4,
      3,
      "red",
      bottomLeftTopRightData
    );

    expect(win).toEqual(true);
  });

  it("testForTopRightBottomLeftWin", () => {
    const [win, _winningSet] = testForLeftRightWin(
      5,
      1,
      "red",
      leftRightTestData
    );

    expect(win).toEqual(true);
  });
});
