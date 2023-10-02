import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { Server } from "mock-socket";

const TEST_WS_URL = "ws://localhost:5000";
const REMOTE_PLAYER_NAME = "somebody";
const REMOTE_PLAYER_NAME2 = "somebody who wants to play";
const MY_NAME = "the best player ever";
const websocketServer = new Server(TEST_WS_URL);

// second game is weird because we dont we send a turn after a delay
// to start a fresh game. We need the delay so the client has enough
// time to press Play again.
let secondGame = false;
const myMoves = [0, 0, 0, 0];

const getMovePayload = (move: number, moves: number[]) => {
  const payload = {
    message: "playTurn",

    data: {
      turn: { col: moves[move] },
    },
  };
  return payload;
};

let myMovesCount = 0;
let g_socket;

websocketServer.on("connection", (socket) => {
  g_socket = socket;
  socket.on("message", (message) => {
    console.log(Date.now(), "Received a message from the client", message);

    const payload = JSON.parse(message as any);

    console.log("payload = ", payload);

    console.log("debug myMovesCount", myMovesCount);

    if (myMovesCount === 3 && secondGame && payload.action === "playTurn") {
      console.log("on second game so we send after a delay");

      // second game is weird because we send a turn after a delay
      // to start a fresh game. We need the delay so the client has enough
      // time to press Play again.

      setTimeout(() => {
        secondGame = false;

        console.log("sending the first turn of the game");

        const send = getMovePayload(myMovesCount, myMoves);
        console.log(Date.now(), "server sending playTurn move");
        socket.send(JSON.stringify(send));
        myMovesCount++;
      }, 1000);
    } else {
      if (payload.action === "playTurn") {
        console.log(
          Date.now(),
          "server received a play turn payload = ",
          payload
        );

        const send = getMovePayload(myMovesCount, myMoves);
        console.log(Date.now(), "server sending playTurn move");
        socket.send(JSON.stringify(send));
        myMovesCount++;
      }
    }
  });

  // this following code will start up a game and play the first turn

  const payload1 = {
    message: "lobbyParticipants",
    data: [{ name: REMOTE_PLAYER_NAME }],
  };

  socket.send(JSON.stringify(payload1));

  const payload2 = {
    message: "playRequested",
    data: REMOTE_PLAYER_NAME2,
  };

  socket.send(JSON.stringify(payload2));

  const payload3 = {
    message: "startGame",

    data: {
      initiator: false,
      initiatorName: REMOTE_PLAYER_NAME2,
      nonInitiatorName: "me",
    },
  };

  socket.send(JSON.stringify(payload3));
  const send = getMovePayload(myMovesCount, myMoves);
  console.log("sending start game move");
  socket.send(JSON.stringify(send));
  myMovesCount++;
});

async function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), milliseconds);
  });
}

describe("Connect4", () => {
  it("connect4 online gameplay play alternatess", async () => {
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

    await act(async () => {
      // this is needed to get rid of act warnings :-(
      await wait(1000);
    });

    await screen.findByText(/note: a timer/i);

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    let winner = await screen.findByTestId("winning-player");

    expect(winner.innerHTML).toEqual("red");

    ////////////////////////////////////////////////////////////

    myMovesCount = 0;

    await act(async () => {
      fireEvent.click(screen.getByText(/Play Again/i));
    });

    console.log("starting new game");

    secondGame = true;

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    // await act(async () => {
    //   // this is needed to get rid of act warnings :-(
    //   // await wait(800);
    // });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      // this is needed to get rid of act warnings :-(
      await wait(800);
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      // this is needed to get rid of act warnings :-(
      await wait(500);
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    winner = await screen.findByTestId("winning-player");

    expect(winner.innerHTML).toEqual("yellow");

    console.log("myMovesCount", myMovesCount);

    // screen.debug();

    let redWinCount = await screen.getByTestId("red-win-count");
    let yellowWinCount = await screen.getByTestId("yellow-win-count");
    expect(redWinCount.innerHTML).toEqual("1");
    expect(yellowWinCount.innerHTML).toEqual("1");

    fireEvent.click(screen.getByText(/Play Again/i));

    await act(async () => {
      // this is needed to get rid of act warnings :-(
      await wait(5000);
    });

    ////////////////////////////////////////////////////////////

    myMovesCount = 0;

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId("drop-column-1"));
      await wait(1000);
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
      g_socket!.send(
        JSON.stringify({
          message: "playTurn",

          data: {
            turn: -1,
          },
        })
      );
      await wait(500);
    });

    const div = await screen.queryByText("Remote Player Quit");
    expect(div).toBeInTheDocument();

    // we should also test the scenario where we quit after a game
    //screen.debug();
  }, 12000);

  it("connect4 local gameplay", () => {
    // render(<App />);
    // fireEvent.click(screen.getByText(/menu/i));
    // const player1Input = screen.getByLabelText("Player One Name:");
    // const player2Input = screen.getByLabelText("Player Two Name:");
    // fireEvent.change(player1Input, { target: { value: "PLAYER TEST NAME 1" } });
    // fireEvent.change(player2Input, { target: { value: "PLAYER TEST NAME 2" } });
    // fireEvent.click(screen.getByText(/start game/i));
    // let redWinCount = screen.getByTestId("red-win-count").innerHTML;
    // let yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;
    // expect(redWinCount).toEqual("0");
    // expect(yellowWinCount).toEqual("0");
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // let winner = screen.getByTestId("winning-player").innerHTML;
    // expect(winner).toEqual("red");
    // redWinCount = screen.getByTestId("red-win-count").innerHTML;
    // yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;
    // expect(redWinCount).toEqual("1");
    // expect(yellowWinCount).toEqual("0");
    // fireEvent.click(screen.getByText(/play again/i));
    // // this time yellow goes first
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // fireEvent.click(screen.getByTestId("drop-column-1"));
    // fireEvent.click(screen.getByTestId("drop-column-0"));
    // winner = screen.getByTestId("winning-player").innerHTML;
    // expect(winner).toEqual("yellow");
    // redWinCount = screen.getByTestId("red-win-count").innerHTML;
    // yellowWinCount = screen.getByTestId("yellow-win-count").innerHTML;
    // expect(redWinCount).toEqual("1");
    // expect(yellowWinCount).toEqual("1");
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
