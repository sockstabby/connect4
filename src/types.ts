export type Column = string[];

export type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

export type Disk = {
  color: string;
  row: number;
  col: number;
};

export type GameState = {
  colState: ColState;
  yellowWins: number;
  redWins: number;
  initiator: boolean;
  initiatorColor: string;
  plays: number;
  animatedPiece: number | null;
  animatedPieceColor: string | null;
  mainMenuOpen: boolean;
  mode: GameMode;
  draw: boolean;
  player1: string;
  player2: string;
  gameStarted: boolean;
  opponent: string;
  remoteDisconnected: boolean;
  timerRef: NodeJS.Timer | undefined;
  timerSeconds: number | null;
  forceRender: boolean;
  websocket: WebSocket | undefined;
  winner: Winner | null;
  winnerGameState: ColState | null;
  lastDroppedColumn: null | number;
  listenerAdded: boolean;
  disks: Disk[];
  disksCopy: Disk[];
  rulesOpen: boolean;
  bottomTab: number;
  invites: string[];
  name: string;
  hasJoinedOnline: boolean;
  invitesSent: Set<string>;
  playersOnline: string[];
  invitesAccepted: Set<string>;
};

export type GameMode = "online" | "local";

export type Player = {
  name: string;
};

export type StartGameModalProps = {
  dispatch: React.Dispatch<GameActions>;
  state: GameState;
  websocketUrl: string;
};

export type StartGameOnlineProps = {
  dispatch: React.Dispatch<GameActions>;
  state: GameState;
  websocketUrl: string;
};

export type UseSocketProps = {
  dispatch: React.Dispatch<GameActions>;
  state: GameState;
};

export type Location = {
  col: number;
  row: number;
};

export type AdjacencyFunctionReturnType = [boolean, Location[]];

export type AdjacencyFunction = (
  col: number,
  row: number,
  color: string,
  state: ColState
) => AdjacencyFunctionReturnType;

export type Locations = Location[];

export type Connect4Props = {
  gameTimerConfig: number;
  timerEnabled: boolean;
  websocketUrl?: string;
  dispatch: React.Dispatch<GameActions>;
  state: GameState;
};

export type InvitesProps = {
  state: GameState;
  dispatch: React.Dispatch<GameActions>;
};

export type AppProps = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
export type PlayTurnQuit = {
  message: "playTurn";
  data: { turn: -1 };
};

export type PlayTurn = {
  message: "playTurn";
  data: { turn: { col: number } };
};

export type PlayerInfo = {
  name: string;
};

export type LobbyParticipants = {
  message: "lobbyParticipants";
  data: PlayerInfo[];
};

export type PlayRequested = {
  message: "playRequested";
  data: string;
};

type StartGamePayload = {
  initiator: boolean;
  initiatorName: string;
  nonInitiatorName: string;
  // opponent is a unique id instead of a name. we always send moves to ids instead of names that can be guessed.
  opponent: string;
  opponentName: string;
};

export type StartGame = {
  message: "startGame";
  data: StartGamePayload;
};

export type ReducerPayload = {
  payload:
    | PlayTurnQuit
    | PlayTurn
    | LobbyParticipants
    | PlayRequested
    | StartGame;
  gameTimerConfig: number;
};

export type GameActions =
  | {
      type: "startGame";
      value: {
        initiator: boolean;
        opponent: string;
        mode: GameMode;
        player1: string;
        player2: string;
        websocket?: WebSocket;
      };
    }
  | {
      type: "diskDropped";
      value: { col: number; remote: boolean; gameTimerConfig: number };
    }
  | { type: "decrementSeconds" }
  | { type: "setWinner"; value: { player: string; pieces: Locations } }
  | { type: "terminateGame"; value: { notifyRemote: boolean } }
  | { type: "socketClosed" }
  | {
      type: "messageReceived";
      value: {
        payload: PlayTurn | PlayTurnQuit;
        gameTimerConfig: number;
      };
    }
  | { type: "setDisk" }
  | { type: "clearDisk" }
  | {
      type: "mainMenuModalVisible";
      value: boolean;
    }
  | { type: "playAgain" }
  | { type: "rulesOpen"; value: boolean }
  | { type: "restartGame" }
  | { type: "listenerAdded"; value: boolean }
  | { type: "remoteDisconnected"; value: boolean }
  | { type: "setBottomTab"; value: number }
  | { type: "addPlayerToInviteList"; value: string }
  | { type: "setName"; value: string }
  | { type: "joinLobby"; value: boolean }
  | { type: "sendInvite"; value: string }
  | { type: "setPlayersOnline"; value: string[] }
  | { type: "addPlayerToInvitesAccepted"; value: string }
  | { type: "setWebsocket"; value: WebSocket | undefined };
