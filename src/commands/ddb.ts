import { CommandBuilder, Options } from 'yargs'

export const command: string = 'ddb <command>'
export const desc: string = 'Ddb overrides'
export const builder: CommandBuilder<Options, Options> = (yargs) => yargs.commandDir('ddb')
export const handler = {}
