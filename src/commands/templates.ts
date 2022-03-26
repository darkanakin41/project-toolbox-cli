import { CommandBuilder, Options } from 'yargs';

export const command: string = 'templates <command>';
export const desc: string = 'Templates management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('templates');
export const handler = {};
