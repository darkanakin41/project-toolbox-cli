#! /usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Logger } from './utils/logger';

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
  .alias({ h: 'help' }).argv;
