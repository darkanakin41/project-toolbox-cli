import { CommandBuilder, Options } from 'yargs';

export const command = 'git <command>';
export const desc = 'Git management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('git');
export const handler = {};
