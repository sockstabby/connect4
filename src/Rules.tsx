import CheckCircle from "../src/assets/check-circle.svg";

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

export default Rules;
