import { Arguments, CommandBuilder, Options } from 'yargs';
import { Git } from '../../utils/git';
import { ConfigManager } from '../../utils/config';
import { Logger } from '../../utils/logger';

export const command = 'pull-request';
export const desc = 'Open the pull request screen creation for the repository in web browser';
export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs.options({
    create: {
      describe: 'Open the creation page for Pull Requests',
    },
  });
};

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  let url = await Git.getPullRequestListUrl(data.project.root);
  if (argv.create) {
    url = await Git.getPullRequestCreateUrl(data.project.root);
  }
  if (url) {
    Logger.success(`[git] ${projectName}: click on the following url : ${url}`);
  } else {
    Logger.error(`[git] ${projectName}: not url found`, true);
  }
};
