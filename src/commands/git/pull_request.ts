import { Arguments, Options } from 'yargs';
import { Git } from '../../utils/git';
import { ConfigManager } from '../../utils/config';

export const command: string = 'pull-request';
export const desc: string = 'Open the pull request screen creation for the repository in web browser';
export const builder = {
  list: {
    default: true,
    describe: 'Display the list of pull requests',
  },
  create: {
    default: false,
    describe: 'Open the creation page for Pull Requests',
  },
};
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  let url = null;
  if (argv.list) {
    url = await Git.getPullRequestListUrl(data.project.root);
  } else if (argv.create) {
    url = await Git.getPullRequestCreateUrl(data.project.root);
  }
  if (url) {
    console.log(`[git] ${projectName}: opening pull request page in browser`);
    console.log(url);
  } else {
    console.error(`[git] ${projectName}: not url found`);
  }
};
