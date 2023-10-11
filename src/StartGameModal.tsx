import { useEffect, useState } from "react";
import PlayerVsPlayer from "../src/assets/player-vs-player.svg";
import PlayerVsCPU from "../src/assets/player-vs-cpu.svg";

import {
  StartGameModalProps,
  Player,
  GameMode,
  LobbyParticipants,
  PlayRequested,
  StartGame,
} from "./types";

const StartGameModal = ({
  onStartGame,
  onClose,
  websocketUrl,
  exchangeSocket,
  onShowRules,
}: StartGameModalProps) => {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<Player[]>([]);
  const [playerInvites, setPlayersInvites] = useState<string[]>([]);
  const [invitee, setInvitee] = useState("");
  const [chosenOpponent, setChosenOpponent] = useState("");

  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");

  const [mode, setMode] = useState<GameMode>("local");

  const [websocket, setWebsocket] = useState<WebSocket | undefined>();

  const [listenerAdded, setListenerAdded] = useState(false);

  useEffect(() => {
    function closeHandler() {
      console.error("The Websocket is closed.");
      setWebsocket(undefined);
    }
    function openHandler() {
      const payload = {
        service: "chat",
        action: "joinLobby",
        data: {
          name,
        },
      };

      websocket!.send(JSON.stringify(payload));
    }

    function messageHandler(event: { data: string }) {
      const payload: LobbyParticipants | PlayRequested | StartGame = JSON.parse(
        event.data
      );

      if (payload.message === "lobbyParticipants") {
        console.log("lobbyParticipants", payload.data);
        setParticipants(payload.data);
      }
      if (payload.message === "playRequested") {
        console.log("playRequested", payload.data);
        setPlayersInvites((s) => [...s, payload.data]);
      }

      if (payload.message === "startGame") {
        console.log("start game payload = ", payload);
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
          websocket
        );
      }
    }

    if (websocket != null && !listenerAdded) {
      websocket!.addEventListener("close", closeHandler);
      websocket!.addEventListener("open", openHandler);
      websocket!.addEventListener("message", messageHandler);
      setListenerAdded(true);
    }

    return () => {
      if (websocket != null) {
        console.log("modal cleaning up websocket listeners");
        websocket!.removeEventListener("close", closeHandler);
        websocket!.removeEventListener("open", closeHandler);
        websocket!.removeEventListener("message", closeHandler);
      }
    };
  }, [websocket, name, listenerAdded, onStartGame]);

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const player1NameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayer1(e.target.value);
  };

  const player2NameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayer2(e.target.value);
  };

  const playerSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChosenOpponent(e.target.value);
  };

  const inviteeSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInvitee(e.target.value);
  };

  const sendPlayRequest = () => {
    if (chosenOpponent !== "") {
      const payload = {
        service: "chat",
        action: "sendPlayRequest",
        data: {
          chosenOpponent,
        },
      };

      websocket?.send(JSON.stringify(payload));
    }
  };

  const acceptPlayRequest = () => {
    if (invitee !== "") {
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
    if (websocket == null) {
      const ws = new WebSocket(websocketUrl);
      // this first set
      exchangeSocket(ws);
      setWebsocket(ws);
    }
  };

  const players = participants.map((i) => {
    return (
      <option key={i.name} value={i.name}>
        {i.name}
      </option>
    );
  });

  const invitesToPlay = playerInvites.map((i) => {
    return (
      <option key={i} value={i}>
        {i}
      </option>
    );
  });

  const toggleMode = () => {
    setMode(mode === "online" ? "local" : "online");
  };

  const startLocalGame = () => {
    onStartGame(true, "local", "local", player1, player2);
  };

  return (
    <>
      <div className="flex flex-col justify-start gap-3 items-center pt-3 pb-3">
        {mode !== "online" && (
          <img
            src={PlayerVsCPU}
            alt="Image of 2 smileys, both looking forwards. One of them is emotionless."
          />
        )}
        {mode === "online" && (
          <img src={PlayerVsPlayer} alt="Image of 2 smileys looking right" />
        )}
        <div className="flex flex-row gap-7 pb-4  pt-3 text-4xl font-extrabold items-center">
          <span className={mode === "online" ? "line-through" : ""}>Local</span>

          <button
            className="toggle"
            type="button"
            aria-pressed={mode === "local" ? "false" : "true"}
            onClick={toggleMode}
            data-testid="online-switch"
          >
            <span className="toggle__display" hidden></span>
          </button>

          <span className={mode === "local" ? "line-through" : ""}>Online</span>
        </div>
        {mode !== "online" ? (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center">
                <label htmlFor="player1Name"> Player One Name:</label>
                <input
                  onChange={player1NameChanged}
                  type="text"
                  value={player1}
                  id="player1Name"
                />
              </div>

              <div className="flex flex-col items-center pb-3">
                <label htmlFor="player2Name"> Player Two Name:</label>
                <input
                  onChange={player2NameChanged}
                  type="text"
                  value={player2}
                  id="player2Name"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-8">
              <button
                className="button--fancy uppercase font-bold"
                onClick={startLocalGame}
              >
                Start Game
              </button>

              <button onClick={onShowRules} className="button--fancy uppercase">
                Game Rules
              </button>

              <div className="pad-top-100">
                <button onClick={() => onClose()}>Cancel</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <label htmlFor="nameInput">
                Enter your name to join the lobby:
              </label>
              <input
                data-testid="online-name"
                id="nameInput"
                onChange={nameChanged}
                type="text"
                value={name}
              />
            </div>

            <div className="pb-3">
              <button
                disabled={name === ""}
                className="button--fancy uppercase"
                onClick={joinLobby}
              >
                Join Lobby
              </button>
            </div>

            <div className="flex flex-col items-center w-full">
              <label htmlFor="availablePlayers"> Available Players:</label>
              <select
                className="w-full widthHeight style max-h-24"
                onChange={playerSelected}
                name="players"
                id="availablePlayers"
                size={5}
              >
                {players}
              </select>

              <div className="pt-2">
                <button
                  disabled={chosenOpponent === "" || chosenOpponent === name}
                  onClick={sendPlayRequest}
                >
                  Send Invite
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full items-center">
              <label htmlFor="invitesReceived">
                {`${invitesToPlay.length} Invitations Received:`}
              </label>

              <select
                className="w-full widthHeight style max-h-24"
                onChange={inviteeSelected}
                name="invites"
                size={5}
                id="invitesReceived"
              >
                {invitesToPlay}
              </select>
            </div>

            <div className="flex flex-row gap-4">
              <button onClick={() => onClose()}>Cancel</button>

              <button disabled={invitee === ""} onClick={acceptPlayRequest}>
                Accept Invite
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default StartGameModal;
