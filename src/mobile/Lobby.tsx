import { logMessage } from "../logMessage";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";

import { StartGameOnlineProps } from "../types";
import Logo from "../Logo";
import Button from "../Button";

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
      <div className="scroll-header scroll-header__lobby-player-list  main">
        <Logo />
        <div className="join-name-container flex flex-col items-center gap-4 pt-35">
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
            <Button
              disabled={state.name === "" || state.hasJoinedOnline}
              onClick={joinLobby}
            >
              {state.joinPending ? (
                <CircularProgress size={24} color="secondary" />
              ) : (
                "Join Lobby"
              )}
            </Button>
          </div>

          {state.playersOnline.length > 0 ? (
            <div>Toggle the switch to send an invitation.</div>
          ) : (
            <div>
              After joining the lobby you will be able to see a list of players
              and be able to send invites to play.
            </div>
          )}
        </div>
      </div>

      <div className="player-list player-list__lobby-player-list">
        {state.playersOnline.length > 0 && (
          <List
            dense
            sx={{ width: "100%", bgcolor: "#5c2dd5", color: "white" }}
          >
            {/* adding an extra item that is invisible so the last item is not clipped by the bottom nav */}
            {[...state.playersOnline, ""].map((value) => {
              const labelId = `checkbox-list-secondary-label-${value}`;
              return (
                <ListItem
                  style={{ visibility: value === "" ? "hidden" : "visible" }}
                  key={value}
                  secondaryAction={
                    <Switch
                      edge="end"
                      onChange={sendInvite(value)}
                      checked={state.invitesSent.has(value)}
                    />
                  }
                  disablePadding
                >
                  <ListItemButton
                    style={{ visibility: value === "" ? "hidden" : "visible" }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        alt="A user avatar"
                        sx={{ width: 40, height: 40 }}
                      />
                    </ListItemAvatar>

                    <ListItemText id={labelId} primary={value} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </div>
    </>
  );
};

export default StartGameOnlineForm;
