import { describe, it, expect } from "vitest";

import { useCounter } from "./useCounter";

type IconTypes = "warning" | "check";
type IconColors = "red" | "green";

type Statuses = "failed" | "complete";

type Icon = {
  iconType: IconTypes;
  iconColor: IconColors;
};

type Icons = Record<Statuses, Icon>;

// type Salary = Record<"annual" | "bonus", number>;
// const s: Salary = { annual: 3000, bonus: 234 };
//const salary1: Salary = { annual: 56000 }; // Type error!

const icons: Icons = {
  failed: {
    iconType: "warning",
    iconColor: "red",
  },
  complete: {
    iconType: "check",
    iconColor: "green",
  },
};

const inline = (
  status: "failed" | "complete"
): {
  iconType: IconTypes;
  iconColor: IconColors;
} => icons[status];

const getIcon = (status: Statuses, i: Icons): Icon => i[status];

let i = getIcon("failed", icons);

let status = "complete";
//const getIcon = ({ status }) => Icons {...icons[status]};

// = {
//   failed: {
//     iconType: "warning",
//     iconColor: "red"
//   },
//   complete: {
//     iconType: "check",
//     iconColor: "green"
//   };

describe("something truthy and falsy", () => {
  it("true to be true", () => {
    expect(true).toBe(true);
  });

  it("false to be false", () => {
    expect(false).toBe(false);
  });
});
