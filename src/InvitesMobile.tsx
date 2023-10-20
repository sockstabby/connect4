import { logMessage } from "./logMessage";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";

import { InvitesProps } from "./types";
import Logo from "./Logo";

export const Invites = ({ state, dispatch }: InvitesProps) => {
  const acceptInvite = (name: string) => {
    return () => {
      acceptPlayRequest(name);
      dispatch({ type: "addPlayerToInvitesAccepted", value: name });
    };
  };

  const acceptPlayRequest = (invitee: string) => {
    if (invitee !== "") {
      const payload = {
        service: "connect4",
        action: "acceptPlayRequest",
        data: {
          chosenOpponent: invitee,
          acceptor: state.name,
        },
      };

      logMessage("sending accept play request to ", invitee);

      state.websocket!.send(JSON.stringify(payload));
    }
  };

  return (
    <>
      <div className="scroll-header scroll-header__invites-player-list main">
        <Logo />
        <div className="join-name-container flex flex-col items-center gap-4 pt-35">
          {state.invites.length > 0 ? (
            <div>Toggle the switch to accept an invitation.</div>
          ) : (
            <div className="flex flex-col gap-5">
              <p>
                When an online player invites you to play they will show up in a
                list below.
              </p>
              <p>
                Please note that you must first join the lobby in order to
                receive an invitation.
              </p>
              <p>
                A game will begin at the moment you accept an invitation as long
                as the remote player has not started another game.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="player-list player-list__invites-player-list">
        {state.invites.length > 0 && (
          <List
            dense
            sx={{ width: "100%", bgcolor: "#5c2dd5", color: "white" }}
          >
            {[...state.invites, ""].map((value) => {
              const labelId = `checkbox-list-secondary-label-${value}`;
              return (
                <ListItem
                  style={{ visibility: value === "" ? "hidden" : "visible" }}
                  key={value}
                  secondaryAction={
                    <Switch
                      edge="end"
                      onChange={acceptInvite(value)}
                      checked={state.invitesAccepted.has(value)}
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
        )}
      </div>
    </>
  );
};

export default Invites;
