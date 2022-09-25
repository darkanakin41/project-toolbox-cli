export class Logger {
  private static verbose = false;

  static setVerbose(value: boolean) {
    this.verbose = value;
  }

  static debug(message: string) {
    if (this.verbose) {
      console.log(message);
    }
  }

  static info(message: string): void {
    console.info(message);
  }

  static success(message: string): void {
    console.log(message);
  }

  static warn(message: string): void {
    console.warn(message);
  }

  static error(message: string, quit = false): void {
    console.error(message);
    if (quit) {
      process.exit(1);
    }
  }
}
