import { logMessage } from "./logMessage";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";

import { StartGameOnlineProps } from "./types";

const StartGameOnlineForm = ({
  state,
  dispatch,
  websocketUrl,
}: StartGameOnlineProps) => {
  const sendInvite = (name: string) => {
    return () => {
      sendPlayRequest(name);
      dispatch({ type: "sendInvite", value: name });
    };
  };

  const nameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "setName", value: e.target.value });
  };

  function sendPlayRequest(name: string) {
    if (name !== "") {
      const payload = {
        service: "connect4",
        action: "sendPlayRequest",
        data: {
          chosenOpponent: name,
        },
      };

      logMessage("sending play request to ", name);
      state.websocket?.send(JSON.stringify(payload));
    }
  }

  const joinLobby = () => {
    if (state.websocket == null) {
      logMessage("creating a new webscoket");
      const ws = new WebSocket(websocketUrl);
      dispatch({ type: "setWebsocket", value: ws });
    }
  };

  return (
    <>
      <div className="sticky main">
        <div className="flex flex-col items-center gap-4 pt-5">
          <label htmlFor="nameInput">Enter your name to join the lobby:</label>
          <input
            data-testid="online-name"
            id="nameInput"
            onChange={nameChanged}
            type="text"
            value={state.name}
            disabled={state.hasJoinedOnline}
          />

          <div className="pb-3">
            <button
              disabled={state.name === "" || state.hasJoinedOnline}
              className="button--fancy uppercase"
              onClick={joinLobby}
            >
              Join Lobby
            </button>
          </div>
        </div>
      </div>

      <div className="player-list">
        <List dense sx={{ width: "100%", bgcolor: "#5c2dd5", color: "white" }}>
          {/* {[...Array(100).keys()].map((value) => { */}
          {state.playersOnline.map((value) => {
            const labelId = `checkbox-list-secondary-label-${value}`;
            return (
              <ListItem
                key={value}
                secondaryAction={
                  <Switch
                    edge="end"
                    onChange={sendInvite(value)}
                    checked={state.invitesSent.has(value)}
                    inputProps={{
                      "aria-labelledby": "switch-list-label-bluetooth",
                    }}
                  />
                }
                disablePadding
              >
                <ListItemButton>
                  <ListItemAvatar>
                    <Avatar
                      alt="A user avatar"
                      //   src={"../src/assets/1.jpg"}
                      sx={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText id={labelId} primary={value} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </div>
    </>
  );
};

export default StartGameOnlineForm;
