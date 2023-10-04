import "./App.css";

import Board from "../src/assets/connect4-board-top-layer.svg";
import BlackBoard from "../src/assets/connect4-board-back-layer.svg";
import OrangePiece from "../src/assets/orange-piece.svg";
import YellowPiece from "../src/assets/yellow-piece.svg";
import YellowWinningPiece from "../src/assets/yellow-winning-piece.svg";
import RedWinningPiece from "../src/assets/red-winning-piece.svg";
import Player1 from "../src/assets/player1.svg";
import Player2 from "../src/assets/player2.svg";
import GameLogo from "../src/assets/game-logo.svg";
import { Locations } from "./utils";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import StartGameModal, { GameMode } from "./StartGameModal";
import useScreenSize from "./useScreenResize";
import ReactModal from "react-modal";

import {
  diskDropped,
  getLocalColor,
  getRemoteColor,
  setWinnerHelper,
  terminateGame,
  getTokenStyle,
} from "./reducerFunctions";

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

export type GameState = {
  colState: ColState;
  yellowWins: number;
  redWins: number;
  initiator: boolean;
  initiatorColor: string;
  plays: number;
  animatedPiece: number | null;
  animatedPieceColor: string | null;
  // this nees to be here because of useKeyBoard hook.
  mainMenuOpen: boolean;
  mode: GameMode;
  draw: boolean;
  player1: string;
  player2: string;
  gameStarted: boolean;
  opponent: string;
  remoteDisconnected: boolean;
  timerRef: NodeJS.Timer | undefined;
  timerSeconds: number | null;
  forceRender: boolean;
  websocket: WebSocket | undefined;
  winner: Winner | null;
  winnerGameState: ColState | null;
  lastDroppedColumn: null | number;
  listenerAdded: boolean;
};

type Action =
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
  | { type: "setWebsocket"; value: WebSocket };

function reducer(state: GameState, action: Action) {
  console.log("Reducer called ", action.type);
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
        // stateRef.current.remoteDisconnected = true;
        const newState = terminateGame(state, false);
        return { ...newState, remoteDisconnected: true };
      } else {
        const x = document.getElementById("drop-sound") as HTMLAudioElement;
        x?.play();
        // animateRow(payload.data.turn.col, true);

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
        // colState: [[], [], [], [], [], [], []],
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
    const added = action.value;
    return { ...state, listenerAdded: added };
  }

  return state;
}

// For this app we store state in a ref. This drastically simplifies our useEffect dependencies
// as they dont need to care so much about dependencies. Just note that you are responsible
// for rendering and can trigger a render with toggleRender function.
const initialGameState: GameState = {
  colState: [[], [], [], [], [], [], []],
  yellowWins: 0,
  redWins: 0,
  initiator: false,
  initiatorColor: "red",
  plays: 0,
  animatedPiece: null,
  animatedPieceColor: null,
  // this nees to be here because of useKeyBoard hook. For toggling the pause modal
  mainMenuOpen: false,
  mode: "local",
  draw: false,
  player1: "Player 1",
  player2: "Player 2",
  gameStarted: false,
  opponent: "",
  remoteDisconnected: false,
  timerRef: undefined,
  timerSeconds: null,
  forceRender: false,
  websocket: undefined,
  winner: null,
  winnerGameState: null,
  lastDroppedColumn: null,
  listenerAdded: false,
};

