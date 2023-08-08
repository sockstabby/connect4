import "./App.css";
import TrafficController from "./TrafficController";

const App = () => {
  // caller will call even for items that should not be rendered.
  // in that case we just draw a div to make up the height and we uppercase
  // the text to show that this item is not loaded yet.

  return (
    <TrafficController
      direction1InitialRed={false}
      redDuration={3000}
      yellowDuration={2000}
    />
  );
};
export default App;
