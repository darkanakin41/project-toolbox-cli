import { ConfigManager } from '../utils/config';

export const command = 'install';
export const desc = 'Install the cli properly';
export const builder = {};
export const handler = async (): Promise<void> => {
  if (!ConfigManager.isProjectToolboxFolder(process.env.PWD) && ConfigManager.isProjectToolboxEnabled(process.env.OLDPWD)) {
    console.log(`export PATH=${ConfigManager.generateNewPath(false, process.env.OLDPWD)}`);
    return;
  }

  if (ConfigManager.isProjectToolboxFolder() && !ConfigManager.isProjectToolboxEnabled()) {
    console.log(`export PATH=${ConfigManager.generateNewPath(true)}`);
    return;
  }
};
