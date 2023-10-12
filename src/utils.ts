import {
  Location,
  Locations,
  ColState,
  AdjacencyFunction,
  AdjacencyFunctionReturnType,
} from "./types";

export const testForWin: AdjacencyFunction = (col, row, color, state) => {
  const adjacencyFunctions: AdjacencyFunction[] = [
    testForTopLeftBottomRightWin,
    testForLeftRightWin,
    testForTopRightBottomLeftWin,
    testForTopDownWin,
  ];

  const ret: AdjacencyFunctionReturnType = adjacencyFunctions.reduce(
    (acc: AdjacencyFunctionReturnType, fn: AdjacencyFunction) => {
      const [win] = acc;

      if (!win) {
        return fn(col, row, color, state);
      } else {
        return acc;
      }
    },
    [false, []]
  );

  return ret;
};

export const testForTopRightBottomLeftWin = (
  col: number,
  row: number,
  color: string,
  state: ColState
): [win: boolean, pieces: Location[]] => {
  let leftBottomQuit = false;
  let rightTopQuit = false;

  let itemsLeftBottom = 0;
  let itemsRightTop = 0;
  let win = false;

  const winningSet: Locations = [];

  //down and to the left
  for (
    let i = col - 1, j = row - 1;
    i >= 0 && !leftBottomQuit && j >= 0;
    i--, j--
  ) {
    if (state[i][j] === color) {
      itemsLeftBottom++;

      winningSet.push({ col: i, row: j });

      if (itemsLeftBottom === 3) {
        win = true;
        leftBottomQuit = true;
      }
    } else {
      leftBottomQuit = true;
    }
  }

  winningSet.push({ col, row });

  //up and to the right
  for (
    let i = col + 1, j = row + 1;
    i < state.length &&
    !rightTopQuit &&
    j < state[i].length &&
    winningSet.length < 5;
    i++, j++
  ) {
    if (state[i][j] === color) {
      itemsRightTop++;

      winningSet.push({ col: i, row: j });

      if (itemsLeftBottom + itemsRightTop + 1 === 4) {
        win = true;
        rightTopQuit = true;
      }
    } else {
      rightTopQuit = true;
    }
  }

  return [win, winningSet];
};

export const testForLeftRightWin = (
  col: number,
  row: number,
  color: string,
  state: ColState
): [win: boolean, pieces: Location[]] => {
  let leftQuit = false;
  let rightQuit = false;

  let itemsLeft = 0;
  let itemsRight = 0;
  let win = false;

  const winningSet: Locations = [];

  for (let i = col - 1; i >= 0 && !leftQuit; i--) {
    if (state[i][row] === color) {
      itemsLeft++;

      winningSet.push({ col: i, row });

      if (itemsLeft === 3) {
        win = true;
        leftQuit = true;
      }
    } else {
      leftQuit = true;
    }
  }

  winningSet.push({ col, row });

  for (
    let i = col + 1;
    i < state.length && !rightQuit && winningSet.length < 5;
    i++
  ) {
    if (state[i][row] === color) {
      itemsRight++;

      winningSet.push({ col: i, row });

      if (itemsLeft + itemsRight + 1 === 4) {
        win = true;
        rightQuit = true;
      }
    } else {
      rightQuit = true;
    }
  }

  return [win, winningSet];
};

export const testForTopLeftBottomRightWin = (
  col: number,
  row: number,
  color: string,
  state: ColState
): [win: boolean, pieces: Location[]] => {
  let leftBottomQuit = false;
  let rightTopQuit = false;

  let itemsLeftBottom = 0;
  let itemsRightTop = 0;
  let win = false;

  const winningSet: Locations = [];

  //up and to the left
  for (
    let i = col - 1, j = row + 1;
    i >= 0 && !leftBottomQuit && j < state[i].length;
    i--, j++
  ) {
    if (state[i][j] === color) {
      itemsLeftBottom++;

      winningSet.push({ col: i, row: j });

      if (itemsLeftBottom === 3) {
        win = true;
        leftBottomQuit = true;
      }
    } else {
      leftBottomQuit = true;
    }
  }

  winningSet.push({ col, row });

  //down and to the right
  for (
    let i = col + 1, j = row - 1;
    i < state.length && !rightTopQuit && j >= 0 && winningSet.length < 5;
    i++, j--
  ) {
    if (state[i][j] === color) {
      itemsRightTop++;

      winningSet.push({ col: i, row: j });

      if (itemsLeftBottom + itemsRightTop + 1 === 4) {
        // to do: add these items to the winning set
        win = true;
        rightTopQuit = true;
      }
    } else {
      rightTopQuit = true;
    }
  }

  return [win, winningSet];
};

export const testForTopDownWin = (
  col: number,
  row: number,
  color: string,
  state: ColState
): [win: boolean, pieces: Location[]] => {
  let quit = false;
  let adjacentCount = 0;
  let win = false;

  const winningSet: Locations = [];

  // just look at all items in rows below
  for (let j = row - 1; !quit && j >= 0 && winningSet.length < 5; j--) {
    if (state[col][j] === color) {
      adjacentCount++;

      winningSet.push({ col, row: j });

      if (adjacentCount === 3) {
        win = true;
        quit = true;
      }
    } else {
      quit = true;
    }
  }

  winningSet.push({ col, row });

  return [win, winningSet];
};
