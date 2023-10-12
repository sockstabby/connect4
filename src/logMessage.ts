const DEBUG = false;

export const logMessage = (...args: unknown[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};
