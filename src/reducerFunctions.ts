import { GameState } from "./App";
import { testForWin } from "./utils";

export const terminateGame = (state: GameState, notifyRemote: boolean) => {
  console.log("terminating game");
  // setWinner(null);
  //   stateRef.current.winner = null;
  //   stateRef.current.gameStarted = false;
  //   toggleRender();

  if (state.websocket != null) {
    // tell the other player that we quit

    if (notifyRemote) {
      const payload = {
        service: "chat",
        action: "playTurn",
        data: {
          turn: -1,
          opponent: state.opponent,
        },
      };
      state.websocket!.send(JSON.stringify(payload));
    }

    state.websocket.close();
  }

  return { ...state, winner: null, gameStarted: false };
};
const sendMove = (state: GameState, col: number) => {
  const payload = {
    service: "chat",
    action: "playTurn",
    data: {
      turn: { col },
      opponent: state.opponent,
    },
  };

  state.websocket!.send(JSON.stringify(payload));
};

export const getRemoteColor = (state: GameState) => {
  if (state.initiator) {
    return state.initiatorColor === "red" ? "yellow" : "red";
  }

  // i am not the initiator and we know the initiator color
  return state.initiatorColor;
};

export function setWinnerHelper(
  state: GameState,
  player: string,
  draw: boolean
) {
  //   const winCounts =
  //     player === "yellow"
  //       ? { yellowWins: state.yellowWins + 1 }
  //       : { redWins: state.redWins + 1 };

  const copy = JSON.parse(JSON.stringify(state.colState));

  //   stateRef.current = {
  //     ...stateRef.current,
  //     ...{ colState: [[], [], [], [], [], [], []], plays: 0 },
  //   };

  clearInterval(state.timerRef);
  //   state.timerRef = undefined;

  //   state.winnerGameState = copy;

  console.log("we have a winner", player);

  return {
    ...state,
    ...(player === "yellow" && !draw
      ? { yellowWins: state.yellowWins + 1 }
      : {}),
    ...(player === "red" && !draw ? { redWins: state.redWins + 1 } : {}),

    colState: [[], [], [], [], [], [], []],
    plays: 0,
    winnerGameState: copy,
    timerRef: undefined,
  };
}

export const getLocalColor = (state: GameState) => {
  if (state.initiator) {
    return state.initiatorColor;
  }

  return state.initiatorColor === "red" ? "yellow" : "red";
};

export function diskDropped(
  state: GameState,
  col: number,
  remote: boolean = false,
  gameTimerConfig: number
): GameState {
  // if (stateRef.current.colState[col].length === 6) {
  //   return;
  // }

  if (state.colState[col].length === 6) {
    return state;
  }
  //creates the animation of the piece
  let player;
  if (state.mode === "online") {
    player = remote === true ? getRemoteColor(state) : getLocalColor(state);
  } else {
    if (state.initiatorColor === "yellow") {
      player = state.plays % 2 === 0 ? "yellow" : "red";
    } else {
      player = state.plays % 2 === 0 ? "red" : "yellow";
    }
  }

  //   stateRef.current = {
  //     ...stateRef.current,
  //     plays: stateRef.current.plays + 1,
  //   };

  //   if (stateRef.current.plays === 42) {
  //     stateRef.current.draw = true;
  //   }

  const [win, winningSet] = testForWin(
    col,
    //stateRef.current.colState[col].length,
    state.colState[col].length,
    player,
    //stateRef.current.colState
    state.colState
  );

  //   if (!win) {
  //     stateRef.current = {
  //       ...stateRef.current,
  //       timerSeconds: gameTimerConfig,
  //       ...{ animatedPiece: col, animatedPieceColor: player },
  //     };

  //     // setLastDroppedColumn(col);
  //   }

  if (!remote) {
    if (state.mode === "online") {
      sendMove(state, col);
    }
  }

  let newState = {};
  if (win || state.plays + 1 === 42) {
    newState = setWinnerHelper(state, player, state.plays + 1 === 42);
    // stateRef.current.winner = { player, pieces: winningSet };
    // toggleRender();
  }

  return {
    ...state,
    ...newState,
    draw: state.plays + 1 === 42,
    // plays: state.plays + 1,
    ...(!win ? { plays: state.plays + 1 } : {}),
    ...(win ? { plays: 0 } : {}),
    ...(win ? { winner: { player, pieces: winningSet } } : {}),
    ...(!win && state.plays + 1 !== 42
      ? {
          timerSeconds: gameTimerConfig,
          lastDroppedColumn: col,
          animatedPiece: col,
          animatedPieceColor: player,
        }
      : {}),
  };
}

