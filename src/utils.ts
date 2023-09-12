import { ColState } from "../src/App";

type Location = {
  col: number;
  row: number;
};

export type Locations = Location[];

export const testForWin = (
  col: number,
  row: number,
  color: string,
  state: ColState
): [win: boolean, pieces: Location[]] => {
  const [win, winningSet] = testForTopLeftBottomRightWin(
    col,
    row,
    color,
    state
  );

  if (win) {
    return [win, winningSet];
  }

  const [win2, winningSet2] = testForLeftRightWin(col, row, color, state);

  if (win2) {
    return [win2, winningSet2];
  }

  const [win3, winningSet3] = testForTopRightBottomLeftWin(
    col,
    row,
    color,
    state
  );

  if (win3) {
    return [win3, winningSet3];
  }

  const [win4, winningSet4] = testForTopDownWin(col, row, color, state);

  if (win4) {
    return [win4, winningSet4];
  }

  return [false, []];
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

  let winningSet: Locations = [];

  //down and to the left
  for (
    let i = col - 1, j = row - 1;
    i >= 0 && !leftBottomQuit && j >= 0;
    i--, j--
  ) {
    if (state[i][j] === color) {
      itemsLeftBottom++;

      winningSet.push({ col: i, row });

      if (itemsLeftBottom === 3) {
        // to do: add these items to the winning set
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
    i < state.length && !rightTopQuit && j < state[i].length;
    i++, j++
  ) {
    if (state[i][j] === color) {
      itemsRightTop++;

      winningSet.push({ col: i, row });

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
        // to do: add these items to the winning set
        win = true;
        leftQuit = true;
      }
    } else {
      leftQuit = true;
    }
  }

  winningSet.push({ col, row });

  for (let i = col + 1; i < state.length && !rightQuit; i++) {
    if (state[i][row] === color) {
      itemsRight++;

      winningSet.push({ col: i, row });

      if (itemsLeft + itemsRight + 1 === 4) {
        // to do: add these items to the winning set
        win = true;
        rightQuit = true;
      }
    } else {
      leftQuit = true;
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

      winningSet.push({ col: i, row });

      if (itemsLeftBottom === 3) {
        // to do: add these items to the winning set
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
    i < state.length && !rightTopQuit && j >= 0;
    i++, j--
  ) {
    if (state[i][j] === color) {
      itemsRightTop++;

      winningSet.push({ col: i, row });

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

  //up and to the left
  for (let j = row - 1; !quit && j >= 0; j--) {
    if (state[col][j] === color) {
      adjacentCount++;

      winningSet.push({ col, row });

      if (adjacentCount === 3) {
        // to do: add these items to the winning set
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
