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
import { useCallback, useEffect, useReducer } from "react";
import StartGameModal, { GameMode } from "./StartGameModal";
import useScreenSize from "./useScreenResize";
import ReactModal from "react-modal";

const DEBUG = true;

import {
  getLocalColor,
  getRemoteColor,
  getTokenStyle,
  mainReducer,
} from "./reducerFunctions";

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

export type AnimatedDisk = {
  color: string;
  row: number;
  col: number;
};

export type GameState = {
  colState: ColState;
  yellowWins: number;
  redWins: number;
  initiator: boolean;
  initiatorColor: string;
  plays: number;
  animatedPiece: number | null;
  animatedPieceColor: string | null;
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
  animatedDisks: AnimatedDisk[];
};

const initialGameState: GameState = {
  colState: [[], [], [], [], [], [], []],
  yellowWins: 0,
  redWins: 0,
  initiator: false,
  initiatorColor: "red",
  plays: 0,
  animatedPiece: null,
  animatedPieceColor: null,
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
  animatedDisks: [],
};

type Connect4Props = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
export const App = ({
  gameTimerConfig = 24,
  websocketUrl = "wss://connect4.isomarkets.com",
}: Connect4Props) => {
  const [state, dispatch] = useReducer(mainReducer, initialGameState);

  useEffect(() => {
    ReactModal.setAppElement("body");
  }, []);

  useEffect(() => {
    const decSeconds = () => {
      if (state.timerSeconds != null && state.timerSeconds != -1) {
        console.log("decseconds", state.timerSeconds);
        dispatch({ type: "decrementSeconds" });
      }
    };

    if (state.timerRef == null && state.plays > 1 && !DEBUG) {
      state.timerRef = setInterval(decSeconds, 1000);
    }
  }, [state]);

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

      const [, playerTurn] = getCurrentTurn();

      dispatch({
        type: "setWinner",
        value: {
          player: playerTurn === "yellow" ? "red" : "yellow",
          pieces: [],
        },
      });
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

  const winningDiskSet = !state.winner
    ? new Set()
    : state.winner.pieces.reduce((acc, current) => {
        const key = `${current.col}${current.row}`;
        return acc.add(key);
      }, new Set());

  const tokens = state.animatedDisks.map((disk) => {
    const style = getTokenStyle(state, disk.col, disk.row);
    const key = `${disk.col}${disk.row}`;

    const winningDisk = winningDiskSet.has(key);

    return (
      <div key={`disk${disk.col}${disk.row}${disk.color}`} style={style}>
        {!winningDisk ? (
          <img
            src={disk.color === "red" ? OrangePiece : YellowPiece}
            alt={
              disk.color === "red"
                ? `Red disk at row ${disk.row}, colimn ${disk.col} `
                : `Yellow disk at row ${disk.row}, colimn ${disk.col} `
            }
          />
        ) : (
          <img
            src={disk.color === "red" ? RedWinningPiece : YellowWinningPiece}
            alt={
              disk.color === "red"
                ? `Red disk at row ${disk.row}, colimn ${disk.col} `
                : `Yellow disk at row ${disk.row}, colimn ${disk.col} `
            }
          />
        )}
      </div>
    );
  });

  const [myTurn, playerTurn] = getCurrentTurn();

  if (DEBUG) {
    console.log("total disks = ", tokens.length);
    console.log("myTurn", myTurn);
    console.log("mode", state.mode);
    console.log("plays", state.plays);
    console.log(state.colState);
    console.log("modal open = ", state.mainMenuOpen);
  }

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
          dispatch({ type: "remoteDisconnected", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <div className="column-container col-centered gap15">
          <div className="row-container grow-h row-centered uppercase text-black">
            Remote Player Quit
          </div>

          <button
            onClick={() => {
              dispatch({ type: "remoteDisconnected", value: false });
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
