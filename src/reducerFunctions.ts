import { GameState, AnimatedDisk } from "./App";
import { testForWin } from "./utils";
import { GameMode } from "./StartGameModal";
import { Locations } from "./utils";

export type GameActions =
  | {
      type: "startGame";
      value: {
        initiator: boolean;
        opponent: string;
        mode: GameMode;
        player1: string;
        player2: string;
        websocket?: WebSocket;
      };
    }
  | {
      type: "diskDropped";
      value: { col: number; remote: boolean; gameTimerConfig: number };
    }
  | { type: "decrementSeconds" }
  | { type: "setWinner"; value: { player: string; pieces: Locations } }
  | { type: "terminateGame"; value: { notifyRemote: boolean } }
  | { type: "socketClosed" }
  | { type: "messageReceived"; value: any }
  | { type: "setAnimatedDisk" }
  | { type: "clearAnimatedDisk" }
  | { type: "mainMenuModalVisible"; value: boolean }
  | { type: "playAgain" }
  | { type: "restartGame" }
  | { type: "listenerAdded"; value: boolean }
  | { type: "remoteDisconnected"; value: boolean }
  | { type: "setWebsocket"; value: WebSocket };

export function mainReducer(state: GameState, action: GameActions) {
  if (action.type === "startGame") {
    const { initiator, opponent, mode, player1, player2, websocket } =
      action.value;

    return {
      ...state,
      ...{
        colState: [[], [], [], [], [], [], []],
        yellowWins: 0,
        redWins: 0,
        initiator,
        mainMenuOpen: false,
        mode,
        player1,
        player2,
        gameStarted: true,
        opponent,
        remoteDisconnected: false,
        websocket,
        animatedDisks: [],
      },
    };
  } else if (action.type === "diskDropped") {
    const { col, remote, gameTimerConfig } = action.value;
    return diskDropped(state, col, remote, gameTimerConfig);
  } else if (action.type === "decrementSeconds") {
    return {
      ...state,
      ...(state.timerSeconds !== null
        ? { timerSeconds: state.timerSeconds - 1 }
        : {}),
    };
  } else if (action.type === "setWinner") {
    const { player, pieces } = action.value;

    if (state.timerRef != null) {
      console.log("clearing timer");

      clearInterval(state.timerRef);
    }

    const newState = setWinnerHelper(state, player, false);

    return {
      ...state,
      ...newState,
      winner: { pieces, player },
      timerRef: undefined,
      timerSeconds: null,
    };
  } else if (action.type === "terminateGame") {
    const { notifyRemote } = action.value;

    return terminateGame(state, notifyRemote);
  } else if (action.type === "socketClosed") {
    return { ...state, websocket: undefined };
  } else if (action.type === "messageReceived") {
    const { payload, gameTimerConfig } = action.value;
    console.log("client received message", payload);
    if (payload.message === "playTurn") {
      if (payload.data.turn === -1) {
        const newState = terminateGame(state, false);
        return { ...newState, remoteDisconnected: true };
      } else {
        const x = document.getElementById("drop-sound") as HTMLAudioElement;
        x?.play();
        return diskDropped(state, payload.data.turn.col, true, gameTimerConfig);
      }
    }
    return state;
  } else if (action.type === "setAnimatedDisk") {
    const colState = JSON.parse(JSON.stringify(state.colState));
    if (state.animatedPiece != null) {
      colState[state.animatedPiece].push(state.animatedPieceColor);
    }
    return { ...state, colState };
  } else if (action.type === "clearAnimatedDisk") {
    return { ...state, animatedPiece: null, lastDroppedColumn: null };
  } else if (action.type === "mainMenuModalVisible") {
    const visible = action.value;
    return { ...state, mainMenuOpen: visible };
  } else if (action.type === "playAgain") {
    return {
      ...state,
      ...{
        initiator: !state.initiator,
        plays: state.plays !== 1 ? 0 : state.plays,
        mainMenuOpen: false,
        draw: false,
        initiatorColor: state.initiatorColor === "red" ? "yellow" : "red",
        winner: null,
      },
    };
  } else if (action.type === "restartGame") {
    return {
      ...state,
      ...{
        plays: 0,
        colState: [[], [], [], [], [], [], []],
      },
    };
  } else if (action.type === "setWebsocket") {
    const websocket = action.value;
    return { ...state, websocket };
  } else if (action.type === "listenerAdded") {
    const listenerAdded = action.value;
    return { ...state, listenerAdded };
  } else if (action.type === "remoteDisconnected") {
    const remoteDisconnected = action.value;
    return { ...state, remoteDisconnected };
  }

  return state;
}

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
  // the reason we make a copy here is because a new game could be started by the opponent. When
  // theres a winner we want the players to be able to reflect on how they lost. So at this time,
  // the state of the board is a copy of the board whenever somebody won or there was a draw.
  // New plays go on in the cleared orignal colState and we dont flip over to that state until the user
  // presses Play Again.

  const copy = JSON.parse(JSON.stringify(state.animatedDisks));

  clearInterval(state.timerRef);

  return {
    ...state,
    ...(player === "yellow" && !draw
      ? { yellowWins: state.yellowWins + 1 }
      : {}),
    ...(player === "red" && !draw ? { redWins: state.redWins + 1 } : {}),

    colState: [[], [], [], [], [], [], []],
    plays: 0,
    animatedDisksCopy: copy,
    animatedDisks: [],
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

  const [win, winningSet] = testForWin(
    col,
    state.colState[col].length,
    player,
    state.colState
  );

  if (!remote) {
    if (state.mode === "online") {
      sendMove(state, col);
    }
  }

  const row = state.colState[col].length;
  const newDisk: AnimatedDisk = { row, col, color: player };

  let newState = {};
  if (win || state.plays + 1 === 42) {
    newState = setWinnerHelper(
      { ...state, animatedDisks: [...state.animatedDisks, newDisk] },
      player,
      state.plays + 1 === 42
    );
  }

  const copy = JSON.parse(JSON.stringify(state.colState));

  copy[col].push(player);

  setTimeout(() => {
    const x = document.getElementById("drop-sound") as HTMLAudioElement;

    if (x != null) {
      x?.play();
    }
  }, 1200);

  return {
    ...state,
    ...newState,
    draw: state.plays + 1 === 42,
    colState: copy,
    ...(win ? { colState: [[], [], [], [], [], [], []] } : {}),
    ...(!win ? { animatedDisks: [...state.animatedDisks, newDisk] } : {}),
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

export const getTokenStyle = (
  state: GameState,
  col: number,
  row: number,
  animate: boolean = true
) => {
  const breakPoints = [
    {
      upper: 440,
      lower: -Infinity,
      heightUpper: 1023,
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
        "calc(29.4vmin)",
        "calc(42.48vmin)",
        "calc(55.6vmin)",
        "calc(68.7vmin)",
        "calc(81.9vmin)",
      ],
    },
    {
      upper: 526,
      lower: 440,
      heightUpper: 1023,
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
      heightUpper: 1023,
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
      heightUpper: 1023,
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
      heightUpper: 1023,
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
    {
      name: "ipad air",
      upper: +Infinity,
      lower: 767,
      heightUpper: +Infinity,
      top_positions: [
        "calc(40px + 59.5vmin)",
        "calc(40px + 48vmin)",
        "calc(40px + 36.7vmin)",
        "calc(40px + 25.4vmin)",
        "calc(40px + 13.9vmin)",
        "calc(40px + 2.8vmin)",
      ],
      left_positions: [
        "calc(2.7vmin)",
        "calc(14vmin)",
        "calc(25.4vmin)",
        "calc(36.8vmin)",
        "calc(48.2vmin)",
        "calc(59.55vmin)",
        "calc(70.9vmin)",
      ],
    },
  ];

  const breakPoint = breakPoints.find(
    (i) =>
      window.innerWidth <= i.upper &&
      window.innerWidth > i.lower &&
      window.innerHeight <= i.heightUpper
  );

  if (breakPoint!.name) {
    console.log("Chosen breakpoint = ", breakPoint!.name);
  }

  const topPos = breakPoint!.top_positions[row];
  const leftPos = breakPoint!.left_positions[col];

  const ret: React.CSSProperties = {
    position: "absolute",

    width: "10.1%",
    maxWidth: "10.1%",
    height: "10%",
    left: leftPos,
    top: topPos,
  };

  console.log(`move-${state.colState[col].length}`);

  //   if (row === 6) {
  const animationName = `move-${row}`;

  // const animationName = "move-0";

  const merge = {
    animationTimingFunction: "linear",
    animationIterationCount: 1,
    animationDuration: "2s",
    animationName: animationName,
    animationFillMode: "forwards",
    zIndex: -2,
  };

  return { ...ret, ...(animate ? { ...merge } : {}) };
};
