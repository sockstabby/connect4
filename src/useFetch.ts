import { useEffect, useState } from "react";

const useFetch = (url: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    setIsLoading(true);

    const controller = new AbortController();
    const signal = controller.signal;

    fetch(url, { signal })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setApiData(data);
        setServerError(null);
      })
      .catch((e) => {
        setServerError(e);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  return { isLoading, apiData, serverError };
};

export { useFetch };
