import { Git } from '../../utils/git';
import { ConfigManager } from '../../utils/config';
import { Logger } from '../../utils/logger';

export const command: string = 'online';
export const desc: string = 'Open git repository in web browser';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  const url = await Git.getPublicUrl(data.project.root);

  if (url) {
    Logger.success(`[git] ${projectName}: click on the following url : ${url}`);
  } else {
    Logger.error(`[git] ${projectName}: not url found`, true);
  }
};
