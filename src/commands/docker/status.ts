import { DockerUtils } from '../../utils/dockerUtils';
import { ConfigManager } from '../../utils/config';
import { Logger } from '../../utils/logger';

export const command = 'status';
export const desc = 'Get the status of the current project';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  if (DockerUtils.isDockerized(data.project.root)) {
    Logger.success(`[docker] ${projectName}: dockerized`);
  } else {
    Logger.error(`[docker] ${projectName}: not dockerized`);
    return;
  }
};
