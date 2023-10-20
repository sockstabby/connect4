import GameBoard from "./GameBoard";
import BottomNavigation from "@mui/material/BottomNavigation";
import Paper from "@mui/material/Paper";
import RestoreIcon from "@mui/icons-material/Restore";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useEffect, useReducer } from "react";
import CheckCircle from "../src/assets/check-circle.svg";
import ReactModal from "react-modal";
import StartGameModal from "./StartGameModal";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import DescriptionIcon from "@mui/icons-material/Description";

import useSocket from "./useSocket";

import { AppProps } from "./types";
import { mainReducer } from "./reducerFunctions";
import StartGameOnlineForm from "./StartGameOnline";
import Invites from "./Invites";

import initialGameState from "./InitialGameState";
import MuiBottomNavigationAction from "@mui/material/BottomNavigationAction";

import { styled } from "@mui/material/styles";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "./Logo";

const BottomNavigationAction = styled(MuiBottomNavigationAction)(`
  color: white;
  background-color: indigo;
  &.Mui-selected {
    color: #fd6687;
  }
`);

const Rules = () => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row justify-center text-4xl font-extrabold	">
        RULES
      </div>

      <div className="flex flex-row">
        <h1>Objective</h1>
      </div>

      <div className="flex flex-row">
        <p className="text-left">
          Be the first player to connect 4 of the same colored discs in a row
          (either vertically, horizontally, or diagonally).
        </p>
      </div>

      <div className="flex flex-row">
        <h1>How To Play</h1>
      </div>

      <ol className="rule-list">
        <li>Red goes first in the first game.</li>

        <li>
          Players must alternate turns, and only one disc can be dropped in each
          turn.
        </li>

        <li>The game ends when there is a 4-in-a-row or a stalemate.</li>

        <li>The starter of the previous game goes second on the next game.</li>
      </ol>
      <div className="flex flex-row justify-center">
        <div className="check-circle">
          <img src={CheckCircle}></img>
        </div>
      </div>
    </div>
  );
};

const theme = createTheme({
  typography: {
    fontFamily: ['"Space Grotesk"'].join(","),
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          // Controls default (unchecked) color for the thumb
          color: "#ccc",
        },
        colorPrimary: {
          "&.Mui-checked": {
            // Controls checked color for the thumb
            color: "#fd6687",
          },
        },
        track: {
          // Controls default (unchecked) color for the track
          opacity: 0.2,
          backgroundColor: "#fff",
          ".Mui-checked.Mui-checked + &": {
            // Controls checked color for the track
            opacity: 0.7,
            backgroundColor: "#fff",
          },
        },
      },
    },
  },
});

export const App = ({
  timerEnabled = true,
  gameTimerConfig = 24,
  websocketUrl = "wss://connect4.isomarkets.com",
}: AppProps) => {
  const [state, dispatch] = useReducer(mainReducer, initialGameState);
  useSocket({ state, dispatch });

  useEffect(() => {
    ReactModal.setAppElement("body");
  }, []);

  const openMainMenuModal = () => {
    dispatch({ type: "mainMenuModalVisible", value: true });
  };

  const restartGame = () => {
    dispatch({ type: "restartGame" });
  };

  const closeMainMenuModal = () => {
    dispatch({ type: "mainMenuModalVisible", value: false });
  };

  const playAgain = () => {
    dispatch({ type: "playAgain" });
  };

  const terminateGame = (notifyRemote = true) => {
    dispatch({ type: "terminateGame", value: { notifyRemote } });
  };

  let activeWidget;
  if (state.bottomTab === 0) {
    activeWidget = (
      <>
        <Logo />
        {/* version {` ${__APP_VERSION__} ${__COMMIT_HASH__}`} */}
        {/* nav bar buttons get styled out in css and is replaced by the bottom nav bar*/}
        <div className="main nav-bar flex flex-row justify-around pt-3 items-center">
          <button onClick={openMainMenuModal}>Menu</button>
          <button onClick={restartGame} disabled={state.mode === "online"}>
            Restart
          </button>
        </div>
        <div
          className={`bottom-plate ${
            state.winner != null ? "bottom-plate--" + state.winner.player : ""
          } `}
        ></div>
        <GameBoard
          timerEnabled={timerEnabled}
          state={state}
          dispatch={dispatch}
          gameTimerConfig={gameTimerConfig}
          websocketUrl={websocketUrl}
        />
      </>
    );
  } else if (state.bottomTab === 1) {
    activeWidget = (
      <div className="modal modal__rules modal--light-background pt-5 pb-8 align-top">
        <Rules />
      </div>
    );
  } else if (state.bottomTab === 2) {
    activeWidget = (
      <StartGameOnlineForm
        dispatch={dispatch}
        state={state}
        websocketUrl={websocketUrl}
      ></StartGameOnlineForm>
    );
  } else if (state.bottomTab === 3) {
    activeWidget = <Invites state={state} dispatch={dispatch}></Invites>;
  }

  return (
    <ThemeProvider theme={theme}>
      {activeWidget}
      <ReactModal
        className="modal main modal--dark-background centered"
        isOpen={state.mainMenuOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={closeMainMenuModal}
        overlayClassName="disabled-background"
      >
        <StartGameModal
          state={state}
          dispatch={dispatch}
          websocketUrl={websocketUrl}
        />
      </ReactModal>
      <ReactModal
        className="modal modal__rules modal--light-background centered pt-5 pb-8"
        isOpen={state.rulesOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          dispatch({ type: "rulesOpen", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <Rules />
      </ReactModal>
      <ReactModal
        className="modal modal--light-background modal--bottom-placement"
        isOpen={state.remoteDisconnected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          dispatch({ type: "remoteDisconnected", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-row justify-center uppercase text-black">
            Remote Player Quit
          </div>

          <button
            onClick={() => {
              dispatch({ type: "remoteDisconnected", value: false });
            }}
            className="uppercase"
          >
            Ok
          </button>
        </div>
      </ReactModal>
      <ReactModal
        className="modal modal--light-background modal--bottom-placement"
        isOpen={
          (state.winner != null || state.draw) && !state.remoteDisconnected
        }
        shouldCloseOnOverlayClick={false}
        overlayClassName="disabled-background"
      >
        <div className="flex flex-col justify-center">
          <div
            className="uppercase text-black text-center"
            data-testid="winning-player"
          >
            {state.winner && `${state.winner!.player}`}
          </div>
          {state.draw && (
            <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
              Draw
            </div>
          )}
          {!state.draw && (
            <div className="uppercase text-center text-5xl font-bold pt-1 text-black">
              Wins
            </div>
          )}
          <div className="flex flex-row justify-center gap-5 pt-6">
            <button onClick={() => terminateGame()} className="uppercase">
              Quit
            </button>

            <button onClick={playAgain} className="uppercase">
              Play Again
            </button>
          </div>
        </div>
      </ReactModal>

      <Paper
        className="bottom-nav-bar"
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={state.bottomTab}
          onChange={(_, tab) => {
            dispatch({ type: "setBottomTab", value: tab });
          }}
        >
          <BottomNavigationAction label="Game" icon={<RestoreIcon />} />
          <BottomNavigationAction label="Rules" icon={<DescriptionIcon />} />

          <BottomNavigationAction label="Lobby" icon={<PeopleOutlineIcon />} />
          <BottomNavigationAction label="Invites" icon={<CloudQueueIcon />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
};

export default App;
