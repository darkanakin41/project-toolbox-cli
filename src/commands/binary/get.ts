import { Arguments, CommandBuilder, Options } from 'yargs';
import { BinaryManager } from '../../utils/binaryManager';
import { ConfigManager } from '../../utils/config';

export const command: string = 'get <binaryName>';
export const desc: string = 'Get binary';
export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs.positional('binaryName', { type: 'string', required: true })
};
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const binaryName: string = argv.binaryName as string

  console.log(BinaryManager.retrieveBinary(binaryName))
};
