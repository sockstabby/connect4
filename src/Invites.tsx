import { logMessage } from "./logMessage";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";
import GameLogo from "../src/assets/game-logo.svg";

import { InvitesProps } from "./types";

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
        <div className="logo-container">
          <div className="logo">
            <span className="game-title game-title__pad-right">C</span>
            <span className="game-title">
              <img
                src={GameLogo}
                alt="Game logo image of disks stacked ontop of eachother"
              ></img>
            </span>
            <span className="game-title game-title__pad-left">nnect</span>

            <span className="game-title-number">4</span>
          </div>
        </div>
        <div className="join-name-container flex flex-col items-center gap-4 pt-35">
          <div>Toggle the switch to accept an invitation.</div>
        </div>
      </div>

      <div className="player-list player-list__invites-player-list">
        <List dense sx={{ width: "100%", bgcolor: "#5c2dd5", color: "white" }}>
          {/* {[...Array(100).keys()].map((value) => { */}
          {[...state.invites, ""].map((value) => {
            const labelId = `checkbox-list-secondary-label-${value}`;
            return (
              <ListItem
                key={value}
                secondaryAction={
                  <Switch
                    edge="end"
                    onChange={acceptInvite(value)}
                    checked={state.invitesAccepted.has(value)}
                    // disabled={invitesSent.has(value)}
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

export default Invites;
