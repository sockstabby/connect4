import { GameState } from "./types";

const initialGameState: GameState = {
  colState: [[], [], [], [], [], [], []],
  yellowWins: 0,
  redWins: 0,
  initiator: false,
  initiatorColor: "red",
  plays: 0,
  mainMenuOpen: false,
  mode: "local",
  rulesOpen: false,
  draw: false,
  player1: "Player 1",
  player2: "Player 2",
  gameStarted: false,
  opponent: "",
  remoteDisconnected: false,
  timerRef: undefined,
  timerSeconds: null,
  websocket: undefined,
  winner: null,
  winnerGameState: null,
  lastDroppedColumn: null,
  listenerAdded: false,
  disks: [],
  //this is a copy of disks at the moment somebody won or their is a draw.
  disksCopy: [],
  bottomTab: 0,
  invites: [],
  name: "",
  hasJoinedOnline: false,
  invitesSent: new Set(),
  playersOnline: [],
  invitesAccepted: new Set(),
  timerSecondsConfig: null,
};

export default initialGameState;