type Connect4Props = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
export const App = ({
  gameTimerConfig = 24,
  websocketUrl = "wss://connect4.isomarkets.com",
}: Connect4Props) => {
  // stateRef is intended to store refs in one single ref.

  const [state, dispatch] = useReducer(reducer, initialGameState);

  const stateRef = useRef(initialGameState);

  // this is a hack. if we ever need to set a reference and trigger a rerender we can
  // call this function. Only needed because i chose to use references instead of setState
  // hooks to store state.

  const [, setForceRender] = useState(false);

  useEffect(() => {
    ReactModal.setAppElement("body");
  }, []);

  const toggleRender = useCallback(() => {
    stateRef.current.forceRender = !stateRef.current.forceRender;
    setForceRender(stateRef.current.forceRender);
  }, []);

  useEffect(() => {
    const decSeconds = () => {
      if (state.timerSeconds != null && state.timerSeconds != -1) {
        console.log("decseconds", state.timerSeconds);
        // --stateRef.current.timerSeconds;
        dispatch({ type: "decrementSeconds" });
        // toggleRender();
      }
    };

    if (state.timerRef == null && state.plays > 1) {
      console.log("createing interval timer");
      state.timerRef = setInterval(decSeconds, 1000);
    }
  }, [toggleRender, state]);

  const getCurrentTurn = useCallback(() => {
    const getCurrentTurnWrapped: () => [boolean, string] = function (): [
      boolean,
      string
    ] {
      let myTurn = false;

      if (state.initiator) {
        myTurn = state.plays % 2 === 0;
      } else {
        myTurn = state.plays % 2 !== 0;
      }

      let playerTurn;

      if (myTurn) {
        playerTurn = getLocalColor(state);
      } else {
        playerTurn = getRemoteColor(state);
      }
      return [myTurn, playerTurn];
    };

    return getCurrentTurnWrapped();
  }, [state]);

  useEffect(() => {
    if (state.timerSeconds === 0) {
      console.log("setting winner");
      clearInterval(state.timerRef);
      // state.timerRef = undefined;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_myTurn, playerTurn] = getCurrentTurn();

      // setWinnerHelper(state, playerTurn === "yellow" ? "red" : "yellow");

      dispatch({
        type: "setWinner",
        value: {
          player: playerTurn === "yellow" ? "red" : "yellow",
          pieces: [],
        },
      });

      // setWinner({
      //   player: playerTurn === "yellow" ? "red" : "yellow",
      //   pieces: [],
      // });
    }
  }, [state.timerSeconds, getCurrentTurn, state.timerRef]);

  const terminateGame = useCallback((notifyRemote = true) => {
    dispatch({ type: "terminateGame", value: { notifyRemote } });
  }, []);

  const animateRow = useCallback(
    (col: number, remote: boolean = false) => {
      dispatch({
        type: "diskDropped",
        value: { col, remote, gameTimerConfig },
      });
    },
    [gameTimerConfig]
  );

  useEffect(() => {
    function closeHandler() {
      console.error("The Websocket is closed.");
      // we need to tell the user what to do when this happens
      dispatch({ type: "socketClosed" });
    }

    function messageHandler(event: MessageEvent<any>) {
      const payload = JSON.parse(event.data);

      dispatch({
        type: "messageReceived",
        value: { payload, gameTimerConfig },
      });
    }

    if (state.websocket != null && !state.listenerAdded) {
      console.log("adding event listener");
      state.websocket!.addEventListener("close", closeHandler);
      state.websocket!.addEventListener("message", messageHandler);
      dispatch({ type: "listenerAdded", value: true });
    }

    return () => {
      if (state.websocket != null) {
        state.websocket!.removeEventListener("close", closeHandler);
        state.websocket!.removeEventListener("message", closeHandler);
      }
    };
  }, [state, terminateGame, animateRow, gameTimerConfig]);

  useScreenSize();

  useEffect(() => {
    if (state.animatedPiece !== null) {
      const x = document.getElementById("drop-sound") as HTMLAudioElement;

      if (x != null) {
        x?.play();
      }

      dispatch({ type: "setAnimatedDisk" });

      setTimeout(() => {
        dispatch({ type: "clearAnimatedDisk" });
      }, 100);
    }
  }, [state.lastDroppedColumn, state.animatedPiece]);

  const openMainMenuModal = () => {
    dispatch({ type: "mainMenuModalVisible", value: true });
  };

  const closeMainMenuModal = () => {
    dispatch({ type: "mainMenuModalVisible", value: true });
  };

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    websocket?: WebSocket
  ) => {
    console.log("start game");
    console.log("initiator", initiator);
    console.log("mode", mode);
    console.log("player1", player1);
    console.log("player2", player2);

    dispatch({
      type: "startGame",
      value: { initiator, opponent, mode, player1, player2, websocket },
    });
  };

  const playAgain = () => {
    console.log("play again");

    dispatch({ type: "playAgain" });
  };

  const restartGame = () => {
    dispatch({ type: "restartGame" });
  };

  const tokens: any = [];
  const colState =
    state.winner != null ? state.winnerGameState : state.colState;

  colState!.forEach((column: string[], i: number) => {
    column.forEach((row: string, j) => {
      const style = getTokenStyle(state, i, j);
      if (row === "red") {
        tokens.push(
          <div key={`token${i}${j}orange`} style={style}>
            <img src={OrangePiece} alt="" />
          </div>
        );
      } else {
        tokens.push(
          <div key={`token${i}${j}yellow`} style={style}>
            <img src={YellowPiece} alt="" />
          </div>
        );
      }
    });
  });

  let winningPieces: any = [];

  if (state.winner != null) {
    winningPieces = state.winner.pieces.map((piece) => {
      const style = getTokenStyle(state, piece.col, piece.row);
      const image =
        state.winner!.player === "red" ? RedWinningPiece : YellowWinningPiece;

      return (
        <div key={`winningtoken${piece.col}${piece.row}orange`} style={style}>
          <img src={image} alt="" />
        </div>
      );
    });
  }

  const [myTurn, playerTurn] = getCurrentTurn();

  console.log("myTurn", myTurn);
  // console.log("mode", mode);
  // console.log("plays", stateRef.current.plays);
  // console.log(stateRef.current.colState);
  // console.log("modal open = ", stateRef.current.mainMenuOpen);
  // console.log("forceRender", forceRender);

  return (
    <>
      version 0.1
      <div className="nav-bar flex flex-row justify-around pt-3 items-center">
        <button onClick={openMainMenuModal}>Menu</button>

        <img src={GameLogo} alt=""></img>

        <button onClick={restartGame} disabled={state.mode === "online"}>
          Restart
        </button>
      </div>
      <ReactModal
        className="modal centered"
        isOpen={state.mainMenuOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          closeMainMenuModal();
        }}
        overlayClassName="disabled-background"
      >
        <StartGameModal
          websocketUrl={websocketUrl}
          onStartGame={startGame}
          setSocket={(socket: WebSocket) => {
            dispatch({ type: "setWebsocket", value: socket });
          }}
          onClose={() => {
            dispatch({ type: "mainMenuModalVisible", value: false });
          }}
        />
      </ReactModal>
      <div className="flex flex-col">
        <div className="player-card-small-container flex flex-row justify-center gap-4">
          <div className="player-card-small flex flex-row justify-around items-center">
            <div className="flex flex-row pb-1 justify-center  smiley-container smiley-container-red">
              <img src={Player1} alt="Player One Smiley Face" />
            </div>

            <div className="flex flex-row justify-center font-bold text-lg uppercase">
              {state.player1}
            </div>

            <div
              data-testid="red-win-count-small"
              className="win-count flex flex-row justify-center uppercase font-bold"
            >
              {state.redWins}
            </div>
          </div>

          <div className="player-card-small flex flex-row justify-around items-center">
            <div
              data-testid="yellow-win-count-small"
              className="win-count flex flex-row justify-center uppercase font-bold"
            >
              {state.yellowWins}
            </div>
            <div className="flex flex-row justify-center font-bold text-lg uppercase">
              {state.player2}
            </div>

            <div className="flex flex-row pb-1 justify-center -mr-12 smiley-container smiley-container-yellow">
              <img src={Player2} alt="Player Two Smiley Face" />
            </div>
          </div>
        </div>
        <div className="game-board-items">
          {state.gameStarted && (
            <div className="player1-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player1} alt="Player One Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {state.player1}
              </div>

              <div
                data-testid="red-win-count"
                className="flex flex-row justify-center uppercase text-6xl font-bold pb-3"
              >
                {state.redWins}
              </div>
            </div>
          )}

          <div className="game-board-container">
            {(myTurn || state.mode === "local") &&
              state.winner == null &&
              state.gameStarted && (
                <div className="dropzone flex flex-row w-full justify-between">
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-0"
                    onClick={() => animateRow(0)}
                  ></div>

                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-1"
                    onClick={() => animateRow(1)}
                  ></div>
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-2"
                    onClick={() => animateRow(2)}
                  ></div>
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-3"
                    onClick={() => animateRow(3)}
                  ></div>
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-4"
                    onClick={() => animateRow(4)}
                  ></div>
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-5"
                    onClick={() => animateRow(5)}
                  ></div>
                  <div
                    className={`drop-column ${playerTurn}`}
                    data-testid="drop-column-6"
                    onClick={() => animateRow(6)}
                  ></div>
                </div>
              )}

            {tokens}
            {winningPieces}

            {state.animatedPiece != null && (
              <div style={getTokenStyle(state, state.animatedPiece, 6)}>
                {state.animatedPieceColor === "yellow" ? (
                  <img src={YellowPiece} alt="Yellow Token" />
                ) : (
                  <img src={OrangePiece} alt="Red Token" />
                )}
              </div>
            )}

            <div className="white-board">
              <img src={Board} alt="" />
            </div>
            <div className="black-board">
              <img src={BlackBoard} alt="" />
            </div>
          </div>
          {state.gameStarted && (
            <div className="player2-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player2} alt="Player Two Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {state.player2}
              </div>

              <div
                data-testid="yellow-win-count"
                className="flex flex-row justify-center uppercase text-6xl font-bold pb-3"
              >
                {state.yellowWins}
              </div>
            </div>
          )}
        </div>
        {state.winner == null && state.gameStarted && (
          <div className="flex justify-center -mt-8">
            <div
              className={`caret-container ${playerTurn} pl-4 pr-4 pt-5 flex flex-col text-white`}
            >
              <div className="flex flex-row justify-center uppercase pt-5 font-extrabold text-xl pb-3">
                {playerTurn === "red"
                  ? `${state.player1}'s Turn`
                  : `${state.player2}'s Turn`}
              </div>

              {state.plays > 1 ? (
                <div className="flex flex-row justify-center text-5xl font-extrabold">
                  {state.timerSeconds != null
                    ? `${state.timerSeconds}s`
                    : "24s"}
                </div>
              ) : (
                <div className="flex flex-row leading-tight text-xs">
                  Note: A timer will start after each player has played a turn.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        className={`bottom-plate ${
          state.winner != null ? state.winner.player : ""
        } `}
      ></div>
      <ReactModal
        className="modal winner-card"
        isOpen={state.remoteDisconnected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          state.remoteDisconnected = false;
          toggleRender();
        }}
        overlayClassName="disabled-background"
      >
        <div className="column-container col-centered gap15">
          <div className="row-container grow-h row-centered uppercase text-black">
            Remote Player Quit
          </div>

          <button
            onClick={() => {
              state.remoteDisconnected = false;
              toggleRender();
            }}
            className="uppercase"
          >
            Ok
          </button>
        </div>
      </ReactModal>
      <ReactModal
        className="modal winner-card"
        isOpen={
          (state.winner != null || state.draw) && !state.remoteDisconnected
        }
        shouldCloseOnOverlayClick={false}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col justify-center">
          <div
            className="uppercase text-black text-center"
            data-testid="winning-player"
          >
            {state.winner && `${state.winner!.player}`}
          </div>
          {state.draw && (
            <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
              Draw
            </div>
          )}
          {!state.draw && (
            <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
              Wins
            </div>
          )}
          <div className="flex flex-row justify-center gap-5 pt-6">
            <button onClick={() => terminateGame()} className="uppercase">
              Quit
            </button>

            <button onClick={playAgain} className="uppercase">
              Play Again
            </button>
          </div>
        </div>
      </ReactModal>
    </>
  );
};
export default App;
