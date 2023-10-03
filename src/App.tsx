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
import { testForWin, Locations } from "./utils";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import StartGameModal, { GameMode } from "./StartGameModal";
import useScreenSize from "./useScreenResize";
import ReactModal from "react-modal";

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

type GameState = {
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
};

type Connect4State = {
  addonOnlineService: boolean;
  addonStorage: boolean;
  addonCustomProfile: boolean;
  name: string;
  email: string;
  phone: string;
  nextButtonEnabled: boolean;
  yearlyPlan: boolean;
};

type Action =
  | { type: "setArcadePlan" }
  | { type: "setAdvancedPlan" }
  | { type: "setProPlan" }
  | { type: "toggleOnlineService" }
  | { type: "toggleStorage" }
  | { type: "toggleCustomProfile" }
  | { type: "setName"; value: string }
  | { type: "setEmail"; value: string }
  | { type: "setPhone"; value: string }
  | { type: "setNextButtonEnabled"; value: boolean }
  | { type: "toggleYearly" };

const initialState: Connect4State = {
  addonOnlineService: false,
  addonStorage: false,
  addonCustomProfile: false,
  name: "",
  email: "",
  phone: "",
  nextButtonEnabled: true, //fix me,
  yearlyPlan: false,
};

function reducer(state: GameState, action: Action) {
  console.log("Reducer called ", action.type);
  if (action.type === "setArcadePlan") {
    return {
      ...state,
    };
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
};

type Connect4Props = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
export const App = ({
  gameTimerConfig = 5,
  websocketUrl = "wss://connect4.isomarkets.com",
}: Connect4Props) => {
  // stateRef is intended to store refs in one single ref.

  const [state, dispatch] = useReducer(reducer, initialGameState);

  const stateRef = useRef(initialGameState);
  const [lastDroppedColumn, setLastDroppedColumn] = useState<null | number>(
    null
  );

  // this is a hack. if we ever need to set a reference and trigger a rerender we can
  // call this function. Only needed because i chose to use references instead of setState
  // hooks to store state.
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    ReactModal.setAppElement("body");
  }, []);

  const toggleRender = useCallback(() => {
    stateRef.current.forceRender = !stateRef.current.forceRender;
    setForceRender(stateRef.current.forceRender);
  }, []);

  useEffect(() => {
    const decSeconds = () => {
      if (
        stateRef.current.timerSeconds != null &&
        stateRef.current.timerSeconds != -1
      ) {
        console.log("decseconds", stateRef.current.timerSeconds);
        --stateRef.current.timerSeconds;
        toggleRender();
      }
    };

    if (stateRef.current.timerRef == null && stateRef.current.plays > 1) {
      console.log("createing interval timer");
      stateRef.current.timerRef = setInterval(decSeconds, 1000);
    }
  }, [
    toggleRender,
    stateRef.current.timerSeconds,
    stateRef.current.timerRef,
    stateRef.current.plays,
  ]);

  const getCurrentTurn = useCallback(() => {
    const getCurrentTurnWrapped: () => [boolean, string] = function (): [
      boolean,
      string
    ] {
      let myTurn = false;

      if (stateRef.current.initiator) {
        myTurn = stateRef.current.plays % 2 === 0;
      } else {
        myTurn = stateRef.current.plays % 2 !== 0;
      }

      let playerTurn;

      if (myTurn) {
        playerTurn = getLocalColor();
      } else {
        playerTurn = getRemoteColor();
      }
      return [myTurn, playerTurn];
    };

    return getCurrentTurnWrapped();
  }, []);

  useEffect(() => {
    if (stateRef.current.timerSeconds === 0) {
      console.log("setting winner");
      clearInterval(stateRef.current.timerRef);
      stateRef.current.timerRef = undefined;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_myTurn, playerTurn] = getCurrentTurn();

      setWinnerHelper(playerTurn === "yellow" ? "red" : "yellow");

      stateRef.current.winner = {
        player: playerTurn === "yellow" ? "red" : "yellow",
        pieces: [],
      };
      // setWinner({
      //   player: playerTurn === "yellow" ? "red" : "yellow",
      //   pieces: [],
      // });
    }
  }, [stateRef.current.timerSeconds, getCurrentTurn]);

  const terminateGame = useCallback(
    (notifyRemote = true) => {
      console.log("terminating game");
      // setWinner(null);
      stateRef.current.winner = null;
      stateRef.current.gameStarted = false;
      toggleRender();

      if (stateRef.current.websocket != null) {
        // tell the other player that we quit

        if (notifyRemote) {
          const payload = {
            service: "chat",
            action: "playTurn",
            data: {
              turn: -1,
              opponent: stateRef.current.opponent,
            },
          };
          stateRef.current.websocket!.send(JSON.stringify(payload));
        }

        stateRef.current.websocket.close();
      }
    },
    [toggleRender]
  );

  const sendMove = useCallback((col: number) => {
    const payload = {
      service: "chat",
      action: "playTurn",
      data: {
        turn: { col },
        opponent: stateRef.current.opponent,
      },
    };

    stateRef.current.websocket!.send(JSON.stringify(payload));
  }, []);

  const animateRow = useCallback(
    (col: number, remote: boolean = false) => {
      function animateRowWrapped(col: number, remote: boolean = false) {
        if (stateRef.current.colState[col].length === 6) {
          return;
        }
        //creates the animation of the piece
        let player;
        if (stateRef.current.mode === "online") {
          player = remote === true ? getRemoteColor() : getLocalColor();
        } else {
          if (stateRef.current.initiatorColor === "yellow") {
            player = stateRef.current.plays % 2 === 0 ? "yellow" : "red";
          } else {
            player = stateRef.current.plays % 2 === 0 ? "red" : "yellow";
          }
        }

        stateRef.current = {
          ...stateRef.current,
          plays: stateRef.current.plays + 1,
        };

        if (stateRef.current.plays === 42) {
          stateRef.current.draw = true;
        }

        const [win, winningSet] = testForWin(
          col,
          stateRef.current.colState[col].length,
          player,
          stateRef.current.colState
        );

        if (!win) {
          stateRef.current = {
            ...stateRef.current,
            timerSeconds: gameTimerConfig,
            ...{ animatedPiece: col, animatedPieceColor: player },
          };

          setLastDroppedColumn(col);
        }

        if (!remote) {
          if (stateRef.current.mode === "online") {
            sendMove(col);
          }
        }

        if (win) {
          setWinnerHelper(player);
          stateRef.current.winner = { player, pieces: winningSet };
          toggleRender();
        }
      }

      return animateRowWrapped(col, remote);
    },
    [sendMove, gameTimerConfig]
  );

  useEffect(() => {
    function closeHandler() {
      console.error("The Websocket is closed.");
      // we need to tell the user what to do when this happens
      stateRef.current.websocket = undefined;
    }

    function messageHandler(event: MessageEvent<any>) {
      const payload = JSON.parse(event.data);

      if (payload.message === "playTurn") {
        if (payload.data.turn === -1) {
          stateRef.current.remoteDisconnected = true;
          terminateGame(false);
        } else {
          const x = document.getElementById("drop-sound") as HTMLAudioElement;
          x?.play();
          animateRow(payload.data.turn.col, true);
        }
      }
    }

    if (stateRef.current.websocket != null) {
      stateRef.current.websocket!.addEventListener("close", closeHandler);
      stateRef.current.websocket!.addEventListener("message", messageHandler);
    }

    return () => {
      if (stateRef.current.websocket != null) {
        stateRef.current.websocket!.removeEventListener("close", closeHandler);
        stateRef.current.websocket!.removeEventListener(
          "message",
          closeHandler
        );
      }
    };
  }, [stateRef.current.websocket, terminateGame, animateRow]);

  useScreenSize();

  useEffect(() => {
    if (stateRef.current.animatedPiece !== null) {
      const x = document.getElementById("drop-sound") as HTMLAudioElement;

      if (x != null) {
        x?.play();
      }

      const colState = JSON.parse(JSON.stringify(stateRef.current.colState));
      colState[stateRef.current.animatedPiece].push(
        stateRef.current.animatedPieceColor
      );
      stateRef.current = { ...stateRef.current, ...{ colState } };

      setTimeout(() => {
        stateRef.current = {
          ...stateRef.current,
          ...{ animatedPiece: null },
        };

        setLastDroppedColumn(null);
      }, 100);
    }
  }, [lastDroppedColumn]);

  const openMainMenuModal = () => {
    stateRef.current = { ...stateRef.current, ...{ mainMenuOpen: true } };
    toggleRender();
  };

  const closeMainMenuModal = () => {
    stateRef.current = { ...stateRef.current, ...{ mainMenuOpen: false } };
    toggleRender();
  };

  function setWinnerHelper(player: string) {
    const objectToMerge =
      player === "yellow"
        ? { yellowWins: stateRef.current.yellowWins + 1 }
        : { redWins: stateRef.current.redWins + 1 };

    stateRef.current = {
      ...stateRef.current,
      ...objectToMerge,
    };

    const colState = JSON.parse(JSON.stringify(stateRef.current.colState));

    stateRef.current = {
      ...stateRef.current,
      ...{ colState: [[], [], [], [], [], [], []], plays: 0 },
    };

    clearInterval(stateRef.current.timerRef);
    stateRef.current.timerRef = undefined;

    stateRef.current.winnerGameState = colState;
  }

  const getRemoteColor = () => {
    if (stateRef.current.initiator) {
      return stateRef.current.initiatorColor === "red" ? "yellow" : "red";
    }

    // i am not the initiator and we know the initiator color
    return stateRef.current.initiatorColor;
  };

  const getLocalColor = () => {
    if (stateRef.current.initiator) {
      return stateRef.current.initiatorColor;
    }

    return stateRef.current.initiatorColor === "red" ? "yellow" : "red";
  };

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    websocket?: WebSocket
  ) => {
    stateRef.current = {
      ...stateRef.current,
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

    console.log("start game");
    console.log("initiator", initiator);
    console.log("mode", mode);
    console.log("player1", player1);
    console.log("player2", player2);

    toggleRender();
  };

  const playAgain = () => {
    console.log("play again");
    stateRef.current = {
      ...stateRef.current,
      ...{
        initiator: !stateRef.current.initiator,
        plays: 0,
        colState: [[], [], [], [], [], [], []],
        mainMenuOpen: false,
        draw: false,
        initiatorColor:
          stateRef.current.initiatorColor === "red" ? "yellow" : "red",
      },
    };

    // setWinner(null);
    stateRef.current.winner = null;
    toggleRender();
  };

  const restartGame = () => {
    stateRef.current = {
      ...stateRef.current,
      ...{
        colState: [[], [], [], [], [], [], []],
        plays: 0,
      },
    };
    toggleRender();
  };

  const getTokenStyle = (col: number, row: number) => {
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
      const animationName = `move-${stateRef.current.colState[col].length}`;

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

  const tokens: any = [];
  const colState =
    stateRef.current.winner != null
      ? stateRef.current.winnerGameState
      : stateRef.current.colState;

  colState!.forEach((column, i) => {
    column.forEach((row, j) => {
      const style = getTokenStyle(i, j);
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

  if (stateRef.current.winner != null) {
    winningPieces = stateRef.current.winner.pieces.map((piece) => {
      const style = getTokenStyle(piece.col, piece.row);
      const image =
        stateRef.current.winner!.player === "red"
          ? RedWinningPiece
          : YellowWinningPiece;

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
      <div className="nav-bar flex flex-row justify-around pt-3 items-center">
        <button onClick={openMainMenuModal}>Menu</button>

        <img src={GameLogo} alt=""></img>

        <button
          onClick={restartGame}
          disabled={stateRef.current.mode === "online"}
        >
          Restart
        </button>
      </div>

      <ReactModal
        className="modal centered"
        isOpen={stateRef.current.mainMenuOpen}
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
            stateRef.current.websocket = socket;
            toggleRender();
          }}
          onClose={() => {
            stateRef.current = {
              ...stateRef.current,
              ...{ mainMenuOpen: false },
            };

            toggleRender();
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
              {stateRef.current.player1}
            </div>

            <div
              data-testid="red-win-count-small"
              className="win-count flex flex-row justify-center uppercase font-bold"
            >
              {stateRef.current.redWins}
            </div>
          </div>

          <div className="player-card-small flex flex-row justify-around items-center">
            <div
              data-testid="yellow-win-count-small"
              className="win-count flex flex-row justify-center uppercase font-bold"
            >
              {stateRef.current.yellowWins}
            </div>
            <div className="flex flex-row justify-center font-bold text-lg uppercase">
              {stateRef.current.player2}
            </div>

            <div className="flex flex-row pb-1 justify-center -mr-12 smiley-container smiley-container-yellow">
              <img src={Player2} alt="Player Two Smiley Face" />
            </div>
          </div>
        </div>
        <div className="game-board-items">
          {stateRef.current.gameStarted && (
            <div className="player1-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player1} alt="Player One Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {stateRef.current.player1}
              </div>

              <div
                data-testid="red-win-count"
                className="flex flex-row justify-center uppercase text-6xl font-bold pb-3"
              >
                {stateRef.current.redWins}
              </div>
            </div>
          )}

          <div className="game-board-container">
            {(myTurn || stateRef.current.mode === "local") &&
              stateRef.current.winner == null &&
              stateRef.current.gameStarted && (
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

            {stateRef.current.animatedPiece != null && (
              <div style={getTokenStyle(stateRef.current.animatedPiece, 6)}>
                {stateRef.current.animatedPieceColor === "yellow" ? (
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
          {stateRef.current.gameStarted && (
            <div className="player2-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player2} alt="Player Two Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {stateRef.current.player2}
              </div>

              <div
                data-testid="yellow-win-count"
                className="flex flex-row justify-center uppercase text-6xl font-bold pb-3"
              >
                {stateRef.current.yellowWins}
              </div>
            </div>
          )}
        </div>
        {stateRef.current.winner == null && stateRef.current.gameStarted && (
          <div className="flex justify-center -mt-8">
            <div
              className={`caret-container ${playerTurn} pl-4 pr-4 pt-5 flex flex-col text-white`}
            >
              <div className="flex flex-row justify-center uppercase pt-5 font-extrabold text-xl pb-3">
                {playerTurn === "red"
                  ? `${stateRef.current.player1}'s Turn`
                  : `${stateRef.current.player2}'s Turn`}
              </div>

              {stateRef.current.plays > 1 ? (
                <div className="flex flex-row justify-center text-5xl font-extrabold">
                  {stateRef.current.timerSeconds != null
                    ? `${stateRef.current.timerSeconds}s`
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
          stateRef.current.winner != null ? stateRef.current.winner.player : ""
        } `}
      ></div>

      <ReactModal
        className="modal winner-card"
        isOpen={stateRef.current.remoteDisconnected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          stateRef.current.remoteDisconnected = false;
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
              stateRef.current.remoteDisconnected = false;
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
          (stateRef.current.winner != null || stateRef.current.draw) &&
          !stateRef.current.remoteDisconnected
        }
        shouldCloseOnOverlayClick={false}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col justify-center">
          <div
            className="uppercase text-black text-center"
            data-testid="winning-player"
          >
            {stateRef.current.winner && `${stateRef.current.winner!.player}`}
          </div>

          <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
            {`${stateRef.current.draw && "Nobody"} WINS`}
          </div>
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
