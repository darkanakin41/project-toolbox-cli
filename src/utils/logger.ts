export module Logger {
  let verbose = false;

  export function setVerbose(value: boolean) {
    verbose = value;
  }

  export function debug(message: string) {
    if (verbose) {
      console.log(message);
    }
  }

  export function info(message: string): void {
    console.info(message);
  }

  export function success(message: string): void {
    console.log(message);
  }

  export function warn(message: string): void {
    console.warn(message);
  }

  export function error(message: string, quit: boolean = false): void {
    console.error(message);
    if (quit) {
      process.exit(1);
    }
  }
}
