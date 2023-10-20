import { useState } from "react";
import PlayerVsPlayer from "../src/assets/player-vs-player.svg";
import PlayerVsCPU from "../src/assets/player-vs-cpu.svg";
import { logMessage } from "./logMessage";
import Button from "./Button";
import { StartGameModalProps, GameMode } from "./types";
import Switch from "@mui/material/Switch";

const StartGameModal = ({
  state,
  dispatch,
  websocketUrl,
}: StartGameModalProps) => {
  const [invitee, setInvitee] = useState("");
  const [chosenOpponent, setChosenOpponent] = useState("");
  const [player1, setPlayer1] = useState("Player 1");
  const [player2, setPlayer2] = useState("Player 2");
  const [mode, setMode] = useState<GameMode>("local");

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "setName", value: e.target.value });
  };

  const onClose = () => {
    dispatch({ type: "mainMenuModalVisible", value: false });
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

  const onShowRules = () => {
    dispatch({ type: "rulesOpen", value: true });
  };

  const sendPlayRequest = () => {
    if (chosenOpponent !== "") {
      const payload = {
        service: "connect4",
        action: "sendPlayRequest",
        data: {
          chosenOpponent,
        },
      };

      logMessage("sending play request to ", chosenOpponent);
      state.websocket?.send(JSON.stringify(payload));
    }
  };

  const acceptPlayRequest = () => {
    if (invitee !== "") {
      const payload = {
        service: "connect4",
        action: "acceptPlayRequest",
        data: {
          chosenOpponent: invitee,
          acceptor: state.name,
        },
      };

      logMessage("sending accept play request to ", chosenOpponent);
      state.websocket!.send(JSON.stringify(payload));
    }
  };

  const joinLobby = () => {
    if (state.websocket == null) {
      logMessage("creating a new websocket");
      const ws = new WebSocket(websocketUrl);
      dispatch({ type: "setWebsocket", value: ws });
    }
  };

  const players = state.playersOnline.map((i) => {
    return (
      <option key={i} value={i}>
        {i}
      </option>
    );
  });

  const invitesToPlay = state.invites.map((i) => {
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
    dispatch({
      type: "startGame",
      value: {
        initiator: true,
        opponent: "local",
        mode: "local",
        player1,
        player2,
        websocket: state.websocket,
      },
    });
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

          <Switch
            edge="end"
            onChange={toggleMode}
            checked={mode === "local" ? false : true}
          />

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
              <button className="button--fancy " onClick={startLocalGame}>
                Start Game
              </button>

              <button onClick={onShowRules} className="button--fancy">
                Game Rules
              </button>

              <div className="pad-top-100">
                <Button onClick={() => onClose()}>Cancel</Button>
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
                value={state.name}
              />
            </div>

            <div className="pb-3">
              <Button
                disabled={state.name === ""}
                className="button--fancy"
                onClick={joinLobby}
              >
                Join Lobby
              </Button>
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
                <Button
                  disabled={
                    chosenOpponent === "" || chosenOpponent === state.name
                  }
                  onClick={sendPlayRequest}
                >
                  Send Invite
                </Button>
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
              <Button onClick={() => onClose()}>Cancel</Button>

              <Button disabled={invitee === ""} onClick={acceptPlayRequest}>
                Accept Invite
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default StartGameModal;
