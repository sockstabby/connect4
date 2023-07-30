import "./App.css";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFetch } from "./useFetch";

const App: React.FC<{}> = ({}) => {
  const [url, setUrl] = useState("http://localhost:3000/users");

  const { isLoading, serverError, apiData } = useFetch(url);

  const myFunction = () => {
    if (url === "http://localhost:3000/users") {
      setUrl("http://localhost:3000/users2");
    } else {
      setUrl("http://localhost:3000/users");
    }
  };

  return (
    <>
      <button onClick={myFunction}>Fetch</button>
    </>
  );
};
export default App;
