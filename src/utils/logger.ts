export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
