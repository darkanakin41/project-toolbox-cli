import { Arguments, Options } from 'yargs'
import path from 'path'
import { Git } from '../../utils/git'

export const command: string = 'pull-request'
export const desc: string = 'Open the pull request screen creation for the repository in web browser'
export const builder = {
  list: {
    default: true,
    describe: 'Display the list of pull requests'
  },
  create: {
    default: false,
    describe: 'Open the creation page for Pull Requests'
  }
}
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const projectName = path.parse(process.cwd()).base

  let url = null
  if (argv.list) {
    url = await Git.getPullRequestListUrl(process.cwd())
  } else if (argv.create) {
    url = await Git.getPullRequestCreateUrl(process.cwd())
  }
  if (url) {
    console.log(`[git] ${projectName}: opening pull request page in browser`)
    console.log(open)
  } else {
    console.error(`[git] ${projectName}: not url found`)
  }
}
