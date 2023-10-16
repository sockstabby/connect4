import { useState } from "react";
import { logMessage } from "./logMessage";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Switch from "@mui/material/Switch";

import { InvitesProps } from "./types";

export const Invites = ({ state }: InvitesProps) => {
  const [invitesAccepted, setInvitesAccepted] = useState(new Set());

  const acceptInvite = (name: string) => {
    return () => {
      acceptPlayRequest(name);
      // shallow clone/copy which is needed for react to render it after a name is added
      const newSet = new Set(invitesAccepted);
      newSet.add(name);
      setInvitesAccepted(newSet);
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

  console.log("invites", state.invites);

  return (
    <>
      <div className="player-list">
        <List dense sx={{ width: "100%", bgcolor: "#5c2dd5", color: "white" }}>
          {/* {[...Array(100).keys()].map((value) => { */}
          {state.invites.map((value) => {
            const labelId = `checkbox-list-secondary-label-${value}`;
            return (
              <ListItem
                key={value}
                secondaryAction={
                  <Switch
                    edge="end"
                    onChange={acceptInvite(value)}
                    checked={invitesAccepted.has(value)}
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
