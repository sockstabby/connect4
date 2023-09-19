import { useEffect, useState } from "react";
import GameLogo from "../src/assets/game-logo.svg";

export type GameMode = "online" | "local";

type StartGameModalProps = {
  onStartGame: (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    socket: WebSocket
  ) => void;
  onClose: () => void;
};

const StartGameModal = ({ onStartGame, onClose }: StartGameModalProps) => {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [playersWantingToPlay, setPlayersWantingToPlay] = useState({});
  const [invitee, setInvitee] = useState("");
  const [chosenOpponent, setChosenOpponent] = useState("");

  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");

  const [mode, setMode] = useState<GameMode>("local");

  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  console.log("players wanting to play = ", playersWantingToPlay);

  useEffect(() => {
    function closeHandler(_event: any) {
      console.error("The Websocket is closed.");
      setWebsocket(null);
    }
    function openHandler(_event: any) {
      const payload = {
        service: "chat",
        action: "joinLobby",
        data: {
          name,
        },
      };

      websocket!.send(JSON.stringify(payload));
    }

    function messageHandler(event: MessageEvent<any>) {
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
          player2Name,
          websocket!
        );
      }
    }

    if (websocket !== null) {
      websocket!.addEventListener("close", closeHandler);
      websocket!.addEventListener("open", openHandler);
      websocket!.addEventListener("message", messageHandler);
    }

    return () => {
      if (websocket !== null) {
        websocket!.removeEventListener("close", closeHandler);
        websocket!.removeEventListener("open", closeHandler);
        websocket!.removeEventListener("message", closeHandler);
      }
    };
  }, [websocket]);

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const player1NameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayer1(e.target.value);
  };

  const player2NameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayer2(e.target.value);
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

      websocket!.send(JSON.stringify(payload));
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

      websocket!.send(JSON.stringify(payload));
    }
  };

  const joinLobby = () => {
    if (websocket === null) {
      setWebsocket(new WebSocket("wss://connect4.isomarkets.com"));
    }
  };

  const closeSocket = () => {
    console.log("closing socket");
    websocket!.close();
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
    onStartGame(true, "local", "local", player1, player2, null);
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
                  <input
                    onChange={player1NameChanged}
                    type="text"
                    value={player1}
                  />
                </div>

                <div className="column-container">
                  <label> Player Two Name:</label>
                  <input
                    onChange={player2NameChanged}
                    type="text"
                    value={player2}
                  />
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

export default StartGameModal;
