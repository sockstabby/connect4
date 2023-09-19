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
import { useEffect, useReducer, useRef, useState } from "react";

const initialState = [[], [], [], [], [], [], []];

import useScreenSize from "./useScreenResize";

import useKeypress from "./useKeyPress";

type Column = string[];

type Winner = {
  pieces: Locations;
  player: string;
};

let g_initiator = false;
let g_initiatorColor = "red";

const socket = new WebSocket("wss://connect4.isomarkets.com");

// Connection opened
socket.addEventListener("open", (_event) => {
  console.log("woohoo open called");
});

socket.addEventListener("close", (_event) => {
  console.error("The Websocket is closed.");
});

export type ColState = Column[];

type GameMode = "online" | "local";

type LobbyProps = {
  onStartGame: (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string
  ) => void;
  onClose: () => void;
};

const dummyPlayers = ["a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a"];

const Lobby = ({ onStartGame, onClose }: LobbyProps) => {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [playersWantingToPlay, setPlayersWantingToPlay] = useState({});
  const [invitee, setInvitee] = useState("");
  const [chosenOpponent, setChosenOpponent] = useState("");

  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");

  const [mode, setMode] = useState<GameMode>("online");

  console.log("players wanting to play = ", playersWantingToPlay);

  useEffect(() => {
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);

      if (payload.message === "lobbyParticipants") {
        setParticipants(payload.data);
      }
      if (payload.message === "playRequested") {
        setPlayersWantingToPlay((s) => ({
          ...s,
          [payload.data]: payload.data,
        }));
      }

      if (payload.message === "startGame") {
        console.log("startGame", payload);

        let player1Name;
        let player2Name;

        if (payload.data.initiator) {
          player1Name = payload.data.initiatorName;
          player2Name = payload.data.opponentName;
        } else {
          player1Name = payload.data.initiatorName;
          player2Name = payload.data.nonInitiatorName;
        }

        onStartGame(
          payload.data.initiator,
          payload.data.opponent,
          "online",
          player1Name,
          player2Name
        );
      }
    });
  }, []);

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const playerSelected = (e: any) => {
    console.log("player selected = ", e.target.value);

    setChosenOpponent(e.target.value);
    // setName(e.target.value);
  };

  const inviteeSelected = (e: any) => {
    console.log("invitee selected = ", e.target.value);

    setInvitee(e.target.value);
    // setName(e.target.value);
  };

  const sendPlayRequest = () => {
    console.log("sendPlayRequest", chosenOpponent);

    if (chosenOpponent !== "") {
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
    console.log("sendPlayRequest");

    if (invitee !== "") {
      console.log("opponent to send accept request to is ", invitee);

      const payload = {
        service: "chat",
        action: "acceptPlayRequest",
        data: {
          chosenOpponent: invitee,
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
    // @ts-ignore
    let name = i.name;

    // @ts-ignore
    if (playersWantingToPlay.hasOwnProperty(i.name)) {
      // @ts-ignore
      name = i.name;
    }
    return <option value={name}> {name} </option>;
  });

  const invitesToPlay = Object.keys(playersWantingToPlay).map((i) => {
    return <option value={i}> {i} </option>;
  });

  console.log("players", players);
  console.log("invitesToPlay", invitesToPlay);

  const toggleMode = () => {
    setMode(mode === "online" ? "local" : "online");
  };

  const startLocalGame = () => {
    onStartGame(true, "local", "local", player1, player1);
  };

  return (
    <>
      <div className="disabled-background"></div>

      <div className="parent">
        <div className="modal centered">
          <div className="modal-content column-container col-start gap10">
            <div className="row-container">
              <img src={GameLogo} alt=""></img>
            </div>

            <div className="row-container">
              <label
                className={
                  mode === "online" ? "online-active" : "online-inactive"
                }
              >
                Local
              </label>
              <div className="toggle-wrapper">
                <input
                  type="checkbox"
                  id="switch"
                  checked={mode === "online"}
                  onChange={toggleMode}
                  tabIndex={0}
                />
                <label htmlFor="switch">Online Mode</label>
              </div>

              <label
                className={
                  mode === "online" ? "online-active" : "online-inactive"
                }
              >
                Online
              </label>
            </div>

            {mode !== "online" && (
              <>
                <div className="column-container">
                  <label> Player One Name:</label>
                  <input onChange={nameChanged} type="text" value={player1} />
                </div>

                <div className="column-container">
                  <label> Player Two Name:</label>
                  <input onChange={nameChanged} type="text" value={player2} />
                </div>

                <div className="row-container">
                  <button
                    className="button--unstyled uppercase"
                    onClick={startLocalGame}
                  >
                    Start Game
                  </button>
                </div>

                <div className="row-container">
                  <button
                    className="button--unstyled uppercase"
                    // onClick={joinLobby}
                  >
                    Game Rules
                  </button>
                </div>

                <div className="row-container row-centered gap10 pad-top-100  grow-h">
                  <button onClick={(_e) => onClose()}>Cancel</button>
                </div>
              </>
            )}

            {mode === "online" && (
              <>
                <div className="column-container">
                  <label> Enter your name to join the lobby:</label>
                  <input onChange={nameChanged} type="text" value={name} />
                </div>

                <div className="row-container">
                  <button
                    className={`button--unstyled uppercase ${
                      name === "" ? "disabled" : ""
                    } `}
                    onClick={joinLobby}
                  >
                    Join Lobby
                  </button>
                </div>

                <div className="column-container grow-h gap8">
                  Available Players:
                  <select
                    className="lobby-player-list widthHeight style"
                    onChange={playerSelected}
                    name="players"
                    size={5}
                  >
                    {players}
                  </select>
                  <button
                    disabled={chosenOpponent === "" || chosenOpponent === name}
                    onClick={sendPlayRequest}
                  >
                    Send Invite
                  </button>
                </div>

                <div className="column-container grow-h">
                  <label> Invitations Received:</label>

                  <select
                    className="lobby-player-list widthHeight style"
                    onChange={inviteeSelected}
                    name="invites"
                    size={5}
                  >
                    {invitesToPlay}
                  </select>
                </div>

                <div className="row-container row-centered gap10  grow-h">
                  <button onClick={(_e) => onClose()}>Cancel</button>

                  <button disabled={invitee === ""} onClick={acceptPlayRequest}>
                    Accept Invite
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

type Action =
  | { type: "setColState"; value: ColState }
  | { type: "setAdvancedPlan" };

function reducer(state: GameState, action: Action) {
  if (action.type === "setColState") {
    return { ...state, colState: action.value };
  }

  return state;
}

type GameState = {
  colState: ColState;
  yellowWins: number;
  redWins: number;
};

const initialGameState: GameState = {
  colState: initialState,
  yellowWins: 0,
  redWins: 0,
};

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initialGameState);

  // this solves the problem of closures resulting in stale data that occur from
  // our socket listener
  const [stateRef, setStateRef] = useState<React.MutableRefObject<GameState>>(
    useRef(initialGameState)
  );

  // count of numner of plays
  const [plays, setPlays] = useState(0);

  const [mode, setMode] = useState("online");

  const playsRef = useRef(0);

  // currentRef is the animated piece it is not fixed or permanent
  const currentRef = useRef<number | null>(null);

  const currentRefColor = useRef<null | string>(null);

  // @ts-ignore
  const [current, setCurrent] = useState<null | number>(null);

  const [winner, setWinner] = useState<Winner | null>(null);

  const [winnerGameState, setWinnerGameState] = useState<ColState | null>(null);

  const [pause, setPause] = useState(false);

  const [initiator, setInitiator] = useState(false);

  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const mainMenuOpenRef = useRef<boolean>(false);

  const [showLobby, setShowLobby] = useState(true);

  const [opponent, setOpponent] = useState("");

  const [player1, setPlayer1] = useState("");

  const [player2, setPlayer2] = useState("");

  const [initiatorColor, setInitiatorColor] = useState("red");

  useEffect(() => {
    // Listen for messages
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);

      if (payload.message === "playTurn") {
        console.log("our opponent has played their turn");

        animateRow(payload.data.turn.col, true);
      }
    });
  }, []);

  useScreenSize();

  useKeypress("Escape", () => {
    console.log("pause pressed");

    if (mainMenuOpenRef.current) {
      setMainMenuOpen(false);
      mainMenuOpenRef.current = false;
    } else {
      console.log("DSFSDFSDFFSDFDSFSDFSFDFSFSFFSDSSDF");
      setPause((p) => !p);
    }
  });

  useEffect(() => {
    if (current !== null) {
      console.log("current changed non null");

      //@ts-ignore

      const colState = JSON.parse(JSON.stringify(stateRef.current.colState));

      colState[currentRef.current!].push(currentRefColor.current);

      //dispatch({ type: "setColState", value: colState });

      stateRef.current = { ...stateRef.current, ...{ colState } };

      setStateRef(stateRef);

      setTimeout(() => {
        currentRef.current = null;
        setCurrent(null);
      }, 200);
    }
  }, [current]);

  const openMainMenuModal = () => {
    mainMenuOpenRef.current = true;
    setMainMenuOpen(true);
  };

  const getRemoteColor = () => {
    console.log("getRemoteColor global initiator = ", g_initiator);
    if (g_initiator) {
      return g_initiatorColor === "red" ? "yellow" : "red";
    }

    // i am not the initiator and we know the initiator color
    return g_initiatorColor;
  };

  const getLocalColor = () => {
    if (initiator) {
      return g_initiatorColor;
    }

    return g_initiatorColor === "red" ? "yellow" : "red";
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
  };

  const animateRow = (col: number, remote: boolean = false) => {
    console.error("making a token ");

    //creates the animation of the piece
    let player;
    if (mode === "online") {
      player = remote === true ? getRemoteColor() : getLocalColor();
    } else {
      player = playsRef.current % 2 === 0 ? "red" : "yellow";
    }

    setPlays((p) => p + 1);
    playsRef.current++;

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
      currentRef.current = col;
      currentRefColor.current = player;

      setCurrent(col);
    }

    if (!remote) {
      if (mode === "online") {
        localMove(col);
      }
      // playsRef.current++;
      // setPlays(plays + 1);
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
        ...{ colState: [[], [], [], [], [], [], []] },
      };

      setStateRef(stateRef);

      setWinnerGameState(colState);

      console.log("setting a winner!");

      setWinner({ player, pieces: winningSet });

      setPlays(0);
    } else {
      console.log("not setting a winner");
    }
  };

  const startGame = (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string
  ) => {
    console.log("startGame ", initiator, opponent, mode, player1, player2);

    stateRef.current = {
      ...stateRef.current,
      ...{ colState: [[], [], [], [], [], [], []], yellowWins: 0, redWins: 0 },
    };

    setStateRef(stateRef);
    setInitiator(initiator);
    setOpponent(opponent);

    setPlayer1(player1);
    setPlayer2(player2);

    setMode(mode);
    setShowLobby(false);
  };

  const playAgain = () => {
    setInitiatorColor(initiatorColor === "red" ? "yellow" : "red");

    g_initiatorColor = g_initiatorColor === "red" ? "yellow" : "red";

    // setColState([[], [], [], [], [], [], []]);

    setInitiator(!initiator);
    g_initiator = !g_initiator;
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

  if (initiator) {
    myTurn = plays % 2 === 0;
  } else {
    myTurn = plays % 2 !== 0;
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

  console.log("initiator", initiator);
  console.log("playerTurn", playerTurn);

  console.log("currentRef.current", currentRef.current);
  console.log("currentRefColor.current", currentRefColor.current);

  console.log("stateRef.current", stateRef.current);

  g_initiator = initiator;

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

      {showLobby && (
        <Lobby onStartGame={startGame} onClose={() => setShowLobby(false)} />
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

      {mainMenuOpen && (
        <>
          <div className="disabled-background"></div>

          <div className="parent">
            <div className="modal centered">
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
