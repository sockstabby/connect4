import "./App.scss";

import Board from "../src/assets/connect4-board-top-layer.svg";
import BlackBoard from "../src/assets/connect4-board-back-layer.svg";
import OrangePiece from "../src/assets/orange-piece.svg";
import YellowPiece from "../src/assets/yellow-piece.svg";
import YellowWinningPiece from "../src/assets/yellow-winning-piece.svg";
import RedWinningPiece from "../src/assets/red-winning-piece.svg";
import CheckCircle from "../src/assets/check-circle.svg";
import Player1 from "../src/assets/player1.svg";
import Player2 from "../src/assets/player2.svg";
import GameLogo from "../src/assets/game-logo.svg";
import { useCallback, useEffect, useReducer } from "react";
import StartGameModal from "./StartGameModal";
import useScreenSize from "./useScreenResize";
import ReactModal from "react-modal";

const DEBUG = false;
const TIMER_ENABLED = false;
const TIMER_SECONDS = 24;

import { getLocalColor, getRemoteColor, mainReducer } from "./reducerFunctions";

import { AnimatedDisk, GameState, Connect4Props, GameMode } from "./types";

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
  rulesOpen: false,
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
  //this is a copy of animatedDisks at the moment somebody won or their is a draw.
  animatedDisksCopy: [],
};

