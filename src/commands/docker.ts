import { CommandBuilder, Options } from 'yargs';

export const command = 'docker <command>';
export const desc = 'Docker';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('docker');
export const handler = {};
