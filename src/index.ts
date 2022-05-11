#! /usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Logger } from './utils/logger';
import { exit } from 'process';

try{
yargs(hideBin(process.argv))
  // Use the commands directory to scaffold.
  .commandDir('commands')
  .options({
    verbose: {
      describe: 'Run in verbose mode',
    },
  })
  // Enable strict mode.
  .strict()
  // Middleware to run before commands.
  .middleware([
    (argv) => {
      if (argv.verbose) {
        Logger.setVerbose(true);
      }
    },
  ])
  // Enable completion.
  .completion()
  // Useful aliases.
  .alias({ h: 'help' }).showHelpOnFail(false, 'Specify --help for available options').argv
}catch(error: unknown) {
  console.log('An error occured')
  if (error instanceof Error) {
    console.log(error.message);
  }
  exit(1);
}
  ;
