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

export const getTokenStyle = (row: number, animate: boolean = true) => {
  const ret: React.CSSProperties = {
    position: "absolute",

    width: "10.1%",
    maxWidth: "10.1%",
    height: "10.1%",
  };

  const animationName = `move-${row}`;

  const merge = {
    animationTimingFunction: "ease-in",
    animationIterationCount: 1,
    animationDuration: ".5s",
    animationName: animationName,
    animationFillMode: "forwards",
    zIndex: -2,
  };

  return { ...ret, ...(animate ? { ...merge } : {}) };
};
