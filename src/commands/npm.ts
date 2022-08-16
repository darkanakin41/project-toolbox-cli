import { CommandBuilder, Options } from 'yargs';

export const command: string = 'npm <command>';
export const desc: string = 'NPM tools';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('npm');
export const handler = {};
