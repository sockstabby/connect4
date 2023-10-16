import "./App.scss";

import Board from "../src/assets/connect4-board-top-layer.svg";
import BlackBoard from "../src/assets/connect4-board-back-layer.svg";
import OrangePiece from "../src/assets/orange-piece.svg";
import YellowPiece from "../src/assets/yellow-piece.svg";
import YellowWinningPiece from "../src/assets/yellow-winning-piece.svg";
import RedWinningPiece from "../src/assets/red-winning-piece.svg";
import Player1 from "../src/assets/player1.svg";
import Player2 from "../src/assets/player2.svg";
import { useCallback, useEffect } from "react";
import { logMessage } from "./logMessage";
import { getLocalColor, getRemoteColor } from "./reducerFunctions";
import { Disk, Connect4Props } from "./types";

export const GameBoard = ({
  gameTimerConfig,
  timerEnabled,
  state,
  dispatch,
}: Connect4Props) => {
  // const [state, dispatch] = useReducer(mainReducer, initialGameState);

  useEffect(() => {
    const decSeconds = () => {
      if (state.timerSeconds != null && state.timerSeconds != -1) {
        logMessage("decseconds", state.timerSeconds);
        dispatch({ type: "decrementSeconds" });
      }
    };

    if (state.timerRef == null && state.plays > 1 && timerEnabled) {
      state.timerRef = setInterval(decSeconds, 1000);
    }
  }, [state, dispatch, timerEnabled]);

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
  }, [dispatch, state.timerSeconds, getCurrentTurn, state.timerRef]);

  const animateRow = useCallback(
    (col: number, remote: boolean = false) => {
      dispatch({
        type: "diskDropped",
        value: { col, remote, gameTimerConfig },
      });
    },
    [gameTimerConfig, dispatch]
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
      logMessage("adding listener");
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
  }, [state, dispatch, animateRow, gameTimerConfig]);

  // we'll use this set to quickly test if a disk is part of a winning set
  const winningDiskSet = !state.winner
    ? new Set()
    : state.winner.pieces.reduce((acc, current) => {
        const key = `${current.col}${current.row}`;
        return acc.add(key);
      }, new Set());

  // at the moment there's a draw or somebody wins, a copy of the board
  // is used until the user presses Play Again.
  const disks = state.winner || state.draw ? state.disksCopy : state.disks;

  const disksElements = disks.map((disk: Disk) => {
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

  logMessage("myTurn = ", myTurn);
  logMessage("playerTurn = ", playerTurn);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { websocket, timerRef, ...remainingObject } = state;
  logMessage("state= ", remainingObject);

  return (
    <>
      <div className="main flex flex-col">
        {/* Note: This gets styled out for large displays */}
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
    </>
  );
};

export default GameBoard;
