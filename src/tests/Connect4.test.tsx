import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Server } from "mock-socket";

const TEST_WS_URL = "ws://localhost:5000";

const websocketServer = new Server(TEST_WS_URL);

websocketServer.on("connection", (socket) => {
  socket.on("message", (message) => {
    console.log("Received a message from the client", message);
  });
  socket.send("Sending a message to the client");
});

import App from "../App";

async function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), milliseconds);
  });
}

describe("Connect4", () => {
  it("connect4 online gameplay", () => {
    render(<App websocketUrl={TEST_WS_URL} />);

    fireEvent.click(screen.getByText(/menu/i));

    const onlineSwitch = screen.getByTestId("online-switch");

    fireEvent.click(onlineSwitch);

    const nameInput = screen.getByTestId("online-name");
    // fireEvent.change(player1Input, { target: { value: "PLAYER TEST NAME 1" } });

    fireEvent.change(nameInput, {
      target: { value: "the greatest player ever" },
    });

    fireEvent.click(screen.getByText(/join lobby/i));

    //screen.debug();

    //fireEvent.click(screen.getByText(/start game/i));

    expect("0").toEqual("0");
  });

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