export const getTokenStyle = (state: GameState, col: number, row: number) => {
  const breakPoints = [
    {
      upper: 440,
      lower: -Infinity,
      top_positions: [
        "calc(40px + 69vmin)",
        "calc(40px + 55.7vmin)",
        "calc(40px + 42.5vmin)",
        "calc(40px + 29.3vmin)",
        "calc(40px + 16.3vmin)",
        "calc(40px + 2.7vmin)",
      ],
      left_positions: [
        "calc(3.04vmin)",
        "calc(16.23vmin)",
        "calc(29.5vmin)",
        "calc(42.75vmin)",
        "calc(56vmin)",
        "calc(69.2vmin)",
        "calc(82.5vmin)",
      ],
    },
    {
      upper: 526,
      lower: 440,
      top_positions: [
        "calc(40px + 65.3vmin)",
        "calc(40px + 52.9vmin)",
        "calc(40px + 40.5vmin)",
        "calc(40px + 27.9vmin)",
        "calc(40px + 15.3vmin)",
        "calc(40px + 2.57vmin)",
      ],
      left_positions: [
        "calc(2.9vmin)",
        "calc(15.4vmin)",
        "calc(27.95vmin)",
        "calc(40.5vmin)",
        "calc(53.08vmin)",
        "calc(65.6vmin)",
        "calc(78.1vmin)",
      ],
    },
    {
      upper: 640,
      lower: 526,
      top_positions: [
        "calc(40px + 58.0vmin)",
        "calc(40px + 46.9vmin)",
        "calc(40px + 35.7vmin)",
        "calc(40px + 24.7vmin)",
        "calc(40px + 13.6vmin)",
        "calc(40px + 2.4vmin)",
      ],
      left_positions: [
        "calc(2.55vmin)",
        "calc(13.7vmin)",
        "calc(24.85vmin)",
        "calc(36vmin)",
        "calc(47.15vmin)",
        "calc(58.3vmin)",
        "calc(69.4vmin)",
      ],
    },
    {
      upper: 707,
      lower: 640,
      top_positions: [
        "calc(40px + 50.95vmin)",
        "calc(40px + 41.2vmin)",
        "calc(40px + 31.5vmin)",
        "calc(40px + 21.7vmin)",
        "calc(40px + 11.86vmin)",
        "calc(40px + 2.3vmin)",
      ],
      left_positions: [
        "calc(2.23vmin)",
        "calc(12vmin)",
        "calc(21.75vmin)",
        "calc(31.5vmin)",
        "calc(41.25vmin)",
        "calc(51vmin)",
        "calc(60.75vmin)",
      ],
    },
    {
      upper: +Infinity,
      lower: 707,
      top_positions: [
        "calc(40px + 44.99vmin)",
        "calc(40px + 36.27vmin)",
        "calc(40px + 27.65vmin)",
        "calc(40px + 18.99vmin)",
        "calc(40px + 10.38vmin)",
        "calc(40px + 1.75vmin)",
      ],
      left_positions: [
        "calc(2.02vmin)",
        "calc(10.65vmin)",
        "calc(19.28vmin)",
        "calc(27.90vmin)",
        "calc(36.52vmin)",
        "calc(45.15vmin)",
        "calc(53.78vmin)",
      ],
    },
  ];

  const breakPoint = breakPoints.find(
    (i) => window.innerWidth <= i.upper && window.innerWidth > i.lower
  );

  const topPos = breakPoint!.top_positions[row];
  const leftPos = breakPoint!.left_positions[col];

  const ret: React.CSSProperties = {
    position: "absolute",

    width: "10%",
    maxWidth: "10%",
    height: "10%",
    left: leftPos,
    top: topPos,
  };

  if (row === 6) {
    const animationName = `move-${state.colState[col].length}`;

    const merge = {
      animationIterationCount: 1,
      animationDuration: "0.1s",
      animationName: animationName,
      animationFillMode: "forwards",
      // animationTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275);",
      zIndex: -2,
    };

    return { ...ret, ...merge };
  }

  return ret;
};
