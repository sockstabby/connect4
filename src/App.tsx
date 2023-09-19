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
import { useEffect, useRef, useState } from "react";
import StartGameModal, { GameMode } from "./StartGameModal";
import useScreenSize from "./useScreenResize";
import useKeypress from "./useKeyPress";

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
  mainMenuOpen: boolean;
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
};

export const App = () => {
  // this solves the problem of closures resulting in stale data that occur from
  // our socket listener. Only place state in here if it is shared with the websocket event listener.
  const [stateRef, setStateRef] = useState<React.MutableRefObject<GameState>>(
    useRef(initialGameState)
  );

  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const [mode, setMode] = useState("online");

  // THE ONLY REASON WE NEED THIS IS BECAUSE WE HAVE A USEEFFECT DEPENDENCY THAT
  // TAKES CARE OF CLEANING UP THE ANIMATED PIECE. OTHERWISE A PLAIN OLD REF WOULD DO.
  const [lastDroppedColumn, setLastDroppedColumn] = useState<null | number>(
    null
  );

  const [winner, setWinner] = useState<Winner | null>(null);

  // we store the state of the board here so that players can reflect on the game until
  // they decide to play again.
  const [winnerGameState, setWinnerGameState] = useState<ColState | null>(null);

  const [pause, setPause] = useState(false);

  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const mainMenuOpenRef = useRef<boolean>(false);

  const [opponent, setOpponent] = useState("");

  const [player1, setPlayer1] = useState("");

  const [player2, setPlayer2] = useState("");

  useEffect(() => {
    function closeHandler(_event: any) {
      console.error("The Websocket is closed.");
      // we need to tell the user what to do when this happens

      setWebsocket(null);
    }

    function messageHandler(event: MessageEvent<any>) {
      const payload = JSON.parse(event.data);

      if (payload.message === "playTurn") {
        console.log("our opponent has played their turn");
        animateRow(payload.data.turn.col, true);
      }
    }

    if (websocket !== null) {
      websocket!.addEventListener("close", closeHandler);
      websocket!.addEventListener("message", messageHandler);
    }

    return () => {
      if (websocket !== null) {
        websocket!.removeEventListener("close", closeHandler);
        websocket!.removeEventListener("message", closeHandler);
      }
    };
  }, [websocket]);

  useScreenSize();

  useKeypress("Escape", () => {
    console.log("pause pressed");

    if (mainMenuOpenRef.current) {
      mainMenuOpenRef.current = false;
      setMainMenuOpen(false);
    } else {
      setPause((p) => !p);
    }
  });

  useEffect(() => {
    if (stateRef.current.animatedPiece !== null) {
      const colState = JSON.parse(JSON.stringify(stateRef.current.colState));
      colState[stateRef.current.animatedPiece].push(
        stateRef.current.animatedPieceColor
      );
      stateRef.current = { ...stateRef.current, ...{ colState } };

      setStateRef(stateRef);

      setTimeout(() => {
        stateRef.current = {
          ...stateRef.current,
          ...{ animatedPiece: null },
        };

        setStateRef(stateRef);
        setLastDroppedColumn(null);
      }, 0);
    }
  }, [lastDroppedColumn]);

  const openMainMenuModal = () => {
    mainMenuOpenRef.current = true;
    setMainMenuOpen(true);
  };

  const getRemoteColor = () => {
    console.log(
      "getRemoteColor stateRef.current.initiator = ",
      stateRef.current.initiator
    );
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

  const localMove = (col: number) => {
    const payload = {
      service: "chat",
      action: "playTurn",
      data: {
        turn: { col },
        opponent,
      },
    };

    console.warn("sending playturn");
    websocket!.send(JSON.stringify(payload));
  };

  const animateRow = (col: number, remote: boolean = false) => {
    console.error("making a token ");

    //creates the animation of the piece
    let player;
    if (mode === "online") {
      player = remote === true ? getRemoteColor() : getLocalColor();
    } else {
      if (stateRef.current.initiatorColor === "yellow") {
        player = stateRef.current.plays % 2 === 0 ? "yellow" : "red";
      }
      if (stateRef.current.initiatorColor === "red") {
        player = stateRef.current.plays % 2 === 0 ? "red" : "yellow";
      }
    }

    stateRef.current = {
      ...stateRef.current,
      plays: stateRef.current.plays + 1,
    };

    setStateRef(stateRef);

    console.log("remote ", remote);
    console.log("the player that played this token is ", player);

    console.log("***********************************************", col);

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

      setStateRef(stateRef);
      setLastDroppedColumn(col);
    }

    if (!remote) {
      if (mode === "online") {
        localMove(col);
      }
    }

    console.log("state.colstate", stateRef.current.colState);

    if (win) {
      console.log("stateRef.current", stateRef.current);

      const objectToMerge =
        player === "yellow"
          ? { yellowWins: stateRef.current.yellowWins + 1 }
          : { redWins: stateRef.current.redWins + 1 };

      console.log("objectToMerge", objectToMerge);

      stateRef.current = {
        ...stateRef.current,
        ...objectToMerge,
      };

      const colState = JSON.parse(JSON.stringify(stateRef.current.colState));

      stateRef.current = {
        ...stateRef.current,
        ...{ colState: [[], [], [], [], [], [], []], plays: 0 },
      };

      setStateRef(stateRef);

      setWinnerGameState(colState);

      console.log("setting a winner!");

      setWinner({ player, pieces: winningSet });
    } else {
      console.log("not setting a winner");
    }
  };

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    socket: WebSocket
  ) => {
    console.log("startGame ", initiator, opponent, mode, player1, player2);

    stateRef.current = {
      ...stateRef.current,
      ...{
        colState: [[], [], [], [], [], [], []],
        yellowWins: 0,
        redWins: 0,
        initiator,
      },
    };

    setStateRef(stateRef);
    // setInitiator(initiator);
    setOpponent(opponent);

    setPlayer1(player1);
    setPlayer2(player2);

    setMode(mode);

    setWebsocket(socket);

    mainMenuOpenRef.current = false;
    setMainMenuOpen(false);
  };

  const playAgain = () => {
    stateRef.current = {
      ...stateRef.current,
      ...{
        initiator: !stateRef.current.initiator,
        initiatorColor:
          stateRef.current.initiatorColor === "red" ? "yellow" : "red",
      },
    };

    setStateRef(stateRef);

    setWinner(null);
  };

  const getTokenStyle = (col: number, row: number) => {
    const posLeft = window.innerWidth / 2 - 300;
    const posTop = window.innerHeight / 2 - 275 + 5 * 88;

    const ret: React.CSSProperties = {
      position: "absolute",
      top: posTop - row * 88,
      left: col * 88 + posLeft,
    };

    if (row === 6) {
      const animationName = `move-${stateRef.current.colState[col].length}`;

      const merge = {
        animationIterationCount: 1,
        animationDuration: "0.5s",
        animationName: animationName,
        animationFillMode: "forwards",
        zIndex: -1,
      };

      return { ...ret, ...merge };
    }

    return ret;
  };

  const tokens: any = [];

  const colState = winner != null ? winnerGameState : stateRef.current.colState;

  console.log("colState******************************", colState);

  console.log("winner******************************", winner);

  console.log("winnerGameState******************************", winnerGameState);

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

  console.log("myTurn", myTurn);

  console.log("mode", mode);

  console.log("stateRef.current.colState", stateRef.current.colState);

  console.log("stateRef.current.initiator", stateRef.current.initiator);
  console.log("playerTurn", playerTurn);

  console.log("stateRef.current.animatedPiece", stateRef.current.animatedPiece);
  console.log(
    "stateRef.current.animatedPieceColor",
    stateRef.current.animatedPieceColor
  );

  console.log("stateRef.current", stateRef.current);

  return (
    <>
      <div className="rowContainer row-centered grow-h game-controls-container ">
        <div className="menu-button-container">
          <button onClick={openMainMenuModal}>Menu</button>
        </div>

        <img src={GameLogo} alt=""></img>

        <div className="restart-button-container">
          <button>Restart</button>
        </div>
      </div>

      {mainMenuOpen && (
        <StartGameModal
          onStartGame={startGame}
          onClose={() => {
            mainMenuOpenRef.current = false;
            setMainMenuOpen(false);
          }}
        />
      )}

      {pause && (
        <>
          <div className="disabled-background"></div>

          <div className="parent">
            <div className="modal centered">
              <div className="modal-content column-container col-start gap8">
                <div className="modal-title-container uppercase">PAUSE</div>
                <div className="modal-button column-container col-centered uppercase">
                  Continue Game
                </div>
                <div className="modal-button column-container col-centered uppercase">
                  Restart
                </div>
                <div className="modal-button column-container col-centered uppercase">
                  Quit Game
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="player1-card player-card">
        <div className="player-container rowContainer grow-h">
          <img src={Player1} alt="" />{" "}
        </div>

        <div className="rowContainer player-name-text-container grow-h row-centered uppercase">
          {player1}
        </div>

        <div className="rowContainer player-score-text-container grow-h row-centered uppercase">
          {stateRef.current.redWins}
        </div>

        <div className="rowContainer"></div>
      </div>

      <div className="player2-card player-card">
        <div className="player-container rowContainer grow-h">
          <img src={Player2} alt="" />{" "}
        </div>
        <div className="rowContainer player-name-text-container grow-h row-centered uppercase">
          {player2}
        </div>
        <div className="rowContainer player-score-text-container grow-h row-centered uppercase">
          {stateRef.current.yellowWins}
        </div>
      </div>

      {(myTurn || mode === "local") && winner == null && (
        <div className="dropzone">
          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(0)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(1)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(2)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(3)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(4)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(5)}
          ></div>

          <div
            className={`drop-column ${playerTurn}`}
            onClick={() => animateRow(6)}
          ></div>
        </div>
      )}

      <div className="white-board">
        <img src={Board} alt="" />
      </div>

      <div className="black-board">
        <img src={BlackBoard} alt="" />
      </div>

      <div
        className={`bottom-plate ${winner != null ? winner.player : ""} `}
      ></div>

      {winner == null ? (
        <div className={`caret-container ${playerTurn}`}>
          <div className="row-container player-caret-name-text-container grow-h-90 row-centered uppercase">
            {playerTurn === "red" ? `${player1}'s Turn` : `${player2}'s Turn`}
          </div>

          <div className="row-container player-score-text-container grow-h row-centered ">
            24s
          </div>
        </div>
      ) : (
        <>
          <div className="winner-card column-container">
            <div className="row-container winner-name-text-container grow-h row-centered uppercase">
              {winner.player}
            </div>

            <div className="row-container winner-text-container grow-h row-centered uppercase">
              WINS
            </div>

            <button onClick={playAgain} className="uppercase">
              Play Again
            </button>
          </div>
          <div className="winner-card background"> </div>
        </>
      )}

      {tokens}

      {winningPieces}

      {stateRef.current.animatedPiece != null && (
        <div style={getTokenStyle(stateRef.current.animatedPiece, 6)}>
          {stateRef.current.animatedPieceColor === "yellow" ? (
            <img src={YellowPiece} alt="" />
          ) : (
            <img src={OrangePiece} alt="" />
          )}
        </div>
      )}
    </>
  );
};
export default App;
