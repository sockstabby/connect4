export type Column = string[];

export type Winner = {
  pieces: Locations;
  player: string;
};

export type ColState = Column[];

export type AnimatedDisk = {
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
  animatedDisks: AnimatedDisk[];
  animatedDisksCopy: AnimatedDisk[];
};

////////////////////////////////////////////////////////////////
// Modal

export type GameMode = "online" | "local";

export type Player = {
  name: string;
};

export type StartGameModalProps = {
  onStartGame: (
    initiator: boolean,
    opponent: string,
    mode: GameMode,
    player1: string,
    player2: string,
    socket?: WebSocket
  ) => void;
  onClose: () => void;
  websocketUrl: string;
  setSocket: (socket: WebSocket) => void;
};

//////

// UTIL
export type Location = {
  col: number;
  row: number;
};

export type Locations = Location[];

export type Connect4Props = {
  gameTimerConfig?: number;
  websocketUrl?: string;
};
