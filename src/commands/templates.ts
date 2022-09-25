import { CommandBuilder, Options } from 'yargs';

export const command = 'templates <command>';
export const desc = 'Templates management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('templates');
export const handler = {};
