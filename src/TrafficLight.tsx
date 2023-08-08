export enum TrafficLightState {
  red,
  yellow,
  green,
}

interface TrafficLightProps {
  trafficLightState: TrafficLightState;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ trafficLightState }) => {
  const redFill = trafficLightState === TrafficLightState.red ? "red" : "gray";
  const yellowFill =
    trafficLightState === TrafficLightState.yellow ? "yellow" : "gray";
  const greenFill =
    trafficLightState === TrafficLightState.green ? "green" : "gray";

  return (
    <div className="traffic-light-controller__traffic_light">
      <svg height="100" width="100">
        <circle cx="50" cy="50" r="40" fill={redFill} />
      </svg>
      <svg height="100" width="100">
        <circle cx="50" cy="50" r="40" fill={yellowFill} />
      </svg>
      <svg height="100" width="100">
        <circle cx="50" cy="50" r="40" fill={greenFill} />
      </svg>
    </div>
  );
};

export default TrafficLight;
