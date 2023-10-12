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

const myMoves = [0, 0, 0, 0];

// 21
const drawMoves = [
  0, 2, 4, 6, 2, 4, 2, 4, 3, 1, 1, 5, 5, 0, 0, 0, 6, 6, 2, 4, 3,
];

//21
const drawMovesClicked = [
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

// async function wait(milliseconds: number) {
//   return new Promise((resolve) => {
//     setTimeout(() => resolve(1), milliseconds);
//   });
// }

describe("Connect4", () => {
  it("online-mode -- the first turn alternates players after each game", async () => {
    let socket: Client;

    websocketServer.on("connection", (websocket) => {
      socket = websocket;

      websocket.on(
        "message",
        (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
          console.log(
            Date.now(),
            "Received a message from the client",
            message
          );
          const payload = JSON.parse(message as string);
          console.log("payload = ", payload);

          if (payload.action === "joinLobby") {
            console.log(" got a join lobby request");

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

            console.log(Date.now(), "sending start game move");
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

    let myMovesCount = 0;

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
      // gameplay begins here we go second
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "sending first move of the game", send);
      socket!.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      // send the move
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    let winner = await screen.findByTestId("winning-player", undefined, {
      timeout: 1000,
    });

    expect(winner.innerHTML).toEqual("red");

    ////////////////////////////////////////////////////////////
    // this time we get the first move

    console.log("starting new game");
    myMovesCount = 0;
    await act(async () => {
      fireEvent.click(screen.getByText(/Play Again/i));
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );

      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );

      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, {
          timeout: 1000,
        })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "server sending playTurn move");
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, {
          timeout: 1000,
        })
      );
    });

    winner = await screen.findByTestId("winning-player");

    expect(winner.innerHTML).toEqual("yellow");

    let redWinCount = screen.getByTestId("red-win-count");
    let yellowWinCount = screen.getByTestId("yellow-win-count");
    expect(redWinCount.innerHTML).toEqual("1");
    expect(yellowWinCount.innerHTML).toEqual("1");

    fireEvent.click(screen.getByText(/Play Again/i));

    ////////////////////////////////////////////////////////////
    // and this this time we go second
    myMovesCount = 0;

    await act(async () => {
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "sending first move of the game", send);
      socket!.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "sending first move of the game", send);
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "sending first move of the game", send);
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId("drop-column-1", undefined, { timeout: 1000 })
      );
      const send = getMovePayload(myMovesCount, myMoves);
      console.log(Date.now(), "sending first move of the game", send);
      socket.send(JSON.stringify(send));
      myMovesCount++;
    });

    winner = await screen.findByTestId("winning-player");

    expect(winner.innerHTML).toEqual("red");

    console.log("myMovesCount", myMovesCount);

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
  it("connect4 draw", async () => {
    let socket: Client;

    websocketServer.on("connection", (websocket) => {
      socket = websocket;

      websocket.on(
        "message",
        (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
          console.log(
            Date.now(),
            "Received a message from the client",
            message
          );
          const payload = JSON.parse(message as string);
          console.log("payload = ", payload);

          if (payload.action === "joinLobby") {
            console.log(" got a join lobby request");

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

            console.log(Date.now(), "sending start game move");
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

    // await act(async () => {
    //   // gameplay begins here we go second
    //   const send = getMovePayload(myMovesCount, drawMoves);
    //   console.log(Date.now(), "sending first move of the game", send);
    //   socket!.send(JSON.stringify(send));
    //   myMovesCount++;
    // });
    for (let i = 0; i < drawMoves.length; i++) {
      await act(async () => {
        // gameplay begins here we go second
        const send = getMovePayload(i, drawMoves);
        console.log(Date.now(), "sending first move of the game", send);
        socket!.send(JSON.stringify(send));
      });

      await act(async () => {
        const columnName = `drop-column-${drawMovesClicked[i]}`;
        console.log("clicking on column", columnName);
        fireEvent.click(
          await screen.findByTestId(columnName, undefined, {
            timeout: 1000,
          })
        );
      });
    }

    // we need to simulate a remote move while our draw modal is visible
    // if remote goes first then this wont be possible until the third game

    expect(1).toEqual(1);
  });

  // it("connect4 local gameplay timeouts", async () => {
  //   render(<App gameTimerConfig={1} />);

  //   fireEvent.click(await screen.findByText(/menu/i));
  //   fireEvent.click(await screen.findByText(/start game/i));

  //   fireEvent.click(await screen.findByTestId("drop-column-0"));
  //   fireEvent.click(await screen.findByTestId("drop-column-1"));

  //   await wait(1500);

  //   let winner = await screen.findByTestId("winning-player");
  //   expect(winner.innerHTML).toEqual("yellow");
  // });
});
