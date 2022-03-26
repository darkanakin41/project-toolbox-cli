import { CommandBuilder, Options } from 'yargs';

export const command: string = 'docker <command>';
export const desc: string = 'Docker';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('docker');
export const handler = {};
