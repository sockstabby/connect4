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
import { useCallback, useEffect, useRef, useState } from "react";
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
};

// This is intended to store refs where ordinary state wont suffice due to
// closures within useEffect.
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
};

type Connect4Props = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
export const App = ({
  gameTimerConfig = 40,
  websocketUrl = "wss://connect4.isomarkets.com",
}: Connect4Props) => {
  // stateRef is intended to store refs where ordinary state wont suffice due to
  // closures within useEffect.
  const stateRef = useRef(initialGameState);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [mode, setMode] = useState("local");

  const timerRef = useRef<NodeJS.Timer | undefined>();

  // THE ONLY REASON WE NEED THIS IS BECAUSE WE HAVE A USEEFFECT DEPENDENCY THAT
  // TAKES CARE OF CLEANING UP THE ANIMATED PIECE. OTHERWISE A PLAIN OLD REF WOULD DO.
  const [lastDroppedColumn, setLastDroppedColumn] = useState<null | number>(
    null
  );

  const [winner, setWinner] = useState<Winner | null>(null);

  const [remoteDisconnected, setRemoteDisconnected] = useState(false);

  // we store the state of the board here so that players can reflect on the game until
  // they decide to play again.
  const [winnerGameState, setWinnerGameState] = useState<ColState | null>(null);

  const [opponent, setOpponent] = useState("");

  const [gameStarted, setGameStarted] = useState(false);

  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");

  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  // this is a hack. if we ever need to set a reference and trigger a rerender we can
  // call this function. This is only used for Toggling the main menu's visibility state.
  // for our useKeyboard hook.
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    ReactModal.setAppElement("body");
  });

  useEffect(() => {
    const decSeconds = () => {
      setTimerSeconds((t) => {
        const ret = t != null ? t! - 1 : null;
        return ret;
      });
    };

    if (timerRef.current == null && stateRef.current.plays > 1) {
      timerRef.current = setInterval(decSeconds, 1000);
    }
  }, [lastDroppedColumn]);

  useEffect(() => {
    if (timerSeconds === 0) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;

      const [_myTurn, playerTurn] = getCurrentTurn();

      setWinnerHelper(playerTurn === "yellow" ? "red" : "yellow");

      setWinner({
        player: playerTurn === "yellow" ? "red" : "yellow",
        pieces: [],
      });
    }
  }, [timerSeconds]);

  const terminateGame = useCallback(
    (notifyRemote = true) => {
      console.log("terminating game");
      setWinner(null);
      setGameStarted(false);

      if (websocket != null) {
        // tell the other player that we quit

        if (notifyRemote) {
          const payload = {
            service: "chat",
            action: "playTurn",
            data: {
              turn: -1,
              opponent,
            },
          };
          websocket!.send(JSON.stringify(payload));
        }

        websocket.close();
      }
    },
    [websocket, opponent]
  );

  useEffect(() => {
    function closeHandler() {
      console.error("The Websocket is closed.");
      // we need to tell the user what to do when this happens

      setWebsocket(null);
    }

    function messageHandler(event: MessageEvent<any>) {
      const payload = JSON.parse(event.data);

      if (payload.message === "playTurn") {
        if (payload.data.turn === -1) {
          setRemoteDisconnected(true);
          terminateGame(false);
        } else {
          const x = document.getElementById("drop-sound") as HTMLAudioElement;
          x?.play();

          animateRow(payload.data.turn.col, true);
        }
      }
    }

    if (websocket != null) {
      websocket!.addEventListener("close", closeHandler);
      websocket!.addEventListener("message", messageHandler);
    }

    return () => {
      if (websocket != null) {
        websocket!.removeEventListener("close", closeHandler);
        websocket!.removeEventListener("message", closeHandler);
      }
    };
  }, [websocket]);

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

  const toggleRender = () => {
    setForceRender(!forceRender);
  };

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

    clearInterval(timerRef.current);
    timerRef.current = undefined;

    setWinnerGameState(colState);
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

  const sendMove = (col: number) => {
    const payload = {
      service: "chat",
      action: "playTurn",
      data: {
        turn: { col },
        opponent,
      },
    };

    websocket!.send(JSON.stringify(payload));
  };

  function animateRow(col: number, remote: boolean = false) {
    if (stateRef.current.colState[col].length === 6) {
      return;
    }
    //creates the animation of the piece
    let player;
    if (mode === "online") {
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

    const [win, winningSet] = testForWin(
      col,
      stateRef.current.colState[col].length,
      player,
      stateRef.current.colState
    );

    if (!win) {
      stateRef.current = {
        ...stateRef.current,
        ...{ animatedPiece: col, animatedPieceColor: player },
      };

      setTimerSeconds(gameTimerConfig);
      setLastDroppedColumn(col);
    }

    if (!remote) {
      if (mode === "online") {
        sendMove(col);
      }
    }

    if (win) {
      setWinnerHelper(player);
      setWinner({ player, pieces: winningSet });
    }
  }

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    socket?: WebSocket
  ) => {
    stateRef.current = {
      ...stateRef.current,
      ...{
        colState: [[], [], [], [], [], [], []],
        yellowWins: 0,
        redWins: 0,
        initiator,
        mainMenuOpen: false,
      },
    };

    console.log("start game");
    console.log("initiator", initiator);
    console.log("mode", mode);
    console.log("player1", player1);
    console.log("player2", player2);

    setRemoteDisconnected(false);
    setGameStarted(true);
    toggleRender();
    setOpponent(opponent);
    setPlayer1(player1);
    setPlayer2(player2);
    setMode(mode);
    if (socket != null) {
      console.log("websocket not null");
      setWebsocket(socket);
    }
  };

  const playAgain = () => {
    stateRef.current = {
      ...stateRef.current,
      ...{
        initiator: !stateRef.current.initiator,
        mainMenuOpen: false,
        initiatorColor:
          stateRef.current.initiatorColor === "red" ? "yellow" : "red",
      },
    };

    setWinner(null);
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

  const getCurrentTurn: () => [boolean, string] = function (): [
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

  // function terminateGameWrapped(notifyRemote = true) {
  //   console.log("terminating game");
  //   setWinner(null);
  //   setGameStarted(false);

  //   if (websocket != null) {
  //     // tell the other player that we quit

  //     if (notifyRemote) {
  //       const payload = {
  //         service: "chat",
  //         action: "playTurn",
  //         data: {
  //           turn: -1,
  //           opponent,
  //         },
  //       };
  //       websocket!.send(JSON.stringify(payload));
  //     }

  //     websocket.close();
  //   }
  // }

  const tokens: any = [];
  const colState = winner != null ? winnerGameState : stateRef.current.colState;

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

  if (winner != null) {
    winningPieces = winner.pieces.map((piece) => {
      const style = getTokenStyle(piece.col, piece.row);
      const image =
        winner.player === "red" ? RedWinningPiece : YellowWinningPiece;

      return (
        <div key={`winningtoken${piece.col}${piece.row}orange`} style={style}>
          <img src={image} alt="" />
        </div>
      );
    });
  }

  const [myTurn, playerTurn] = getCurrentTurn();

  console.log("myTurn", myTurn);
  console.log("mode", mode);
  console.log("plays", stateRef.current.plays);
  console.log(stateRef.current.colState);
  console.log("modal open = ", stateRef.current.mainMenuOpen);
  console.log("forceRender", forceRender);

  return (
    <>
      <div className="nav-bar flex flex-row justify-around pt-3 items-center">
        <button onClick={openMainMenuModal}>Menu</button>

        <img src={GameLogo} alt=""></img>

        <button onClick={restartGame} disabled={mode === "online"}>
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
          setSocket={setWebsocket}
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
              {player1}
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
              {player2}
            </div>

            <div className="flex flex-row pb-1 justify-center -mr-12 smiley-container smiley-container-yellow">
              <img src={Player2} alt="Player Two Smiley Face" />
            </div>
          </div>
        </div>
        <div className="game-board-items">
          {gameStarted && (
            <div className="player1-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player1} alt="Player One Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {player1}
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
            {(myTurn || mode === "local") && winner == null && gameStarted && (
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
          {gameStarted && (
            <div className="player2-card player-card">
              <div className="flex flex-row pb-1 justify-center -mt-6 ">
                <img src={Player2} alt="Player Two Smiley Face" />
              </div>

              <div className="flex flex-row justify-center font-bold text-lg uppercase pt-2 pb-3">
                {player2}
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
        {winner == null && gameStarted && (
          <div className="flex justify-center -mt-8">
            <div
              className={`caret-container ${playerTurn} pl-4 pr-4 pt-5 flex flex-col text-white`}
            >
              <div className="flex flex-row justify-center uppercase pt-5 font-extrabold text-xl pb-3">
                {playerTurn === "red"
                  ? `${player1}'s Turn`
                  : `${player2}'s Turn`}
              </div>

              {stateRef.current.plays > 1 ? (
                <div className="flex flex-row justify-center text-5xl font-extrabold">
                  {timerSeconds != null ? `${timerSeconds}s` : "24s"}
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
        className={`bottom-plate ${winner != null ? winner.player : ""} `}
      ></div>

      <ReactModal
        className="modal winner-card"
        isOpen={remoteDisconnected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => setRemoteDisconnected(false)}
        overlayClassName="disabled-background"
      >
        <div className="column-container col-centered gap15">
          <div className="row-container grow-h row-centered uppercase text-black">
            Remote Player Quit
          </div>

          <button
            onClick={() => {
              setRemoteDisconnected(false);
            }}
            className="uppercase"
          >
            Ok
          </button>
        </div>
      </ReactModal>

      <ReactModal
        className="modal winner-card"
        isOpen={winner != null && !remoteDisconnected}
        shouldCloseOnOverlayClick={false}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col justify-center">
          <div
            className="uppercase text-black text-center"
            data-testid="winning-player"
          >
            {winner && `${winner!.player}`}
          </div>

          <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
            WINS
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
