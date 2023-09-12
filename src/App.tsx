import "./App.css";

import Board from "../src/assets/connect4-board-top-layer.svg";
import BlackBoard from "../src/assets/connect4-board-back-layer.svg";
import OrangePiece from "../src/assets/orange-piece.svg";
import YellowPiece from "../src/assets/yellow-piece.svg";

import { testForWin, Locations } from "./utils";
import { useState } from "react";

const initialState = [[], [], [], [], [], [], []];

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

const App = () => {
  const [colState, setColState] = useState<ColState>(initialState);
  // count of numner of plays
  const [plays, setPlays] = useState(0);
  // current is the animated piece it is not fixed or permanent
  const [current, setCurrent] = useState<null | number>(null);
  const [winner, setWinner] = useState<Winner | null>(null);

  const animateRow = (col: number) => {
    const playerTurn = `${plays % 2 === 0 ? "red" : "yellow"}`;

    if (current != null) {
      // basically there is a piece down that was animated into its position
      // and in this block we delete that item by setting current to null
      // and at the same time we make a permanent piece on the board

      // console.log("deleting current animation");

      // Notice that only when we delete it we create an actual fixed piece
      // on the board. in doing so we only ever have one piece on the board that was animated
      // and that item is short lived and turned into a permanent piece on the next
      // turn.

      colState[current].push(playerTurn);

      setColState(colState);
      setCurrent(null);
      setPlays(plays + 1);
    } else {
      setCurrent(col);
      const [win, winningSet] = testForWin(
        col,
        colState[col].length,
        playerTurn,
        colState
      );

      if (win) {
        setWinner({ player: playerTurn, pieces: winningSet });
      }
    }
  };

  const getTokenStyle = (col: number, row: number) => {
    const posLeft = window.innerWidth / 2 - 300;
    const posTop = window.innerHeight / 2 - 275 + 5 * 88;

    console.log("posTop", posTop);
    const ret: React.CSSProperties = {
      position: "absolute",
      top: posTop - row * 88,
      left: col * 88 + posLeft,
    };

    if (row === 6) {
      const animationName = `move-${colState[col].length}`;

      const merge = {
        animationIterationCount: 1,
        animationDuration: "0.5s",
        animationName: animationName,
        animationFillMode: "forwards",
      };

      return { ...ret, ...merge };
    }

    return ret;
  };

  let playerTurn = `${plays % 2 === 0 ? "red" : "yellow"}`;

  if (current != null) {
    playerTurn = `${plays % 2 === 0 ? "yellow" : "red"}`;
  }

  const tokens: any = [];

  colState.forEach((column, i) => {
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

  console.log("winner =", winner);
  console.log(JSON.stringify(colState));
  return (
    <>
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

      <div className="white-board">
        <img src={Board} alt="" />
      </div>

      <div className="black-board">
        <img src={BlackBoard} alt="" />
      </div>

      {tokens}

      {current != null && (
        <div style={getTokenStyle(current, 6)}>
          {playerTurn === "red" ? (
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