export const App = ({
  gameTimerConfig = TIMER_SECONDS,
  websocketUrl = "wss://connect4.isomarkets.com",
}: Connect4Props) => {
  const [state, dispatch] = useReducer(mainReducer, initialGameState);

  useEffect(() => {
    ReactModal.setAppElement("body");
  }, []);

  useEffect(() => {
    const decSeconds = () => {
      if (state.timerSeconds != null && state.timerSeconds != -1) {
        if (DEBUG) {
          console.log("decseconds", state.timerSeconds);
        }
        dispatch({ type: "decrementSeconds" });
      }
    };

    if (state.timerRef == null && state.plays > 1 && TIMER_ENABLED) {
      state.timerRef = setInterval(decSeconds, 1000);
    }
  }, [state]);

  // useCallback is required to be stable due to the of the dependency
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

    function messageHandler(event: { data: string }) {
      const payload = JSON.parse(event.data);

      dispatch({
        type: "messageReceived",
        value: { payload, gameTimerConfig },
      });
    }

    if (state.websocket != null && !state.listenerAdded) {
      if (DEBUG) {
        console.log("adding listener");
      }
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
    dispatch({ type: "mainMenuModalVisible", value: false });
  };

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    websocket?: WebSocket
  ) => {
    if (DEBUG) {
      console.log("start game");
      console.log("initiator", initiator);
      console.log("opponent", opponent);
      console.log("mode", mode);
      console.log("player1", player1);
      console.log("player2", player2);
    }

    dispatch({
      type: "startGame",
      value: { initiator, opponent, mode, player1, player2, websocket },
    });
  };

  const playAgain = () => {
    dispatch({ type: "playAgain" });
  };

  const restartGame = () => {
    dispatch({ type: "restartGame" });
  };

  // we'll use this set to quickly test if a disk is part of a winning set
  const winningDiskSet = !state.winner
    ? new Set()
    : state.winner.pieces.reduce((acc, current) => {
        const key = `${current.col}${current.row}`;
        return acc.add(key);
      }, new Set());

  // at the moment there's a draw or somebody wins, a copy of the board
  // is used until the user presses Play Again.
  const disks =
    state.winner || state.draw ? state.animatedDisksCopy : state.animatedDisks;

  const disksElements = disks.map((disk: AnimatedDisk) => {
    const key = `${disk.col}${disk.row}`;

    const winningDisk = winningDiskSet.has(key);

    return (
      <div
        key={`disk${disk.col}${disk.row}${disk.color}${state.winner}`}
        className={`disk-row-${disk.row} disk-column-${disk.col} disk-container`}
      >
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
    console.log("myTurn = ", myTurn);
    console.log("playerTurn = ", playerTurn);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { websocket, ...remainingObject } = state;
    console.log("state= ", remainingObject);
  }

  return (
    <>
      version {` ${__APP_VERSION__} ${__COMMIT_HASH__}`}
      <div className="nav-bar flex flex-row justify-around pt-3 items-center">
        <button onClick={openMainMenuModal}>Menu</button>

        <img
          src={GameLogo}
          alt="Game logo image of disks stacked ontop of eachother"
        ></img>

        <button onClick={restartGame} disabled={state.mode === "online"}>
          Restart
        </button>
      </div>
      <ReactModal
        className="modal modal__dark-background centered"
        isOpen={state.mainMenuOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={closeMainMenuModal}
        overlayClassName="disabled-background"
      >
        <StartGameModal
          websocketUrl={websocketUrl}
          onStartGame={startGame}
          exchangeSocket={(socket: WebSocket) => {
            dispatch({ type: "setWebsocket", value: socket });
          }}
          onClose={() => {
            dispatch({ type: "mainMenuModalVisible", value: false });
          }}
          onShowRules={() => dispatch({ type: "rulesOpen", value: true })}
        />
      </ReactModal>
      <ReactModal
        className="modal modal__light-background centered"
        isOpen={state.rulesOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          dispatch({ type: "rulesOpen", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <div className="rules-content pt-5 pb-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-center text-4xl font-extrabold	">
              RULES
            </div>
            <h1>Objective</h1>
            <div className="flex flex-row items start gap-3">
              <p>
                Be the first player to connect 4 of the same colored discs in a
                row (either vertically, horizontally, or diagonally).
              </p>
            </div>
            <h1>How To Play</h1>
            <div className="flex flex-row items start gap-3">
              <span> 1</span>
              <p>Red goes first in the first game.</p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 2</span>
              <p>
                Players must alternate turns, and only one disc can be dropped
                in each turn.
              </p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 3</span>
              <p>The game ends when there is a 4-in-a-row or a stalemate.</p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 4</span>
              <p>
                The starter of the previous game goes second on the next game.
              </p>
            </div>
            <div className="flex flex-row justify-center">
              <div className="check-circle">
                <img src={CheckCircle}></img>
              </div>
            </div>
          </div>
        </div>
      </ReactModal>
      <div className="flex flex-col">
        <div className="player-card-small-container flex flex-row justify-center gap-4">
          <div className="player-card-small flex flex-row justify-around items-center">
            <div className="flex flex-row justify-center smiley-container smiley-container-red">
              <img src={Player1} alt="Player One Smiley Face" />
            </div>

            <div className="flex player-card-small__player-name-text flex-row justify-center font-bold text-lg uppercase">
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
            <div className="flex player-card-small__player-name-text flex-row justify-center font-bold text-lg uppercase">
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

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-3 pb-3">
                {state.player1}
              </div>

              <div
                data-testid="red-win-count"
                className="flex flex-row justify-center uppercase text-6xl font-bold pb-5"
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

            {disksElements}

            <div className="white-board">
              <img src={Board} alt="" />
            </div>

            <div className="black-board">
              <img src={BlackBoard} alt="" />
            </div>
          </div>

          {state.gameStarted && (
            <div className="player2-card player-card">
              <div className="flex flex-row justify-center -mt-6 ">
                <img src={Player2} alt="Player Two Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {state.player2}
              </div>

              <div
                data-testid="yellow-win-count"
                className="flex-row justify-center uppercase text-6xl font-bold pb-5"
              >
                {state.yellowWins}
              </div>
            </div>
          )}
        </div>
        {state.winner == null && state.gameStarted && (
          <div className="flex justify-center -mt-7">
            <div
              className={`caret-container ${playerTurn} pl-4 pr-4 flex flex-col justify-center text-white`}
            >
              <div className="caret-container__player-turn-text flex flex-row justify-center uppercase font-extrabold">
                {playerTurn === "red"
                  ? `${state.player1}'s Turn`
                  : `${state.player2}'s Turn`}
              </div>

              {state.plays > 1 ? (
                <div className="caret-container__player-countdown-text flex flex-row justify-center text-5xl font-extrabold">
                  {state.timerSeconds != null
                    ? `${state.timerSeconds}s`
                    : "24s"}
                </div>
              ) : (
                <div className="caret-container__timer-note flex flex-row leading-tight">
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
        className="modal modal__light-background modal__bottom-placement"
        isOpen={state.remoteDisconnected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          dispatch({ type: "remoteDisconnected", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-row justify-center uppercase text-black">
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
        className="modal modal__light-background modal__bottom-placement"
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
