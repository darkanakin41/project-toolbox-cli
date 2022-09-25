import { CommandBuilder, Options } from 'yargs';

export const command = 'npm <command>';
export const desc = 'NPM tools';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('npm');
export const handler = {};
