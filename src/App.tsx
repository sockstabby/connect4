import GameBoard from "./GameBoard";
import GameLogo from "../src/assets/game-logo.svg";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import RestoreIcon from "@mui/icons-material/Restore";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useCallback, useEffect, useReducer } from "react";
import CheckCircle from "../src/assets/check-circle.svg";
import ReactModal from "react-modal";
import StartGameModal from "./StartGameModal";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

import useSocket from "./useSocket";

import { AppProps } from "./types";
import { mainReducer } from "./reducerFunctions";
import StartGameOnlineForm from "./StartGameOnline";
import Invites from "./Invites";

import initialGameState from "./InitialGameState";

import { createTheme, ThemeProvider } from "@mui/material/styles";

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

// these should be props
const TIMER_ENABLED = true;

const TIMER_SECONDS = 24;

export const App = ({
  gameTimerConfig = TIMER_SECONDS,
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

  const terminateGame = useCallback((notifyRemote = true) => {
    dispatch({ type: "terminateGame", value: { notifyRemote } });
  }, []);

  let activeWidget;
  if (state.bottomTab === 0) {
    activeWidget = (
      <>
        version {` ${__APP_VERSION__} ${__COMMIT_HASH__}`}
        {/* nav bar buttons get styled out in css and is replaced by the bottom nav bar*/}
        <div className="main nav-bar flex flex-row justify-around pt-3 items-center">
          <button onClick={openMainMenuModal}>Menu</button>

          <img
            src={GameLogo}
            alt="Game logo image of disks stacked ontop of eachother"
          ></img>

          <button onClick={restartGame} disabled={state.mode === "online"}>
            Restart
          </button>
        </div>
        <div
          className={`bottom-plate ${
            state.winner != null ? state.winner.player : ""
          } `}
        ></div>
        <GameBoard
          timerEnabled={TIMER_ENABLED}
          state={state}
          dispatch={dispatch}
          gameTimerConfig={gameTimerConfig}
          websocketUrl={websocketUrl}
        />
      </>
    );
  } else if (state.bottomTab === 1) {
    activeWidget = (
      <StartGameOnlineForm
        dispatch={dispatch}
        state={state}
        websocketUrl={websocketUrl}
      ></StartGameOnlineForm>
    );
  } else if (state.bottomTab === 2) {
    activeWidget = <Invites state={state} dispatch={dispatch}></Invites>;
  }

  return (
    <ThemeProvider theme={theme}>
      {activeWidget}
      <ReactModal
        className="modal main modal__dark-background centered"
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
        className="modal modal__light-background centered"
        isOpen={state.rulesOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          dispatch({ type: "rulesOpen", value: false });
        }}
        overlayClassName="disabled-background"
      >
        <div className="rules-content pt-5 pb-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-center text-4xl font-extrabold	">
              RULES
            </div>
            <h1>Objective</h1>
            <div className="flex flex-row items start gap-3">
              <p>
                Be the first player to connect 4 of the same colored discs in a
                row (either vertically, horizontally, or diagonally).
              </p>
            </div>
            <h1>How To Play</h1>
            <div className="flex flex-row items start gap-3">
              <span> 1</span>
              <p>Red goes first in the first game.</p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 2</span>
              <p>
                Players must alternate turns, and only one disc can be dropped
                in each turn.
              </p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 3</span>
              <p>The game ends when there is a 4-in-a-row or a stalemate.</p>
            </div>
            <div className="flex flex-row items start gap-3">
              <span> 4</span>
              <p>
                The starter of the previous game goes second on the next game.
              </p>
            </div>
            <div className="flex flex-row justify-center">
              <div className="check-circle">
                <img src={CheckCircle}></img>
              </div>
            </div>
          </div>
        </div>
      </ReactModal>
      <ReactModal
        className="modal modal__light-background modal__bottom-placement"
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
        className="modal modal__light-background modal__bottom-placement"
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
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
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
          <BottomNavigationAction label="Local" icon={<PeopleOutlineIcon />} />
          <BottomNavigationAction label="Invites" icon={<CloudQueueIcon />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
};

export default App;
