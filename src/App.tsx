import GameBoard from "./GameBoard";

import Lobby from "./Lobby";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import RestoreIcon from "@mui/icons-material/Restore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArchiveIcon from "@mui/icons-material/Archive";
import { useState } from "react";

export const App = () => {
  const [bottomTab, setBottomTab] = useState(0);

  console.log("bottomTab = ", bottomTab);

  let widget;
  if (bottomTab === 0) {
    widget = <GameBoard />;
  } else if (bottomTab === 1) {
    widget = <Lobby />;
  }

  return (
    <>
      {widget}
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={bottomTab}
          onChange={(event, newValue) => {
            setBottomTab(newValue);
          }}
        >
          <BottomNavigationAction label="Game" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Local" icon={<FavoriteIcon />} />
          <BottomNavigationAction label="Invites" icon={<ArchiveIcon />} />
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default App;
