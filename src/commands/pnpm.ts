import { CommandBuilder, Options } from 'yargs';

export const command: string = 'pnpm <command>';
export const desc: string = 'Pnpm management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('pnpm');
export const handler = {};
