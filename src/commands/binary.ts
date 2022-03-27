import { CommandBuilder, Options } from 'yargs';

export const command: string = 'binary <command>';
export const desc: string = 'Binaries management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('binary');
export const handler = {};
