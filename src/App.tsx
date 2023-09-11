import "./App.css";

import Board from "../src/assets/connect4-board-top-layer.svg";
import BlackBoard from "../src/assets/connect4-board-back-layer.svg";
import OrangePiece from "../src/assets/orange-piece.svg";
import YellowPiece from "../src/assets/yellow-piece.svg";
import { useState } from "react";

type Column = string[];

type ColState = Column[];

const App = () => {
  const [colState, setColState] = useState<ColState>([
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ]);

  const [plays, setPlays] = useState(0);

  const [current, setCurrent] = useState<null | number>(null);

  const animateRow = (col: number) => {
    if (current != null) {
      // basically there is a piece down that was animated into its position
      // and in this block we delete that item by setting current to null
      // and at the same time we make a permanent piece on the board

      // console.log("deleting current animation");

      // Notice that only when we delete it we create an actual fixed piece
      // on the board. in doing so we only ever have one piece on the board that was animated
      // and that item is short lived and turned into a permanent piece on the next
      // turn.

      const playerTurn = `${plays % 2 === 0 ? "red" : "yellow"}`;

      colState[current].push(playerTurn);

      setColState(colState);
      setCurrent(null);
      setPlays(plays + 1);
    } else {
      setCurrent(col);
    }
  };

  const getTokenStyle = (col: number, row: number) => {
    const ret: React.CSSProperties = {
      position: "absolute",
      top: 653 - row * 88,
      left: col * 88 + 118,
    };

    if (row === 6) {
      const animationName = `move-${colState[col].length}`;
      console.log("animationName", animationName);

      const merge = {
        animationIterationCount: 1,
        animationDuration: "3.5s",
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

  console.log("player turn ", playerTurn);
  console.log("colState=  ", colState);

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

  console.log("current = ", current);

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

// <div className="orange-piece">
//         <img src={OrangePiece} alt="" />
//       </div>

//       {
//         <div className="orange-piece2">
//           <img src={OrangePiece} alt="" />
//         </div>
//       }

//       <div className="orange-piece3">
//         <img src={OrangePiece} alt="" />
//       </div>

//       <div className="orange-piece4">
//         <img src={OrangePiece} alt="" />
//       </div>

//       <div className="orange-piece5">
//         <img src={OrangePiece} alt="" />
//       </div>

//       <div className="orange-piece6">
//         <img src={OrangePiece} alt="" />
//       </div>

//       <div className="orange-piece7">
//         <img src={OrangePiece} alt="" />
//       </div>
