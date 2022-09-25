import { CommandBuilder, Options } from 'yargs';

export const command = 'pnpm <command>';
export const desc = 'Pnpm management';
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('pnpm');
export const handler = {};
