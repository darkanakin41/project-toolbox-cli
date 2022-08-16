import { DockerUtils } from '../../utils/dockerUtils';

export const command: string = 'cleanup';
export const desc: string = 'Cleanup docker unused images and volumes';
export const builder = {};
export const handler = async (): Promise<void> => {
  DockerUtils.cleanup();
};
