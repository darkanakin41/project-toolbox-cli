import { CommandBuilder, Options } from 'yargs';

export const command: string = 'git <command>';
export const desc: string = 'Git management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('git');
export const handler = {};
