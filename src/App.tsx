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

const initialState = [[], [], [], [], [], [], []];

import useScreenSize from "./useScreenResize";

import useKeypress from "./useKeyPress";

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

let g_initiator = false;

const socket = new WebSocket("wss://connect4.isomarkets.com");

// Connection opened
socket.addEventListener("open", (event) => {
  console.log("woohoo open called");
});

socket.addEventListener("close", (event) => {
  console.error("The Websocket is closed.");
});

// Listen for messages
socket.addEventListener("message", (event) => {
  //console.log("Message from server ", event.data);
});

export type ColState = Column[];

type LobbyProps = {
  onStartGame: (initiator: boolean, opponent: string) => void;
};

const Lobby = ({ onStartGame }: LobbyProps) => {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [playersWantingToPlay, setPlayersWantingToPlay] = useState({});

  const playerRef = useRef();

  const [chosenOpponent, setChosenOpponent] = useState(null);

  console.log("players wanting to play = ", playersWantingToPlay);

  useEffect(() => {
    //console.log("effect called ");

    // Listen for messages
    socket.addEventListener("message", (event) => {
      //console.log("Message from server ", event.data);

      //setMessage(JSON.stringify(event.data));

      const payload = JSON.parse(event.data);

      console.log("GOT A MESSAGE payload = ", payload);

      if (payload.message === "lobbyParticipants") {
        console.log("participants = ", payload.data);

        setParticipants(payload.data);
      }
      if (payload.message === "playRequested") {
        console.log("a player wants to play = ", payload.data);

        setPlayersWantingToPlay((s) => ({
          ...s,
          [payload.data]: payload.data,
        }));
      }

      if (payload.message === "startGame") {
        onStartGame(payload.data.initiator, payload.data.opponent);
      }
    });
  }, []);

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const playerSelected = (e) => {
    console.log("player selected = ", e.target.value);

    setChosenOpponent(e.target.value);
    // setName(e.target.value);
  };

  const sendPlayRequest = () => {
    console.log("sendPlayRequest", chosenOpponent);

    if (playerRef.current && playerRef.current.value) {
      //console.log("playerRef.value=", playerRef.current.value);

      const payload = {
        service: "chat",
        action: "sendPlayRequest",
        data: {
          chosenOpponent,
        },
      };

      socket.send(JSON.stringify(payload));
    }
  };

  const acceptPlayRequest = () => {
    console.log("sendPlayRequest", chosenOpponent);

    if (playerRef.current && playerRef.current.value) {
      //console.log("playerRef.value=", playerRef.current.value);

      //const opponent = chosenOpponent.replace("*", "");

      let opponent = chosenOpponent.replaceAll("*", "");

      console.log("opponent to send request to is ", opponent);

      const payload = {
        service: "chat",
        action: "acceptPlayRequest",
        data: {
          chosenOpponent: opponent,
          acceptor: name,
        },
      };

      socket.send(JSON.stringify(payload));
    }
  };

  const joinLobby = () => {
    const payload = {
      service: "chat",
      action: "joinLobby",
      data: {
        name,
      },
    };

    socket.send(JSON.stringify(payload));
  };

  const closeSocket = () => {
    console.log("closing socket");
    socket.close();
  };

  const players = participants.map((i) => {
    let name = i.name;

    if (playersWantingToPlay.hasOwnProperty(i.name)) {
      name = i.name + "************";
    }
    return <option value={name}> {name} </option>;
  });

  return (
    <>
      <div className="disabled-background"></div>

      <div className="lobby-modal">
        <div className="modal-content column-container col-start gap10">
          <div className="modal-title-container uppercase">Lobby</div>

          <button onClick={closeSocket}>Close Socket</button>
          <div
            onClick={joinLobby}
            className="modal-button column-container col-centered uppercase"
          >
            Join Lobby
          </div>

          <input onChange={nameChanged} type="text" value={name} />

          <label> Lobby:</label>
          {/* <input readOnly type="text" value={message} /> */}

          <select
            ref={playerRef}
            onChange={playerSelected}
            className="lobby-player-list"
            name="players"
            size={5}
          >
            {players}
          </select>

          <div className="row-container row-centered gap10">
            <button onClick={sendPlayRequest}>Send Play Request</button>

            <button onClick={acceptPlayRequest}>Accept Request</button>
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const [colState, setColState] = useState<ColState>(initialState);
  // count of numner of plays
  const [plays, setPlays] = useState(0);

  const playsRef = useRef(0);

  // currentRef is the animated piece it is not fixed or permanent
  const currentRef = useRef<number | null>(null);

  const currentRefColor = useRef<null | string>(null);

  const [current, setCurrent] = useState<null | number>(null);

  const [winner, setWinner] = useState<Winner | null>(null);

  const [pause, setPause] = useState(false);

  const [initiator, setInitiator] = useState(false);

  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const mainMenuOpenRef = useRef<boolean>(false);

  const [showLobby, setShowLobby] = useState(true);

  const [opponent, setOpponent] = useState("");

  useEffect(() => {
    // Listen for messages
    socket.addEventListener("message", (event) => {
      //console.log("Message from server ", event.data);

      //setMessage(JSON.stringify(event.data));

      const payload = JSON.parse(event.data);

      console.log("GOT A MESSAGE payload = ", payload);

      if (payload.message === "playTurn") {
        console.log("our opponent has played their turn");

        setPlays((p) => p + 1);
        playsRef.current++;
        animateRow(payload.data.turn.col, true);
      }

      if (payload.message === "clearToken") {
        console.log("opponent asked us to clear our token");

        if (currentRef.current != null) {
          console.log("this is a good thing");
        } else {
          console.error("asked to clear token when we dont have one!");
        }

        animateRow(0, true);
      }
    });
  }, []);

  useScreenSize();

  useKeypress("Escape", () => {
    console.log("pause pressed");

    if (mainMenuOpenRef.current) {
      console.log("WTF WTF");

      setMainMenuOpen(false);
      mainMenuOpenRef.current = false;
    } else {
      console.log("DSFSDFSDFFSDFDSFSDFSFDFSFSFFSDSSDF");
      setPause((p) => !p);
    }
  });

  const openMainMenuModal = () => {
    mainMenuOpenRef.current = true;
    setMainMenuOpen(true);
  };

  const getRemoteColor = () => {
    console.log("getRemoteColor global initiator = ", g_initiator);
    if (g_initiator) {
      return "yellow";
    }

    return "red";
  };

  const getLocalColor = () => {
    if (initiator) {
      return "red";
    }

    return "yellow";
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
    socket.send(JSON.stringify(payload));

    //animateRow(col);
  };

  const animateRow = (col: number, remote: boolean = false) => {
    if (currentRef.current != null) {
      console.error("clearing a token ");

      // this token could have been placed by us
      // or the remote player

      // basically there is a piece down that was animated into its position
      // and in this block we delete that item by setting current to null
      // and at the same time we make a permanent piece on the board

      // console.log("deleting current animation");

      // Notice that only when we delete it we create an actual fixed piece
      // on the board. in doing so we only ever have one piece on the board that was animated
      // and that item is short lived and turned into a permanent piece on the next
      // turn.

      colState[currentRef.current].push(currentRefColor.current);

      currentRef.current = null;
      currentRefColor.current = null;

      setColState(colState);
      setCurrent(null);

      if (!remote) {
        const payload = {
          service: "chat",
          action: "clearToken",
          data: {
            opponent,
          },
        };

        //tell the other guy to clear its token
        console.warn("telling other guy to clear its token");

        socket.send(JSON.stringify(payload));
      }
    } else {
      console.error("making a token ");

      //creates the animation of the piece
      if (!remote) {
        localMove(col);
        playsRef.current++;
        setPlays(plays + 1);
      }

      const player = remote === true ? getRemoteColor() : getLocalColor();

      console.log("remote ", remote);

      console.log("the player that played this token is ", player);

      currentRef.current = col;
      currentRefColor.current = player;

      setCurrent(col);

      const [win, winningSet] = testForWin(
        col,
        colState[col].length,
        player,
        colState
      );

      if (win) {
        setWinner({ player, pieces: winningSet });
      }
    }
  };

  const startGame = (initiator: boolean, opponent: string) => {
    console.log("startGame ", initiator, opponent);

    setInitiator(initiator);
    setOpponent(opponent);

    setShowLobby(false);
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
      const animationName = `move-${colState[col].length}`;

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

  //console.log("winning pieces = ", winningPieces);

  let myTurn = false;

  if (initiator) {
    myTurn = plays % 2 === 0;
  } else {
    myTurn = plays % 2 !== 0;
  }

  let playerTurn;

  if (myTurn) {
    if (initiator) {
      playerTurn = "red";
    } else {
      playerTurn = "yellow";
    }
  } else {
    if (initiator) {
      playerTurn = "yellow";
    } else {
      playerTurn = "red";
    }
  }

  console.log("myTurn", myTurn);
  console.log("initiator", initiator);
  console.log("playerTurn", playerTurn);

  console.log("currentRef.current", currentRef.current);
  console.log("currentRefColor.current", currentRefColor.current);

  g_initiator = initiator;

  return (
    <>
      {showLobby && <Lobby onStartGame={startGame} />}

      {pause && (
        <>
          <div className="disabled-background"></div>

          <div className="pause-modal">
            <div className="modal-content column-container col-start gap10">
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
        </>
      )}

      {mainMenuOpen && (
        <>
          <div className="disabled-background"></div>
          <div className="main-menu-modal">
            <div className="modal-content column-container col-start gap10">
              <div className="modal-title-container uppercase">
                <img src={GameLogo} alt=""></img>
              </div>
              <div className="play-vs-player-button row-container uppercase pad-left60 ">
                PLAY VS PLAYER
              </div>
              <div className="modal-button row-container uppercase pad-left60 ">
                GAME RULES
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rowContainer row-centered grow-h game-controls-container ">
        <div className="menu-button-container">
          <button onClick={openMainMenuModal}>Menu</button>
        </div>

        <img src={GameLogo} alt=""></img>

        <div className="restart-button-container">
          <button>Restart</button>
        </div>
      </div>

      <div className="player1-card">
        <div className="player-container rowContainer grow-h">
          <img src={Player1} alt="" />{" "}
        </div>

        <div className="rowContainer player-name-text-container grow-h row-centered uppercase">
          Player 1
        </div>

        <div className="rowContainer player-score-text-container grow-h row-centered uppercase">
          24
        </div>

        <div className="rowContainer"></div>
      </div>
      <div className="player1-card-background"></div>

      <div className="player2-card">
        <div className="player-container rowContainer grow-h">
          <img src={Player2} alt="" />{" "}
        </div>
        <div className="rowContainer player-name-text-container grow-h row-centered uppercase">
          Player 2
        </div>
        <div className="rowContainer player-score-text-container grow-h row-centered uppercase">
          18
        </div>
      </div>
      <div className="player2-card-background"></div>

      {/* {((initiator && playerTurn === "red") ||
        (!initiator && playerTurn === "yellow")) && ( */}

      {myTurn && (
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
          <div className="rowContainer player-caret-name-text-container grow-h row-centered uppercase">
            {playerTurn === "red" ? "Player 1's Turn" : "Player 2's Turn"}
          </div>

          <div className="rowContainer player-score-text-container grow-h row-centered ">
            24s
          </div>
        </div>
      ) : (
        <>
          <div className="winner-card column-container">
            <div className="row-container winner-name-text-container grow-h row-centered uppercase">
              {winner.player}
            </div>

            <div className="rowContainer winner-text-container grow-h row-centered uppercase">
              WINS
            </div>

            <button className="uppercase">Play Again</button>
          </div>
          <div className="winner-card background"> </div>
        </>
      )}

      {tokens}

      {winningPieces}

      {currentRef.current != null && (
        <div style={getTokenStyle(currentRef.current, 6)}>
          {currentRefColor.current === "yellow" ? (
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
