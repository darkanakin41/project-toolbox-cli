#! /usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

require('./libs/sjsonnet');

yargs(hideBin(process.argv))
  // Use the commands directory to scaffold.
  .commandDir('commands')
  // Enable strict mode.
  .strict()
  // Useful aliases.
  .alias({ h: 'help' }).argv;
