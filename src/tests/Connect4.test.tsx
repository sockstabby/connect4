import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { Client, Server } from "mock-socket";

vi.stubGlobal("__APP_VERSION__", "0.1.0");
vi.stubGlobal("__COMMIT_HASH__", "febaea");

const TEST_WS_URL = "ws://localhost:5000";
const REMOTE_PLAYER_NAME = "somebody";
const REMOTE_PLAYER_NAME2 = "somebody who wants to play";
const MY_NAME = "the best player ever";
const websocketServer = new Server(TEST_WS_URL);

const DEBUG = false;

const winMovesPlayer1 = [0, 0, 0, 0];
const winMovesPlayer2 = [1, 1, 1];

const drawMovesPlayer1 = [
  0, 2, 4, 6, 2, 4, 2, 4, 3, 1, 1, 5, 5, 0, 0, 0, 6, 6, 2, 4, 3,
];

const drawMovesPlayer2 = [
  1, 3, 5, 1, 3, 5, 3, 2, 4, 1, 1, 5, 5, 0, 0, 6, 6, 6, 3, 2, 4,
];

const getMovePayload = (move: number, moves: number[]) => {
  const payload = {
    message: "playTurn",

    data: {
      turn: { col: moves[move] },
    },
  };
  return payload;
};

async function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), milliseconds);
  });
}

