import { describe, it, expect } from "vitest";

import { useCounter } from "./useCounter";

type IconTypes = "warning" | "check";
type IconColors = "red" | "green";

type Statuses = "failed" | "complete";

type Icon = {
  iconType: IconTypes;
  iconColor: IconColors;
};


const Widget: React.FC<

function getArray<T>(items: T[]): T[] {
  return new Array<T>().concat(items);
}

interface Mine<T> {
  name: T;
}

type Icons = Record<Statuses, Icon>;

type Yo = Record<Statuses, IconColors>;

type Whateva<T> = {
  yeah: T;
};

let item: Mine<number> = { name: 34 };

let myNumArr = getArray<number>([100, 200, 300]);

let myNumArr2 = getArray([item, item]);

console.log(myNumArr2);

myNumArr2.name = "asdf";

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
