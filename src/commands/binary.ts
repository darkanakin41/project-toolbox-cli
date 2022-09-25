import { CommandBuilder, Options } from 'yargs';

export const command = 'binary <command>';
export const desc = 'Binaries management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('binary');
export const handler = {};
