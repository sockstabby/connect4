import { GameState, Disk, GameActions } from "./types";
import { testForWin } from "./utils";

const FIRST_ROW_DROP_MS = 500;

const DRAW_COUNT = 42;

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
        disks: [],
      },
    };
  } else if (action.type === "diskDropped") {
    const { col, remote, gameTimerConfig } = action.value;
    return diskDropped(state, col, remote, gameTimerConfig);
  } else if (action.type === "decrementSeconds") {
    return {
      ...state,
      ...(state.timerSeconds != null
        ? { timerSeconds: state.timerSeconds - 1 }
        : {}),
    };
  } else if (action.type === "setWinner") {
    const { player, pieces } = action.value;
    if (state.timerRef != null) {
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
    return { ...state, websocket: undefined, listenerAdded: false };
  } else if (action.type === "messageReceived") {
    const { payload, gameTimerConfig } = action.value;
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
  } else if (action.type === "setDisk") {
    const colState = JSON.parse(JSON.stringify(state.colState));
    if (state.animatedPiece != null) {
      colState[state.animatedPiece].push(state.animatedPieceColor);
    }
    return { ...state, colState };
  } else if (action.type === "rulesOpen") {
    const rulesOpen = action.value;
    return { ...state, rulesOpen, mainMenuOpen: false };
  } else if (action.type === "clearDisk") {
    return { ...state, animatedPiece: null, lastDroppedColumn: null };
  } else if (action.type === "mainMenuModalVisible") {
    //when we open this model lets make sure that we close the socket
    if (state.websocket != null) {
      state.websocket.close();
    }

    const visible = action.value;
    return {
      ...state,
      mainMenuOpen: visible,
      websocket: undefined,
      listenerAdded: false,
    };
  } else if (action.type === "playAgain") {
    return {
      ...state,
      ...{
        initiator: !state.initiator,
        // if there was a play then preserve it
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
        disks: [],
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
  } else if (action.type === "selectMenuItem") {
    const bottomMenuSelection = action.value;
    return { ...state, bottomMenuSelection };
  }

  return state;
}

export const terminateGame = (state: GameState, notifyRemote: boolean) => {
  if (state.websocket != null) {
    // tell the other player that we are quitting

    if (notifyRemote) {
      const payload = {
        service: "connect4",
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

  return {
    ...state,
    winner: null,
    draw: false,
    listenerAdded: false,
    gameStarted: false,
  };
};
const sendMove = (state: GameState, col: number) => {
  const payload = {
    service: "connect4",
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
  // We switch to the real copy as soon as the user presses play again.

  const copy = JSON.parse(JSON.stringify(state.disks));

  clearInterval(state.timerRef);

  const audio = document.getElementById("winning-sound") as HTMLAudioElement;
  if (audio != null) {
    audio?.play();
  }

  return {
    ...state,
    ...(player === "yellow" && !draw
      ? { yellowWins: state.yellowWins + 1 }
      : {}),
    ...(player === "red" && !draw ? { redWins: state.redWins + 1 } : {}),

    colState: [[], [], [], [], [], [], []],
    plays: 0,
    disksCopy: copy,
    disks: [],
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
  const newDisk: Disk = { row, col, color: player };

  const tempDraw = state.plays + 1 === DRAW_COUNT;

  let newState = {};
  if (win || tempDraw) {
    newState = setWinnerHelper(
      { ...state, disks: [...state.disks, newDisk] },
      player,
      tempDraw
    );
  }

  const copy = JSON.parse(JSON.stringify(state.colState));
  copy[col].push(player);

  // here we try to match the sound to the disk drop animation
  const timeForCurrentRow = (FIRST_ROW_DROP_MS * (5 - row)) / 5 - 100;
  const volumeForCurrentRow = ((1000 * (5 - row)) / 5) * 0.001;

  setTimeout(() => {
    const audio = document.getElementById("drop-sound") as HTMLAudioElement;
    if (audio != null) {
      audio.volume = Math.max(volumeForCurrentRow, 0.3);
      audio?.play();
    }
  }, timeForCurrentRow);

  //when state.draw === true the only way it can be set to false is when user presses play again
  let draw = state.draw;
  if (state.draw === false) {
    draw = tempDraw;
  }

  return {
    ...state,
    ...newState,
    draw,
    colState: copy,
    ...(win || tempDraw ? { colState: [[], [], [], [], [], [], []] } : {}),
    ...(!win && !tempDraw ? { disks: [...state.disks, newDisk] } : {}),
    ...(!win && !tempDraw ? { plays: state.plays + 1 } : {}),
    ...(win || tempDraw ? { plays: 0 } : {}),
    ...(win ? { winner: { player, pieces: winningSet } } : {}),
    lastDroppedColumn: col,
    ...(!win && !tempDraw
      ? {
          timerSeconds: gameTimerConfig,
          animatedPiece: col,
          animatedPieceColor: player,
        }
      : {}),
  };
}
