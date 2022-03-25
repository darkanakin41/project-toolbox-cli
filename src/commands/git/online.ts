import { Arguments, Options } from 'yargs'
import path from 'path'
import open from 'open';
import { Git } from '../../utils/git';

export const command: string = 'online'
export const desc: string = 'Open git repository in web browser'
export const builder = {}
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const projectName = path.parse(process.cwd()).base

  const url = await Git.getPublicUrl(process.cwd())

  if (url) {
    console.log(`[git] ${projectName}: opening repo in browser`)
    open(url)
  } else {
    console.error(`[git] ${projectName}: not url found`)
  }
};
