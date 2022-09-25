import { DockerUtils } from '../../utils/dockerUtils';

export const command = 'cleanup';
export const desc = 'Cleanup docker unused images and volumes';
export const builder = {};
export const handler = async (): Promise<void> => {
  DockerUtils.cleanup();
};
