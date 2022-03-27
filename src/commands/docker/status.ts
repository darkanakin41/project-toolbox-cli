import { Docker } from '../../utils/docker';
import { ConfigManager } from '../../utils/config';
import { Logger } from '../../utils/logger';

export const command: string = 'status';
export const desc: string = 'Get the status of the current project';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();
  const projectName = data.project.name;

  if (Docker.isDockerized(data.project.root)) {
    Logger.success(`[docker] ${projectName}: dockerized`);
  } else {
    Logger.error(`[docker] ${projectName}: not dockerized`);
  }
};
