const DEBUG = true;

export const logMessage = (...args: unknown[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};
