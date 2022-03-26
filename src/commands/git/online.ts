import { Git } from '../../utils/git';
import { ConfigManager } from '../../utils/config';

export const command: string = 'online';
export const desc: string = 'Open git repository in web browser';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  const url = await Git.getPublicUrl(data.project.root);

  if (url) {
    console.log(`[git] ${projectName}: opening repo in browser`);
    console.log(url);
  } else {
    console.error(`[git] ${projectName}: not url found`);
  }
};