describe("Connect4", () => {
  it("online win mode -- the first turn alternates between players after each game. win counts incremented", async () => {
    let socket: Client;

    websocketServer.on("connection", (websocket) => {
      socket = websocket;

      websocket.on(
        "message",
        (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
          if (DEBUG) {
            console.log(
              Date.now(),
              "Received a message from the client",
              message
            );
          }

          const payload = JSON.parse(message as string);

          if (payload.action === "joinLobby") {
            socket.send(
              JSON.stringify({
                message: "lobbyParticipants",
                data: [{ name: REMOTE_PLAYER_NAME }],
              })
            );

            socket.send(
              JSON.stringify({
                message: "playRequested",
                data: REMOTE_PLAYER_NAME2,
              })
            );

            if (DEBUG) {
              console.log(Date.now(), "sending start game move");
            }
            socket.send(
              JSON.stringify({
                message: "startGame",

                data: {
                  initiator: false,
                  initiatorName: REMOTE_PLAYER_NAME2,
                  nonInitiatorName: "me",
                },
              })
            );
          }
        }
      );
    });

    render(<App websocketUrl={TEST_WS_URL} />);

    fireEvent.click(await screen.findByText(/menu/i));
    await screen.findByText(/Player One Name/i);
    fireEvent.click(await screen.findByText(/menu/i));
    const onlineSwitch = await screen.findByTestId("online-switch");
    fireEvent.click(onlineSwitch);
    const nameInput = await screen.findByTestId("online-name");
    fireEvent.change(nameInput, {
      target: { value: MY_NAME },
    });
    fireEvent.click(await screen.findByText(/join lobby/i));
    await screen.findByText(/note: a timer/i, undefined, { timeout: 1000 });

    for (let i = 0; i < winMovesPlayer1.length; i++) {
      await act(async () => {
        // gameplay begins here we go second
        const send = getMovePayload(i, winMovesPlayer1);
        socket!.send(JSON.stringify(send));
      });
      if (i < 3) {
        await act(async () => {
          const columnName = `drop-column-${winMovesPlayer2[i]}`;
          fireEvent.click(
            await screen.findByTestId(columnName, undefined, { timeout: 1000 })
          );
        });
      }
    }

    let winner = await screen.findByTestId("winning-player", undefined, {
      timeout: 1000,
    });

    expect(winner.innerHTML).toEqual("red");

    ////////////////////////////////////////////////////////////
    // this time we get the first move
    await act(async () => {
      fireEvent.click(screen.getByText(/Play Again/i));
      await wait(100);
    });

    for (let i = 0; i < winMovesPlayer1.length; i++) {
      await act(async () => {
        const columnName = `drop-column-${winMovesPlayer1[i]}`;
        fireEvent.click(
          await screen.findByTestId(columnName, undefined, { timeout: 1000 })
        );
      });
      if (i < 3) {
        await act(async () => {
          // gameplay begins here we go second
          const send = getMovePayload(i, winMovesPlayer2);
          socket!.send(JSON.stringify(send));
        });
      }
    }

    winner = await screen.findByTestId("winning-player");

    expect(winner.innerHTML).toEqual("yellow");

    let redWinCount = screen.getByTestId("red-win-count");
    let yellowWinCount = screen.getByTestId("yellow-win-count");
    expect(redWinCount.innerHTML).toEqual("1");
    expect(yellowWinCount.innerHTML).toEqual("1");

    // here's a cool edge case to hit. lets fire a play on the socket while the win modal is stil open
    // this simulate the case where the remote player sends a move while the local player is
    // still reflecting on the game and has not pressed Play Again yet.
    // this move is not visible until the player presses play again.

    await act(async () => {
      const send = getMovePayload(0, winMovesPlayer1);
      socket!.send(JSON.stringify(send));
      await wait(100);
    });

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/win/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Play Again/i));

    expect(screen.queryByText(/Play again/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/win/i)).not.toBeInTheDocument();

    await act(async () => {
      const columnName = `drop-column-${winMovesPlayer2[0]}`;
      fireEvent.click(
        await screen.findByTestId(columnName, undefined, { timeout: 1000 })
      );
    });

    for (let i = 1; i < winMovesPlayer1.length; i++) {
      await act(async () => {
        const send = getMovePayload(i, winMovesPlayer1);
        socket!.send(JSON.stringify(send));
      });
      if (i < 3) {
        await act(async () => {
          const columnName = `drop-column-${winMovesPlayer2[i]}`;
          fireEvent.click(
            await screen.findByTestId(columnName, undefined, { timeout: 1000 })
          );
        });
      }
    }

    winner = await screen.findByTestId("winning-player");
    expect(winner.innerHTML).toEqual("red");

    redWinCount = await screen.getByTestId("red-win-count");
    yellowWinCount = await screen.getByTestId("yellow-win-count");
    expect(redWinCount.innerHTML).toEqual("2");
    expect(yellowWinCount.innerHTML).toEqual("1");

    await act(async () => {
      //finally we test the scenario where remote quits after it won
      socket!.send(
        JSON.stringify({
          message: "playTurn",

          data: {
            turn: -1,
          },
        })
      );
    });

    const div = screen.queryByText("Remote Player Quit");
    expect(div).toBeInTheDocument();

    // Note: we should also test the scenario where we quit after a game
    //screen.debug();
  }, 2000);

  it("local mode -- first turn alternates", () => {
    render(<App />);
    fireEvent.click(screen.getByText(/menu/i));
    const player1Input = screen.getByLabelText("Player One Name:");
    const player2Input = screen.getByLabelText("Player Two Name:");
    fireEvent.change(player1Input, { target: { value: "PLAYER TEST NAME 1" } });
    fireEvent.change(player2Input, { target: { value: "PLAYER TEST NAME 2" } });
    fireEvent.click(screen.getByText(/start game/i));
    let redWinCount = screen.getByTestId("red-win-count").innerHTML;
    let yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;
    expect(redWinCount).toEqual("0");
    expect(yellowWinCount).toEqual("0");
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    let winner = screen.getByTestId("winning-player").innerHTML;

    expect(winner).toEqual("red");

    redWinCount = screen.getByTestId("red-win-count").innerHTML;
    yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("1");
    expect(yellowWinCount).toEqual("0");

    fireEvent.click(screen.getByText(/play again/i));

    // this time yellow goes first
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    fireEvent.click(screen.getByTestId("drop-column-1"));
    fireEvent.click(screen.getByTestId("drop-column-0"));
    winner = screen.getByTestId("winning-player").innerHTML;

    expect(winner).toEqual("yellow");

    redWinCount = screen.getByTestId("red-win-count").innerHTML;
    yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("1");
    expect(yellowWinCount).toEqual("1");
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////
  it("online draw mode -- play alternates after a draw. win counts not incremented", async () => {
    let socket: Client;

    websocketServer.on("connection", (websocket) => {
      socket = websocket;

      websocket.on(
        "message",
        (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
          if (DEBUG) {
            console.log(
              Date.now(),
              "Received a message from the client",
              message
            );
          }

          const payload = JSON.parse(message as string);

          if (payload.action === "joinLobby") {
            socket.send(
              JSON.stringify({
                message: "lobbyParticipants",
                data: [{ name: REMOTE_PLAYER_NAME }],
              })
            );

            socket.send(
              JSON.stringify({
                message: "playRequested",
                data: REMOTE_PLAYER_NAME2,
              })
            );

            if (DEBUG) {
              console.log(Date.now(), "sending start game move");
            }
            socket.send(
              JSON.stringify({
                message: "startGame",

                data: {
                  initiator: true,
                  initiatorName: REMOTE_PLAYER_NAME2,
                  nonInitiatorName: "me",
                },
              })
            );
          }
        }
      );
    });

    render(<App websocketUrl={TEST_WS_URL} />);

    fireEvent.click(await screen.findByText(/menu/i));
    await screen.findByText(/Player One Name/i);
    fireEvent.click(await screen.findByText(/menu/i));
    const onlineSwitch = await screen.findByTestId("online-switch");
    fireEvent.click(onlineSwitch);
    const nameInput = await screen.findByTestId("online-name");
    fireEvent.change(nameInput, {
      target: { value: MY_NAME },
    });
    fireEvent.click(await screen.findByText(/join lobby/i));
    await screen.findByText(/note: a timer/i, undefined, { timeout: 1000 });

    for (let i = 0; i < drawMovesPlayer1.length; i++) {
      await act(async () => {
        const columnName = `drop-column-${drawMovesPlayer1[i]}`;
        fireEvent.click(
          await screen.findByTestId(columnName, undefined, {
            timeout: 1000,
          })
        );
      });

      await act(async () => {
        const send = getMovePayload(i, drawMovesPlayer2);
        socket!.send(JSON.stringify(send));
      });
    }

    // assert draw modal open
    // then lets send a move on the socket while the draw modal is open
    // since we went first the socket simulation goes first this time
    // and it should be easy to simulate

    // when the move is sent on the socket. the game board should remain unchanged so the
    // player can reflect on the stalemate game. it is only when the user presses play again
    // that the stalemate game is cleared and the move that was played on the socket should be visible.

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).toBeInTheDocument();

    await act(async () => {
      const send = getMovePayload(0, drawMovesPlayer1);
      socket!.send(JSON.stringify(send));
    });

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).toBeInTheDocument();

    // cool now lets press play again

    fireEvent.click(screen.getByText(/play again/i));

    expect(screen.queryByText(/Play again/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).not.toBeInTheDocument();

    // now send our first move
    await act(async () => {
      const columnName = `drop-column-${drawMovesPlayer2[0]}`;
      fireEvent.click(
        await screen.findByTestId(columnName, undefined, {
          timeout: 1000,
        })
      );
    });

    // play out another draw with plays alternated
    for (let i = 1; i < drawMovesPlayer1.length; i++) {
      await act(async () => {
        // gameplay begins here we go second
        const send = getMovePayload(i, drawMovesPlayer1);
        socket!.send(JSON.stringify(send));
      });

      await act(async () => {
        const columnName = `drop-column-${drawMovesPlayer2[i]}`;
        fireEvent.click(
          await screen.findByTestId(columnName, undefined, {
            timeout: 1000,
          })
        );
      });
    }

    // to do: make sure win counts are unchanged.

    const redWinCount = screen.getByTestId("red-win-count").innerHTML;
    const yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("0");
    expect(yellowWinCount).toEqual("0");

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).toBeInTheDocument();
  });

  it("local timeout mode", async () => {
    render(<App gameTimerConfig={1} />);

    fireEvent.click(await screen.findByText(/menu/i));
    fireEvent.click(await screen.findByText(/start game/i));

    fireEvent.click(await screen.findByTestId("drop-column-0"));
    fireEvent.click(await screen.findByTestId("drop-column-1"));

    await act(async () => {
      await wait(1500);
    });

    // NOTE: this is the source of Warning: The current testing environment is not configured to support act(...)
    await act(async () => {
      const winner = await screen.findByTestId("winning-player");
      expect(winner.innerHTML).toEqual("yellow");
    });

    const redWinCount = screen.getByTestId("red-win-count").innerHTML;
    const yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("0");
    expect(yellowWinCount).toEqual("1");
  });

  it("online timeout mode", async () => {
    let socket: Client;

    websocketServer.on("connection", (websocket) => {
      socket = websocket;

      websocket.on(
        "message",
        (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
          if (DEBUG) {
            console.log(
              Date.now(),
              "Received a message from the client",
              message
            );
          }

          const payload = JSON.parse(message as string);

          if (payload.action === "joinLobby") {
            socket.send(
              JSON.stringify({
                message: "lobbyParticipants",
                data: [{ name: REMOTE_PLAYER_NAME }],
              })
            );

            socket.send(
              JSON.stringify({
                message: "playRequested",
                data: REMOTE_PLAYER_NAME2,
              })
            );

            if (DEBUG) {
              console.log(Date.now(), "sending start game move");
            }
            socket.send(
              JSON.stringify({
                message: "startGame",

                data: {
                  initiator: true,
                  initiatorName: REMOTE_PLAYER_NAME2,
                  nonInitiatorName: "me",
                },
              })
            );
          }
        }
      );
    });

    render(<App gameTimerConfig={1} websocketUrl={TEST_WS_URL} />);

    fireEvent.click(await screen.findByText(/menu/i));
    await screen.findByText(/Player One Name/i);
    fireEvent.click(await screen.findByText(/menu/i));
    const onlineSwitch = await screen.findByTestId("online-switch");
    fireEvent.click(onlineSwitch);
    const nameInput = await screen.findByTestId("online-name");
    fireEvent.change(nameInput, {
      target: { value: MY_NAME },
    });
    fireEvent.click(await screen.findByText(/join lobby/i));
    await screen.findByText(/note: a timer/i, undefined, { timeout: 1000 });

    await act(async () => {
      const columnName = `drop-column-${drawMovesPlayer1[0]}`;
      fireEvent.click(
        await screen.findByTestId(columnName, undefined, {
          timeout: 1000,
        })
      );
    });

    await act(async () => {
      const send = getMovePayload(0, drawMovesPlayer2);
      socket!.send(JSON.stringify(send));
    });

    // we started the game so we are red. this delay should cause us to lose the game
    await act(async () => {
      await wait(1500);
    });

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/win/i)).toBeInTheDocument();

    let redWinCount = screen.getByTestId("red-win-count").innerHTML;
    let yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("0");
    expect(yellowWinCount).toEqual("1");

    // simulate the remote player sending its first move while the win modal is still up

    await act(async () => {
      const send = getMovePayload(0, drawMovesPlayer1);
      socket!.send(JSON.stringify(send));
    });

    // cool now lets press play again

    fireEvent.click(screen.getByText(/play again/i));

    expect(screen.queryByText(/Play again/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).not.toBeInTheDocument();

    // delaying here doesnt affect us because at least two moves are necessary for the timer to come into play
    await act(async () => {
      await wait(1500);
    });

    expect(screen.queryByText(/Play again/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Draw/i)).not.toBeInTheDocument();

    await act(async () => {
      const columnName = `drop-column-${drawMovesPlayer1[1]}`;
      fireEvent.click(
        await screen.findByTestId(columnName, undefined, {
          timeout: 1000,
        })
      );
    });

    // this time we simulate the remote player being to
    await act(async () => {
      await wait(1500);
    });

    expect(screen.queryByText(/Play again/i)).toBeInTheDocument();
    expect(screen.queryByText(/Win/i)).toBeInTheDocument();

    redWinCount = screen.getByTestId("red-win-count").innerHTML;
    yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;

    expect(redWinCount).toEqual("1");
    expect(yellowWinCount).toEqual("1");
  }, 8000);
});
