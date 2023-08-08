import { useState, useEffect, useRef } from "react";
import TrafficLight, { TrafficLightState } from "./TrafficLight";

interface TrafficControllerProps {
  direction1InitialRed: boolean;
  redDuration: number;
  yellowDuration: number;
}

//function TrafficController() {
const TrafficController: React.FC<TrafficControllerProps> = ({
  direction1InitialRed,
  redDuration = 5000,
  yellowDuration = 2000,
}) => {
  const [isDirection1Red, setIsDirection1Red] = useState(direction1InitialRed);
  const [isDirection1Yellow, setIsDirection1Yellow] = useState(false);
  const [isDirection2Yellow, setIsDirection2Yellow] = useState(false);

  const yellowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (redTimerRef.current) {
      return;
    }
    yellowTimerRef.current = setTimeout(() => {
      setIsDirection1Yellow(() => (isDirection1Red ? false : true));
      setIsDirection2Yellow(() => (!isDirection1Red ? false : true));

      yellowTimerRef.current = null;

      //if isDirection1Red
    }, yellowDuration);
    return () => {
      if (yellowTimerRef.current != null) {
        clearTimeout(yellowTimerRef.current);
      }
    };
  }, [isDirection1Red]);

  useEffect(() => {
    if (yellowTimerRef.current) {
      return;
    }
    redTimerRef.current = setTimeout(() => {
      setIsDirection1Yellow(false);
      setIsDirection2Yellow(false);

      setIsDirection1Red(() => (!isDirection1Red ? true : false));

      redTimerRef.current = null;

      false;
    }, redDuration);
    return () => {
      if (redTimerRef.current != null) {
        clearTimeout(redTimerRef.current);
      }
    };
  }, [isDirection1Yellow, isDirection2Yellow]);

  function getTrafficLightState() {
    if (isDirection1Yellow || isDirection2Yellow) {
      if (isDirection1Yellow) {
        return [TrafficLightState.yellow, TrafficLightState.red];
      }
      return [TrafficLightState.red, TrafficLightState.yellow];
    } else {
      if (isDirection1Red) {
        return [TrafficLightState.red, TrafficLightState.green];
      }
      return [TrafficLightState.green, TrafficLightState.red];
    }
  }

  const [trafficLight1State, trafficLight2State] = getTrafficLightState();

  return (
    <div className="traffic-light-controller">
      <TrafficLight trafficLightState={trafficLight1State} />
      <TrafficLight trafficLightState={trafficLight2State} />
    </div>
  );
};

export default TrafficController;
