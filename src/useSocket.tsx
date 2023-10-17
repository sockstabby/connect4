import { useEffect, useState } from "react";
import {
  PlayRequested,
  UseSocketProps,
  StartGame,
  LobbyParticipants,
  PlayTurn,
} from "./types";
import { logMessage } from "./logMessage";

const useSocket = ({ state, dispatch }: UseSocketProps) => {
  const [listenerAdded, setListenerAdded] = useState(false);

  useEffect(() => {
    function closeHandler() {
      console.error("The Websocket is closed.");
      setListenerAdded(false);
      dispatch({ type: "setWebsocket", value: undefined });
    }

    function openHandler() {
      const payload = {
        service: "connect4",
        action: "joinLobby",
        data: {
          name: state.name,
        },
      };

      state.websocket!.send(JSON.stringify(payload));
    }

    function messageHandler(event: { data: string }) {
      // logMessage("useSocket received a message", event);

      const payload: PlayTurn | LobbyParticipants | PlayRequested | StartGame =
        JSON.parse(event.data);

      // dispatch({
      //   type: "messageReceived",
      //   value: { payload, gameTimerConfig },
      // });

      if (payload.message === "playTurn") {
        dispatch({ type: "playTurn", value: payload });
      }

      if (payload.message === "playRequested") {
        dispatch({ type: "addPlayerToInviteList", value: payload.data });
      }

      if (payload.message === "lobbyParticipants") {
        dispatch({ type: "joinLobby", value: true });
        // guarantee uniqueness, in prod this is done in the lambda. so this
        // is only necessary for test
        const playerSet = payload.data.reduce((acc, current) => {
          acc.add(current.name);
          return acc;
        }, new Set());

        dispatch({
          type: "setPlayersOnline",
          value: [...playerSet] as string[],
        });
      }

      if (payload.message === "playRequested") {
        dispatch({ type: "addPlayerToInviteList", value: payload.data });
      }

      if (payload.message === "startGame") {
        let player1;
        let player2;

        if (payload.data.initiator) {
          player1 = payload.data.initiatorName;
          player2 = payload.data.opponentName;
        } else {
          player1 = payload.data.initiatorName;
          player2 = payload.data.nonInitiatorName;
        }

        logMessage("start game");
        logMessage("initiator", payload.data.initiator);
        logMessage("opponent", payload.data.opponent);
        logMessage("mode", "online");
        logMessage("player1", player1);
        logMessage("player2", player2);

        dispatch({
          type: "startGame",
          value: {
            initiator: payload.data.initiator,
            opponent: payload.data.opponent,
            mode: "online",
            player1,
            player2,
            websocket: state.websocket,
          },
        });
      }
    }

    if (state.websocket != null && !listenerAdded) {
      logMessage("adding listeners to socket");
      state.websocket!.addEventListener("close", closeHandler);
      state.websocket!.addEventListener("message", messageHandler);
      state.websocket!.addEventListener("open", openHandler);

      setListenerAdded(true);
    }

    return () => {
      if (state.websocket != null && listenerAdded) {
        logMessage("removing listeners from socket");
        state.websocket!.removeEventListener("close", closeHandler);
        state.websocket!.removeEventListener("message", messageHandler);
      }
    };
  }, [state.websocket, state.name, dispatch, listenerAdded]);
};

export default useSocket;
